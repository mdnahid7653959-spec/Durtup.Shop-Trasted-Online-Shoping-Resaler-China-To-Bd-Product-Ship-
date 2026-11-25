import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  phone?: string | null;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: (FirebaseUser & { id: string }) | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (emailOrPhone: string, password: string, fullName: string) => Promise<void>;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache profile data in memory
const profileCache = new Map<string, Profile>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(() => {
    if (auth.currentUser) return auth.currentUser;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("durtup_active_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.uid || parsed.id)) {
            return parsed as any;
          }
        }
      } catch {}
    }
    return null;
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      let activeUid = auth.currentUser?.uid;
      if (!activeUid) {
        const cached = localStorage.getItem("durtup_active_user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            activeUid = parsed?.uid || parsed?.id;
          } catch {}
        }
      }
      if (activeUid) {
        const raw = localStorage.getItem("durtup_profile_" + activeUid);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      return null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string, currentUserObj?: FirebaseUser | null) => {
    // 1. Instant in-memory cache check (0ms)
    const cached = profileCache.get(userId);
    if (cached) {
      setProfile(cached);
      return;
    }

    // 2. Instant localStorage cache check (0ms)
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("durtup_profile_" + userId);
        if (raw) {
          const parsed = JSON.parse(raw) as Profile;
          profileCache.set(userId, parsed);
          setProfile(parsed);
        }
      } catch (e) {}
    }

    // 3. Instant optimistic profile from Firebase User if no cache found
    const targetUser = currentUserObj || auth.currentUser;
    const defaultProf: Profile = {
      id: userId,
      user_id: userId,
      email: targetUser?.email || "",
      phone: (targetUser as any)?.phoneNumber || null,
      full_name: targetUser?.displayName || "User",
      role: "customer",
      avatar_url: targetUser?.photoURL || null
    };

    // Set optimistic profile immediately so UI is responsive with 0ms delay
    setProfile((prev) => prev || defaultProf);

    // 4. Background non-blocking Firestore sync
    try {
      const docRef = doc(db, "profiles", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        profileCache.set(userId, data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("durtup_profile_" + userId, JSON.stringify(data));
          } catch (e) {}
        }
        setProfile(data);
      } else {
        profileCache.set(userId, defaultProf);
        // Create the document in background if missing
        setDoc(docRef, { ...defaultProf, created_at: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } catch (error) {
      console.warn("Background profile fetch notice:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userWithId = Object.assign(firebaseUser, { id: firebaseUser.uid });
        setUser(userWithId as any);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("durtup_active_user", JSON.stringify({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            }));
          } catch {}
        }
        fetchProfile(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("durtup_active_user");
          } catch {}
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (emailOrPhone: string, password: string, fullName: string) => {
    const isEmail = emailOrPhone.includes("@");
    let cleanPhone: string | null = null;
    let effectiveEmail = emailOrPhone.trim().toLowerCase();

    if (!isEmail) {
      const rawDigits = emailOrPhone.replace(/\D/g, "");
      cleanPhone = rawDigits;
      if (cleanPhone.startsWith("880") && cleanPhone.length === 13) {
        cleanPhone = "0" + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith("88") && cleanPhone.length === 13) {
        cleanPhone = cleanPhone.slice(2);
      }

      if (cleanPhone.length < 10) {
        throw new Error("অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX) অথবা বৈধ ইমেইল দিন।");
      }
      effectiveEmail = `${cleanPhone}@durtup.shop`;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, effectiveEmail, password);
    const firebaseUser = userCredential.user;
    
    if (firebaseUser) {
      const newProf: Profile = {
        id: firebaseUser.uid,
        user_id: firebaseUser.uid,
        email: effectiveEmail,
        phone: cleanPhone || null,
        full_name: fullName,
        role: "customer",
        avatar_url: null
      };

      // 1. Instant local state & cache update (0ms)
      profileCache.set(firebaseUser.uid, newProf);
      setProfile(newProf);
      const userWithId = Object.assign(firebaseUser, { id: firebaseUser.uid });
      setUser(userWithId as any);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("durtup_active_user", JSON.stringify({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            phone: cleanPhone || null,
            displayName: fullName,
            photoURL: null
          }));
          localStorage.setItem("durtup_profile_" + firebaseUser.uid, JSON.stringify(newProf));
        } catch (e) {}
      }

      const { registerUserLocally } = await import("@/integrations/firebase/client");
      registerUserLocally(newProf);

      // 2. Background non-blocking updates (displayName + Firestore + Referral code)
      updateProfile(firebaseUser, { displayName: fullName }).catch(() => {});
      setDoc(doc(db, "profiles", firebaseUser.uid), {
        ...newProf,
        phone: cleanPhone || null,
        created_at: new Date().toISOString()
      }, { merge: true }).then(async () => {
        const { ensureUserReferralProfile } = await import("@/services/referralService");
        ensureUserReferralProfile(firebaseUser.uid, effectiveEmail, fullName).catch(() => {});
      }).catch((err) => {
        console.warn("Background profile doc create notice:", err);
      });
    }
  }, []);

  const signIn = useCallback(async (emailOrPhone: string, password: string) => {
    const isEmail = emailOrPhone.includes("@");
    let effectiveEmail = emailOrPhone.trim().toLowerCase();
    let cleanPhone: string | null = null;

    if (!isEmail) {
      cleanPhone = emailOrPhone.replace(/\D/g, "");
      if (cleanPhone.startsWith("880") && cleanPhone.length === 13) {
        cleanPhone = "0" + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith("88") && cleanPhone.length === 13) {
        cleanPhone = cleanPhone.slice(2);
      }

      // Check local cache of registered users
      if (typeof window !== "undefined") {
        try {
          const registeredUsersRaw = localStorage.getItem("durtup_registered_users");
          if (registeredUsersRaw) {
            const registeredUsers = JSON.parse(registeredUsersRaw);
            if (Array.isArray(registeredUsers)) {
              const matched = registeredUsers.find((u: any) => 
                (u.phone && u.phone.replace(/\D/g, "") === cleanPhone) ||
                (u.email && u.email.startsWith(cleanPhone!))
              );
              if (matched && matched.email) {
                effectiveEmail = matched.email;
              }
            }
          }
        } catch {}
      }

      // Default synthetic email if not mapped
      if (!effectiveEmail.includes("@")) {
        effectiveEmail = `${cleanPhone}@durtup.shop`;
      }
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, effectiveEmail, password);
      if (cred.user) {
        const userWithId = Object.assign(cred.user, { id: cred.user.uid });
        setUser(userWithId as any);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("durtup_active_user", JSON.stringify({
              id: cred.user.uid,
              uid: cred.user.uid,
              email: cred.user.email,
              phone: cleanPhone,
              displayName: cred.user.displayName,
              photoURL: cred.user.photoURL
            }));
          } catch {}
        }
        fetchProfile(cred.user.uid, cred.user);
      }
    } catch (err: any) {
      // If signin failed and it was a phone number that had a mapped custom email, retry with synthetic email
      if (!isEmail && cleanPhone && effectiveEmail !== `${cleanPhone}@durtup.shop`) {
        const fallbackCred = await signInWithEmailAndPassword(auth, `${cleanPhone}@durtup.shop`, password);
        if (fallbackCred.user) {
          const userWithId = Object.assign(fallbackCred.user, { id: fallbackCred.user.uid });
          setUser(userWithId as any);
          fetchProfile(fallbackCred.user.uid, fallbackCred.user);
          return;
        }
      }
      throw err;
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const uid = auth.currentUser?.uid || (user as any)?.uid || (user as any)?.id;
    if (typeof window !== "undefined") {
      try {
        if (uid) localStorage.removeItem("durtup_profile_" + uid);
        localStorage.removeItem("durtup_active_user");
        // M1 Privacy Requirement: Clear local cart and cart ownership keys
        localStorage.removeItem("megamart_cart");
        localStorage.removeItem("megamart_cart_owner");
        localStorage.removeItem("cj_cart");
      } catch (e) {}
    }
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    profileCache.clear();
  }, [user]);

  const userWithId = useMemo(() => {
    if (!user) return null;
    return new Proxy(user, {
      get(target, prop) {
        if (prop === 'id') return target.uid;
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }
    }) as any;
  }, [user]);

  const isAdmin = profile?.role === "admin";
  const isSeller = profile?.role === "seller" || isAdmin;

  const handleGoogleSignIn = useCallback(async () => {
    const { signInWithGoogle } = await import("@/integrations/firebase/client");
    await signInWithGoogle();
  }, []);

  const value = useMemo(() => ({
    user: userWithId,
    session: userWithId ? { user: userWithId } : null,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut,
    isAdmin,
    isSeller
  }), [userWithId, profile, loading, signUp, signIn, handleGoogleSignIn, signOut, isAdmin, isSeller]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
