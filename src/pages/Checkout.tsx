import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { CreditCard, Truck, Shield, ArrowLeft, Loader2, ChevronDown, ChevronUp, CheckCircle, Globe, Tag, X, MapPin, Phone, User as UserIcon, Plus, Edit3, CheckCircle2, Home, Banknote, Smartphone, ArrowRight, Copy, PackageCheck, ShoppingBag, Sparkles, Send, AlertCircle, Check, Coins, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useCart } from "@/contexts/CartContext";
import { useCJCart } from "@/hooks/useCJCart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/firebaseAdapter";
import { auth, db } from "@/integrations/firebase/client";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { sendTelegramOrderNotification } from "@/utils/telegramNotifier";
import { trackPurchase } from "@/components/FacebookPixel";
import { checkFirstOrderDiscountEligibility, DiscountEligibilityResult } from "@/services/referralService";
import { triggerCustomerOrderPhoneNotification } from "@/services/customerNotificationService";
import { markCartAsRecovered, recordOrUpdateCartState } from "@/services/abandonedCartService";
import { getCategoryFallbackImage, getDirectImageUrl } from "@/utils/productImageHelper";
import {
  getUserLoyaltyAccount,
  getLoyaltySettings,
  redeemPointsAtCheckout,
  LoyaltyAccount,
  LoyaltySettings
} from "@/services/loyaltyService";
import { CustomerAuthModal } from "@/components/auth/CustomerAuthModal";


interface AppliedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
}

export default function Checkout() {
  const { items: regularItems, subtotal: regularSubtotal, clearCart, loading: cartLoading } = useCart();
  const { items: cjItems, subtotal: cjSubtotal, clearCart: clearCJCart, loading: cjLoading } = useCJCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    orderNumber: string;
    total: number;
    paymentMethod: string;
    customerName: string;
    phone: string;
    address: string;
    city: string;
    productName: string;
  } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"shipping" | "payment">("shipping");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // bKash payment inputs
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Bangladesh"
  });
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

  // Prefill shipping info from profile + default address so user doesn't retype
  useEffect(() => {
    const loadSaved = async () => {
      // 1. Check local storage first for instant response
      let localAddr = null;
      try {
        const raw = localStorage.getItem("durtup_saved_address");
        if (raw) localAddr = JSON.parse(raw);
      } catch { }

      if (!user) {
        if (localAddr?.address && localAddr?.city && localAddr?.phone) {
          const [first = "", ...rest] = (localAddr.fullName || "").split(" ");
          setShippingInfo(prev => ({
            firstName: prev.firstName.trim() || first,
            lastName: prev.lastName.trim() || rest.join(" "),
            email: prev.email.trim() || localAddr.email || "",
            phone: prev.phone.trim() || localAddr.phone || "",
            address: prev.address.trim() || localAddr.address || "",
            city: prev.city.trim() || localAddr.city || "",
            state: prev.state.trim() || localAddr.state || "",
            zipCode: prev.zipCode.trim() || localAddr.zipCode || "",
            country: prev.country.trim() || localAddr.country || "Bangladesh"
          }));
          setHasSavedAddress(true);
          setIsEditingAddress(false);
        } else {
          setHasSavedAddress(false);
          setIsEditingAddress(true);
        }
        return;
      }

      try {
        const [{ data: profile }, { data: addressesData }] = await Promise.all([
          supabase.from("profiles").select("full_name, phone, email").eq("user_id", user.id).maybeSingle(),
          supabase.from("addresses").select("*").eq("user_id", user.id),
        ]);

        const addresses = Array.isArray(addressesData) ? addressesData : [];
        const address = addresses.find((a: any) => a.is_default) || addresses[0] || null;

        const effectiveFullName = profile?.full_name || address?.full_name || localAddr?.fullName || "";
        const [first = "", ...rest] = effectiveFullName.split(" ");
        const effectivePhone = profile?.phone || address?.phone || localAddr?.phone || "";
        const effectiveStreet = address?.address_line1 || localAddr?.address || "";
        const effectiveCity = address?.city || localAddr?.city || "";
        const effectiveState = address?.state || localAddr?.state || "";
        const effectiveZip = address?.postal_code || localAddr?.zipCode || "";
        const effectiveCountry = address?.country || localAddr?.country || "Bangladesh";
        const effectiveEmail = profile?.email || user.email || localAddr?.email || "";

        setShippingInfo(prev => ({
          firstName: prev.firstName.trim() || first,
          lastName: prev.lastName.trim() || rest.join(" "),
          email: prev.email.trim() || effectiveEmail,
          phone: prev.phone.trim() || effectivePhone,
          address: prev.address.trim() || effectiveStreet,
          city: prev.city.trim() || effectiveCity,
          state: prev.state.trim() || effectiveState,
          zipCode: prev.zipCode.trim() || effectiveZip,
          country: prev.country.trim() || effectiveCountry || "Bangladesh",
        }));

        if (address?.id) setSavedAddressId(address.id);

        if (effectiveStreet.trim() && effectiveCity.trim() && effectivePhone.trim()) {
          setHasSavedAddress(true);
          setIsEditingAddress(false);
        } else {
          setHasSavedAddress(false);
          setIsEditingAddress(true);
        }
      } catch (err) {
        console.warn("Failed loading saved checkout address:", err);
        setHasSavedAddress(false);
        setIsEditingAddress(true);
      }
    };

    loadSaved();
  }, [user]);

  // Combined items and totals
  const totalItems = regularItems.length + cjItems.length;
  const subtotal = regularSubtotal + cjSubtotal;
  const totalQuantity = regularItems.reduce((acc, item) => acc + item.quantity, 0) +
    cjItems.reduce((acc, item) => acc + item.quantity, 0);
  const shipping = totalItems > 0 ? 60 : 0;
  const tax = 0; // Tax is removed

  // Calculate coupon discount (handles both "percentage" and "flat" types)
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;

    let discount = 0;
    if (appliedCoupon.discount_type === "percentage") {
      discount = Math.round(subtotal * (appliedCoupon.discount_value / 100));
      if (appliedCoupon.max_discount_amount && discount > appliedCoupon.max_discount_amount) {
        discount = appliedCoupon.max_discount_amount;
      }
    } else {
      // "flat" or any other type = fixed amount discount
      discount = appliedCoupon.discount_value;
    }
    return Math.min(discount, subtotal); // Can't discount more than subtotal
  }, [appliedCoupon, subtotal]);

  // Referral first-order discount eligibility check
  const [referralEligibility, setReferralEligibility] = useState<DiscountEligibilityResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    checkFirstOrderDiscountEligibility(user?.id || null, subtotal).then(res => {
      if (isMounted) setReferralEligibility(res);
    }).catch(() => { });
    return () => { isMounted = false; };
  }, [user?.id, subtotal]);

  const referralDiscount = referralEligibility?.eligible ? referralEligibility.discountAmount : 0;

  // Loyalty Points State & Calculations
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getLoyaltySettings(),
      user?.id ? getUserLoyaltyAccount(user.id) : Promise.resolve(null)
    ]).then(([settings, account]) => {
      if (isMounted) {
        setLoyaltySettings(settings);
        setLoyaltyAccount(account);
      }
    }).catch((e) => console.warn("Loyalty data fetch in Checkout:", e));
    return () => { isMounted = false; };
  }, [user?.id]);

  const maxRedeemablePoints = useMemo(() => {
    if (!loyaltyAccount || !loyaltySettings || !loyaltySettings.enabled) return 0;
    const currentPts = loyaltyAccount.points || 0;
    if (currentPts < (loyaltySettings.minPointsToRedeem || 50)) return 0;

    const maxDiscountAllowed = Math.floor(subtotal * ((loyaltySettings.maxPointsRedemptionPercent || 50) / 100));
    const pointsNeededForMaxDiscount = Math.floor(maxDiscountAllowed / (loyaltySettings.pointValueInTaka || 0.5));

    return Math.min(currentPts, pointsNeededForMaxDiscount);
  }, [loyaltyAccount, loyaltySettings, subtotal]);

  const pointsToRedeem = useLoyaltyPoints ? maxRedeemablePoints : 0;
  const loyaltyDiscount = useLoyaltyPoints
    ? Math.round(pointsToRedeem * (loyaltySettings?.pointValueInTaka || 0.5))
    : 0;

  // Wallet & Cashback Balance State
  const [userWalletBalance, setUserWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    getDoc(doc(db, "profiles", user.id)).then((snap) => {
      if (isMounted && snap.exists()) {
        const d = snap.data();
        setUserWalletBalance(Number(d.wallet_balance || d.walletBalance || 0));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [user?.id]);

  const netBeforeWallet = Math.max(0, subtotal + shipping + tax - couponDiscount - referralDiscount - loyaltyDiscount);
  const walletDiscount = useWalletBalance ? Math.min(userWalletBalance, netBeforeWallet) : 0;
  const total = Math.max(0, netBeforeWallet - walletDiscount);

  // bKash copy states and handlers
  const [copiedBkashNumber, setCopiedBkashNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const handleCopyBkashNumber = () => {
    navigator.clipboard.writeText("01885985097");
    setCopiedBkashNumber(true);
    toast({ title: "নম্বর কপি হয়েছে!", description: "01885985097 কপি করা হয়েছে" });
    setTimeout(() => setCopiedBkashNumber(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(total.toString());
    setCopiedAmount(true);
    toast({ title: "টাকার পরিমাণ কপি হয়েছে!", description: `৳${total.toLocaleString()} কপি করা হয়েছে` });
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyCoupon = async (explicitCode?: string) => {
    const rawCode = (explicitCode || couponCode).trim().toUpperCase();
    if (!rawCode) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a coupon code" });
      return;
    }

    setApplyingCoupon(true);
    try {
      let coupon: any = null;

      // 1. Special Promo Code: DURTUP2026 gives 20% discount!
      if (rawCode === "DURTUP2026") {
        coupon = {
          code: "DURTUP2026",
          discount_type: "percentage",
          discount_value: 20,
          max_discount_amount: null,
          min_order_amount: 0,
          is_active: true,
        };
      } else {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", rawCode)
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          coupon = data;
        } else {
          // Check Firestore coupons collection
          try {
            const snap = await getDoc(doc(db, "coupons", rawCode));
            if (snap.exists()) {
              const fData = snap.data();
              if (fData.is_active !== false) coupon = fData;
            } else {
              const allSnap = await getDocs(collection(db, "coupons"));
              allSnap.forEach(d => {
                const cData = d.data();
                if ((cData.code === rawCode || d.id === rawCode) && cData.is_active !== false) {
                  coupon = cData;
                }
              });
            }
          } catch (e) {
            console.warn("Firestore coupon lookup error:", e);
          }
        }
      }

      if (!coupon) {
        toast({ variant: "destructive", title: "Invalid coupon", description: "This coupon code is not valid" });
        return;
      }

      // Check if coupon is expired
      if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
        toast({ variant: "destructive", title: "Expired", description: "This coupon has expired" });
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast({
          variant: "destructive",
          title: "Minimum not met",
          description: `Minimum order amount is ৳${coupon.min_order_amount.toLocaleString()}`
        });
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast({ variant: "destructive", title: "Limit reached", description: "This coupon has reached its usage limit" });
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount
      });

      const calculatedDiscount = coupon.discount_type === "percentage"
        ? Math.min(Math.round(subtotal * (coupon.discount_value / 100)), coupon.max_discount_amount || Infinity)
        : coupon.discount_value;

      toast({
        title: "Coupon applied! 🎉",
        description: `Coupon "${coupon.code}" applied! You got 20% discount (Saved ৳${calculatedDiscount.toLocaleString()})`
      });
      setCouponCode("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Coupon removed" });
  };

  // Auto-apply pending coupon passed from Cart page or URL query
  useEffect(() => {
    if (subtotal <= 0 || appliedCoupon) return;
    const urlCoupon = searchParams.get("coupon")?.trim();
    let storedCoupon = "";
    try {
      storedCoupon = sessionStorage.getItem("durtup_pending_coupon")?.trim() || "";
    } catch { }
    const incomingCode = urlCoupon || storedCoupon;
    if (incomingCode) {
      try { sessionStorage.removeItem("durtup_pending_coupon"); } catch { }
      applyCoupon(incomingCode);
    }
  }, [subtotal, appliedCoupon, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalItems === 0) {
      toast({ variant: "destructive", title: "Cart is empty", description: "Please add items to your cart" });
      return;
    }

    // Step 1: Validate Shipping Address & Transition to Payment Method
    if (checkoutStep === "shipping") {
      if (!shippingInfo.firstName.trim() || !shippingInfo.phone.trim() || !shippingInfo.address.trim() || !shippingInfo.city.trim()) {
        setIsEditingAddress(true);
        toast({
          variant: "destructive",
          title: "ঠিকানা আবশ্যক",
          description: "অর্ডার করতে দয়া করে আপনার নাম, মোবাইল নম্বর ও ঠিকানা পূরণ করুন।",
        });
        return;
      }

      // Save entered address to localStorage for convenience
      try {
        const fullNameCombined = `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim();
        localStorage.setItem("durtup_saved_address", JSON.stringify({
          fullName: fullNameCombined,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
          email: shippingInfo.email
        }));
        setHasSavedAddress(true);

        // Attach contact info to Abandoned Cart so it can be recovered if user drops off at payment!
        const effectiveTrackId = user?.id || (shippingInfo.phone ? `guest_${shippingInfo.phone.replace(/\D/g, "")}` : null);
        if (effectiveTrackId && regularItems.length > 0) {
          recordOrUpdateCartState(effectiveTrackId, regularItems, {
            name: fullNameCombined,
            phone: shippingInfo.phone,
            email: shippingInfo.email,
          }).catch(() => {});
        }
      } catch { }

      // Ensure customer authentication session (Google or auto-authenticated)
      if (!user && !auth.currentUser) {
        try {
          const { signInAnonymously } = await import("firebase/auth");
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn("[Checkout] Anonymous session notice:", anonErr);
        }
      }

      // Move to Payment Step
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 2: Finalize Payment & Place Order
    let currentUser = auth.currentUser;
    if (!currentUser && auth) {
      // Allow brief hydration window for auth.currentUser
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 600);
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          if (u) {
            currentUser = u;
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        });
      });
    }

    if (!currentUser) {
      try {
        const { signInAnonymously } = await import("firebase/auth");
        const anonCred = await signInAnonymously(auth);
        currentUser = anonCred.user;
      } catch (anonErr) {
        console.warn("[Checkout] Direct session notice:", anonErr);
      }
    }

    if (paymentMethod === "bkash") {
      if (!bkashNumber.trim()) {
        toast({
          variant: "destructive",
          title: "bKash Number Required",
          description: "Please enter the bKash mobile number you sent the payment from.",
        });
        return;
      }
      if (!bkashTrxId.trim()) {
        toast({
          variant: "destructive",
          title: "Transaction ID Required",
          description: "Please enter your bKash Transaction ID (TrxID).",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Fast cached token with refresh fallback
      let idToken = "";
      if (currentUser) {
        try {
          idToken = await Promise.race([
            currentUser.getIdToken(false),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Token timeout")), 2500))
          ]).catch(() => currentUser.getIdToken(true));
        } catch (tokErr) {
          console.warn("[Checkout] Token extraction warning:", tokErr);
        }
      }

      const notesCombined = [
        appliedCoupon ? `Coupon: ${appliedCoupon.code}` : null,
        paymentMethod === "bkash" ? `bKash Sender: ${bkashNumber} | TrxID: ${bkashTrxId}` : null
      ].filter(Boolean).join(" | ") || null;

      const enrichedItems = [
        ...regularItems.map(item => ({
          product_id: item.product_id || item.id,
          name: item.name || item.title || item.product?.name || "Product",
          price: Number(item.price || item.unit_price || item.product?.price || 0),
          image: item.image || item.product_image || item.product?.image_url || "",
          quantity: item.quantity || 1,
          selected_variants: item.selected_variants || (item.variant_name ? { variant: item.variant_name } : undefined),
          source: "regular" as const
        })),
        ...cjItems.map(item => ({
          product_id: item.id,
          name: item.name || item.title || "Product",
          price: Number(item.price || 0),
          image: item.image || item.product_image || "",
          quantity: item.quantity || 1,
          selected_variants: item.variant ? { variant: item.variant } : undefined,
          source: "cj" as const
        }))
      ];

      const orderPayload = {
        items: enrichedItems,
        shipping_address: {
          first_name: shippingInfo.firstName.trim(),
          last_name: shippingInfo.lastName.trim(),
          phone: shippingInfo.phone.trim(),
          address: shippingInfo.address.trim(),
          city: shippingInfo.city.trim(),
          state: shippingInfo.state?.trim() || "",
          zip_code: shippingInfo.zipCode?.trim() || "",
          country: shippingInfo.country || "Bangladesh"
        },
        payment_method: paymentMethod as "cod" | "bkash",
        bkash_details: paymentMethod === "bkash" ? {
          sender_number: bkashNumber.trim(),
          trx_id: bkashTrxId.trim()
        } : undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        notes: notesCombined || ""
      };

      // Strict 7-second abort controller so the UI never hangs
      const abortController = new AbortController();
      const abortTimeout = setTimeout(() => abortController.abort(), 7000);

      let response: Response | null = null;
      let resData: any = {};

      try {
        response = await fetch("/api/orders", {
          method: "POST",
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify(orderPayload)
        });
        resData = await response.json().catch(() => ({}));
      } catch (fetchErr: any) {
        console.warn("[Checkout] Fetch /api/orders error or timeout:", fetchErr);
      } finally {
        clearTimeout(abortTimeout);
      }

      let orderId = resData?.order_id;
      let orderNumber = resData?.order_number;
      let confirmedTotal = Number(resData?.total ?? total);
      const effectiveUserId = currentUser?.uid || user?.id || (shippingInfo.phone ? `guest_${shippingInfo.phone.replace(/\D/g, "")}` : "customer");

      // Handle non-ok response gracefully without stranding customer
      if (response && !response.ok) {
        console.warn(`[Checkout] Backend status ${response.status}: ${resData.error || "Unknown"}. Activating client fallback.`);
      }

      // If backend failed or timed out, activate seamless direct client fallback
      if (!orderId || !orderNumber) {
        console.warn("[Checkout] Activating high-resilience direct client fallback for order creation...");
        orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        confirmedTotal = total;

        const firstCartItem = enrichedItems[0];
        const clientDirectOrder = {
          id: orderId,
          order_id: orderId,
          order_number: orderNumber,
          orderNumber,
          user_id: effectiveUserId,
          customer_email: currentUser?.email || "",
          subtotal,
          shipping_cost: shippingCost,
          tax_amount: 0,
          discount_amount: totalDiscount,
          coupon_discount: couponDiscount,
          total: confirmedTotal,
          status: "pending",
          payment_status: paymentMethod === "cod" ? "pending" : "pending_verification",
          payment_method: paymentMethod,
          product_image: firstCartItem?.image || "/durtup-logo.png",
          product_name: firstCartItem?.name || "Product",
          total_items: enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0),
          items: enrichedItems,
          shipping_address: {
            firstName: shippingInfo.firstName.trim(),
            lastName: shippingInfo.lastName.trim(),
            phone: shippingInfo.phone.trim(),
            address: shippingInfo.address.trim(),
            city: shippingInfo.city.trim(),
            state: shippingInfo.state?.trim() || "",
            zipCode: shippingInfo.zipCode?.trim() || "",
            country: shippingInfo.country || "Bangladesh"
          },
          notes: notesCombined,
          bkash_details: paymentMethod === "bkash" ? { sender_number: bkashNumber.trim(), trx_id: bkashTrxId.trim() } : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Persist directly to Firestore
        await setDoc(doc(db, "orders", orderId), clientDirectOrder).catch((e) => {
          console.warn("[Checkout] Client direct setDoc warning:", e);
        });
      }

      try {

        // Record loyalty points redemption if used
        if (useLoyaltyPoints && pointsToRedeem > 0 && effectiveUserId && effectiveUserId !== "guest") {
          await redeemPointsAtCheckout(
            effectiveUserId,
            orderId,
            orderNumber,
            pointsToRedeem,
            loyaltyDiscount
          ).catch((loyErr) => console.warn("Loyalty redemption recording warning:", loyErr));
        }

        // Deduct wallet balance if customer used wallet/cashback to pay
        if (useWalletBalance && walletDiscount > 0 && effectiveUserId && effectiveUserId !== "guest") {
          try {
            const pRef = doc(db, "profiles", effectiveUserId);
            const pSnap = await getDoc(pRef);
            const curBal = Number(pSnap.data()?.wallet_balance || 0);
            const newBal = Math.max(0, curBal - walletDiscount);
            await setDoc(pRef, {
              wallet_balance: newBal,
              walletBalance: newBal,
              updated_at: new Date().toISOString()
            }, { merge: true });

            const wTxId = `tx-wallet-pay-${Date.now()}`;
            await setDoc(doc(db, "wallet_transactions", wTxId), {
              id: wTxId,
              userId: effectiveUserId,
              user_id: effectiveUserId,
              amount: walletDiscount,
              type: "debit",
              direction: "debit",
              category: "wallet_payment",
              status: "completed",
              order_id: orderId,
              order_number: orderNumber,
              orderId,
              orderNumber,
              description: `অর্ডার #${orderNumber} চেকআউটে ওয়ালেট/ক্যাশব্যাক থেকে পরিশোধ`,
              balance_after: newBal,
              created_at: new Date().toISOString()
            }, { merge: true });
          } catch (wErr) {
            console.warn("Wallet payment deduction warning:", wErr);
          }
        }

        // If referral attribution exists, create/record in referrals collection
        if (referralEligibility?.referrerId || referralEligibility?.referralCode) {
          const refId = `ref-${orderId}`;
          const refDoc = {
            id: refId,
            referralCode: referralEligibility.referralCode || "",
            referrerId: referralEligibility.referrerId || null,
            referredUserId: effectiveUserId,
            orderId: orderId,
            orderNumber: orderNumber,
            orderAmount: subtotal,
            rewardAmount: 50,
            newCustomerDiscount: referralDiscount,
            status: "pending",
            qualified: subtotal >= 500,
            rewarded: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setDoc(doc(db, "referrals", refId), refDoc, { merge: true }).catch((e) => console.warn("Referral doc sync notice:", e));
        }

      } catch (accountingErr) {
        console.warn("Post-order accounting sync warning:", accountingErr);
      }

      // Persist phone + full name to profile if logged in
      const fullNameCombined = `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim();
      if (user?.id) {
        try {
          await supabase.from("profiles").upsert({
            id: user.id,
            user_id: user.id,
            full_name: fullNameCombined || undefined,
            phone: shippingInfo.phone || undefined,
            updated_at: new Date().toISOString(),
          });
        } catch (e) { console.warn("profile update skipped", e); }
      }

      // Save / update default address so it prefills next time
      try {
        const addressPayload = {
          id: effectiveUserId,
          user_id: effectiveUserId,
          full_name: fullNameCombined || "Customer",
          phone: shippingInfo.phone,
          address_line1: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country: shippingInfo.country || "Bangladesh",
          is_default: true,
          updated_at: new Date().toISOString(),
        };
        await supabase.from("addresses").upsert(addressPayload);
        localStorage.setItem("durtup_saved_address", JSON.stringify({
          fullName: fullNameCombined,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
          email: shippingInfo.email
        }));
        setHasSavedAddress(true);
      } catch (e) { console.warn("address save skipped", e); }

      // Increment coupon used_count if a coupon was used
      if (appliedCoupon) {
        try {
          const { data: currentCoupon } = await supabase
            .from("coupons")
            .select("used_count")
            .eq("code", appliedCoupon.code)
            .single();

          if (currentCoupon) {
            await supabase
              .from("coupons")
              .update({ used_count: (currentCoupon.used_count || 0) + 1 })
              .eq("code", appliedCoupon.code);
          }
        } catch { }
      }



      // Forward order to dropship suppliers automatically if applicable
      try {
        if ((supabase as any)?.functions?.invoke) {
          const productIds = regularItems.map(i => i.product_id).filter(Boolean);
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from("products")
              .select("id, seller_id, sku")
              .in("id", productIds);

            if (products && products.length > 0) {
              const hasMohasagorItems = products.some(p =>
                p.seller_id === "mohasagor.com.bd" ||
                p.seller_id === "Mohasagor" ||
                p.sku?.startsWith("MOH-")
              );
              if (hasMohasagorItems) {
                await (supabase as any).functions.invoke("supplier-api", {
                  body: {
                    action: "forward-order",
                    supplierId: "da929859-f7fa-4590-a3ad-f7012eac5b8c",
                    payload: {
                      orderId: orderId,
                      shipping_address: {
                        name: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
                        phone: shippingInfo.phone,
                        address: shippingInfo.address,
                        city: shippingInfo.city,
                        state: shippingInfo.state,
                        zip: shippingInfo.zipCode,
                        country: shippingInfo.country
                      }
                    }
                  }
                }).catch(err => {
                  console.error("Automatic order forwarding failed for Mohasagor:", err);
                });
              }
            }
          }
        }
      } catch (forwardErr) {
        console.error("Failed to check or forward dropship orders:", forwardErr);
      }

      // Send Instant Telegram Notification directly to Admin's phone
      try {
        const itemSummary = [
          ...regularItems.map(i => ({
            name: i.product?.name || (i as any)?.name || "Item",
            quantity: i.quantity || 1,
            price: i.product?.discount_price || i.product?.regular_price || (i as any)?.price || 0
          })),
          ...cjItems.map(i => ({
            name: `[CJ] ${i.name}${i.variant ? ` (${i.variant})` : ''}`,
            quantity: i.quantity || 1,
            price: i.price || 0
          }))
        ];

        sendTelegramOrderNotification({
          orderNumber: orderNumber,
          customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
          phone: shippingInfo.phone,
          email: shippingInfo.email,
          address: shippingInfo.address,
          city: shippingInfo.city,
          paymentMethod: paymentMethod,
          total: confirmedTotal,
          items: itemSummary
        }).catch(err => {
          console.warn("Telegram order notification failed:", err);
        });
      } catch (tgErr) {
        console.warn("Telegram trigger error:", tgErr);
      }

      // Populate confirmed order details for the dedicated Success Screen
      const allCartItems = [...regularItems, ...cjItems];
      const firstCartItem = allCartItems[0];
      const primaryProductImage = (firstCartItem as any)?.image || (firstCartItem as any)?.product_image || (firstCartItem as any)?.productImage || (firstCartItem as any)?.product?.image_url || "/durtup-logo.png";
      const primaryProductName = (firstCartItem as any)?.product?.name || (firstCartItem as any)?.product_name || (firstCartItem as any)?.title || (firstCartItem as any)?.name || "Product";

      setConfirmedOrderData({
        orderNumber: orderNumber,
        total: confirmedTotal,
        paymentMethod: paymentMethod,
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim() || "Customer",
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city,
        productName: primaryProductName
      });
      // Clear both carts in background
      clearCart().catch(() => { });
      clearCJCart();

      // Mark abandoned cart as recovered immediately
      markCartAsRecovered(effectiveUserId, orderId, subtotal).catch(() => {});

      // 📱 Trigger Real Phone Push Notification on user device with product image & sound
      triggerCustomerOrderPhoneNotification({
        orderId,
        orderNumber,
        customerName: shippingInfo.firstName || "Customer",
        productName: primaryProductName,
        productImage: primaryProductImage,
        totalAmount: confirmedTotal,
        paymentMethod: paymentMethod,
      }).catch((err) => {
        console.warn("Customer push notification warning:", err);
      });

      toast({
        title: "অর্ডার সফলভাবে সম্পন্ন হয়েছে! 🎉",
        description: `আপনার অর্ডার #${orderNumber} কনফার্ম করা হয়েছে।`
      });

      // 📊 Fire Meta Pixel Purchase Event
      try {
        trackPurchase(orderId, confirmedTotal, allCartItems, "BDT");
      } catch (pxErr) {
        console.warn("Meta Pixel purchase event warning:", pxErr);
      }

      // 🚀 Instant redirect to Order Details Page
      navigate(`/orders/${orderId}`, { replace: true, state: { orderPlaced: true, orderNumber: orderNumber } });
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        variant: "destructive",
        title: "অর্ডার সম্পন্ন হতে সমস্যা হয়েছে",
        description: error.message || "অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced && confirmedOrderData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8 sm:py-12 max-w-2xl px-4 flex flex-col items-center justify-center">
          <div className="w-full bg-card border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Celebratory Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            {/* Header Text */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 🎉
              </h1>
              <p className="text-muted-foreground text-sm">
                ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে। খুব শীঘ্রই পার্সেলটি ডেলিভারির জন্য পাঠানো হবে।
              </p>
            </div>

            {/* Order Details Summary Box */}
            <div className="bg-muted/40 border rounded-xl p-4 sm:p-5 text-left space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-muted-foreground text-xs sm:text-sm">অর্ডার নম্বর (Order ID):</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                  <span>#{confirmedOrderData.orderNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(confirmedOrderData.orderNumber);
                      toast({ title: "Copied!", description: "Order ID copied to clipboard" });
                    }}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Copy Order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">পেমেন্ট মেথড:</span>
                <span className="font-semibold text-foreground">
                  {confirmedOrderData.paymentMethod === "cod" ? "Cash on Delivery (ক্যাশ অন ডেলিভারি)" : "bKash (বিকাশ)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">মোট মূল্য (Total Amount):</span>
                <span className="font-bold text-base text-primary">৳{confirmedOrderData.total.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">গ্রাহক:</span> {confirmedOrderData.customerName} ({confirmedOrderData.phone})</p>
                <p><span className="font-medium text-foreground">ঠিকানা:</span> {confirmedOrderData.address}, {confirmedOrderData.city}</p>
              </div>
            </div>

            {/* Verification Call Notice */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-left text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              <Phone className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  পার্সেল পাঠানোর পূর্বে ঠিকানা নিশ্চিত করার জন্য আমাদের কাস্টমার কেয়ার টিম আপনাকে কল করবে।
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Link to="/orders" className="w-full">
                <Button variant="outline" className="w-full h-11 font-semibold flex items-center justify-center gap-2">
                  <PackageCheck className="h-4 w-4" /> আমার অর্ডারসমূহ (My Orders)
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button className="w-full h-11 font-bold flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> আরও কেনাকাটা করুন
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartLoading || cjLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16 text-center pb-24 md:pb-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Loading checkout details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (totalItems === 0 && !loading && !orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-12 sm:py-16 text-center pb-24 md:pb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">Add some products before checking out.</p>
          <Link to="/products">
            <Button size="lg" className="h-12 px-8">Continue Shopping</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <SEOHead title="Secure Checkout - Durtup.shop" noindex={true} />
      <Header />
      <main className="flex-1 pb-28 md:pb-12 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-3 sm:py-6 min-w-0">

          {/* Top Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>কার্ট-এ ফিরে যান (Cart)</span>
            </Link>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full font-semibold transition-all ${checkoutStep === "shipping"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground"
                }`}>
                ১. ঠিকানা
              </span>
              <span className="text-muted-foreground">→</span>
              <span className={`px-2.5 py-0.5 rounded-full font-semibold transition-all ${checkoutStep === "payment"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground"
                }`}>
                ২. পেমেন্ট
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {checkoutStep === "shipping" ? "ডেলিভারি ঠিকানা ও অর্ডার" : "পেমেন্ট মেথড নির্বাচন"}
            </h1>
          </div>

          {/* Mobile Order Summary Collapsible Toggle */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="w-full flex items-center justify-between p-3.5 bg-card hover:bg-muted/30 border border-border/80 rounded-2xl shadow-xs transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">
                    অর্ডার সারসংক্ষেপ ({totalItems}টি আইটেম)
                  </span>
                  <span className="text-[11px] text-muted-foreground">বিস্তারিত দেখতে চাপুন</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-extrabold text-base text-primary">৳{total.toLocaleString()}</span>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {showOrderSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {showOrderSummary && (
              <div className="mt-2.5 p-3.5 sm:p-4 bg-card border border-border/80 rounded-2xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Regular items */}
                {regularItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-center py-1">
                    <img
                      src={getDirectImageUrl(item.image) || item.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-xl border border-border/60 shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallbackImage(item.product.name, (item.product as any)?.category || "");
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[11px] text-muted-foreground">পরিমাণ: {item.quantity}</p>
                      <p className="text-xs font-bold text-primary">
                        ৳{((item.product.discount_price || item.product.regular_price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {/* CJ items */}
                {cjItems.map(item => (
                  <div key={`${item.id}-${item.variantId}`} className="flex gap-3 items-center relative py-1">
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] px-1 py-0.5">
                      <Globe className="h-2.5 w-2.5 mr-0.5" /> Global
                    </Badge>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-border/60 shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallbackImage(item.name, "");
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      {item.variant && <p className="text-[10px] text-muted-foreground">{item.variant}</p>}
                      <p className="text-[11px] text-muted-foreground">পরিমাণ: {item.quantity}</p>
                      <p className="text-xs font-bold text-primary">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>পণ্যের মূল্য (Subtotal):</span>
                    <span className="font-semibold text-foreground">৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ডেলিভারি চার্জ (Shipping):</span>
                    <span className="font-semibold text-foreground">
                      {shipping === 0 ? <span className="text-emerald-600 font-bold">ফ্রি (FREE)</span> : `৳${shipping}`}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>কুপন ছাড় ({appliedCoupon?.code}):</span>
                      <span>-৳{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {referralDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        রেফারেল বোনাস ছাড়:
                      </span>
                      <span>-৳{referralDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        লয়্যালটি পয়েন্ট ছাড় ({pointsToRedeem}★):
                      </span>
                      <span>-৳{loyaltyDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {walletDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <WalletIcon className="h-3 w-3" />
                        ওয়ালেট/ক্যাশব্যাক পেমেন্ট:
                      </span>
                      <span>-৳{walletDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border/60">
                    <span>সর্বমোট (Total):</span>
                    <span className="text-primary text-base">৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form id="checkout-form" onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">

                {/* Unauthenticated Customer Warning Banner */}
                {!user && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-orange-950 dark:text-orange-200 text-xs sm:text-sm">
                      <Shield className="h-5 w-5 text-orange-600 shrink-0" />
                      <span>
                        <strong>অর্ডার সম্পন্ন করতে সাইন ইন আবশ্যক:</strong> আপনি ঠিকানা পূরণ করতে পারেন, তবে অর্ডার চূড়ান্ত করার আগে গুগল দিয়ে সাইন ইন করতে হবে।
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAuthModal(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-9 px-4 rounded-lg shrink-0 w-full sm:w-auto"
                    >
                      গুগল দিয়ে সাইন ইন
                    </Button>
                  </div>
                )}

                {/* STEP 1: SHIPPING & COUPON (Initial View) */}
                {checkoutStep === "shipping" && (
                  <>
                    {/* Shipping / Delivery Information */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                      <CardHeader className="p-3.5 sm:p-5 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <MapPin className="h-4 w-4" />
                            </div>
                            ডেলিভারি ঠিকানা (Delivery Address)
                          </CardTitle>

                          {hasSavedAddress && !isEditingAddress && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditingAddress(true)}
                              className="text-xs h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1 font-semibold"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>পরিবর্তন করুন</span>
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-3.5 sm:p-5 space-y-3.5">
                        {hasSavedAddress && !isEditingAddress ? (
                          /* Saved Address Sleek Card View */
                          <div className="p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-primary/[0.03] space-y-2.5 relative">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base text-foreground">
                                  {shippingInfo.firstName} {shippingInfo.lastName}
                                </span>
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 font-bold gap-1 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" /> সংরক্ষিত ঠিকানা
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs sm:text-sm text-foreground/80">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span className="leading-relaxed">
                                  {shippingInfo.address}, {shippingInfo.city}{shippingInfo.state ? `, ${shippingInfo.state}` : ''} - {shippingInfo.zipCode}, {shippingInfo.country}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-0.5">
                                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-bold text-foreground">{shippingInfo.phone}</span>
                                {shippingInfo.email && (
                                  <span className="text-muted-foreground text-xs truncate">({shippingInfo.email})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Address Input Form */
                          <div className="space-y-3.5">
                            {hasSavedAddress && (
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIsEditingAddress(false)}
                                  className="text-xs text-muted-foreground hover:text-foreground h-7"
                                >
                                  সংরক্ষিত ঠিকানা ব্যবহার করুন
                                </Button>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                              <div className="space-y-1">
                                <Label htmlFor="firstName" className="text-xs font-semibold text-foreground">আপনার নাম (First Name) *</Label>
                                <Input
                                  id="firstName"
                                  name="firstName"
                                  value={shippingInfo.firstName}
                                  onChange={handleInputChange}
                                  placeholder="যেমন: নাহিদ"
                                  required
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="lastName" className="text-xs font-semibold text-foreground">পদবি (Last Name)</Label>
                                <Input
                                  id="lastName"
                                  name="lastName"
                                  value={shippingInfo.lastName}
                                  onChange={handleInputChange}
                                  placeholder="যেমন: ইসলাম"
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                              <div className="space-y-1">
                                <Label htmlFor="phone" className="text-xs font-semibold text-foreground">মোবাইল নম্বর (Phone Number) *</Label>
                                <Input
                                  id="phone"
                                  name="phone"
                                  type="tel"
                                  value={shippingInfo.phone}
                                  onChange={handleInputChange}
                                  placeholder="01XXXXXXXXX"
                                  required
                                  className="h-10 text-xs sm:text-sm rounded-xl font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground">ইমেইল এড্রেস (Email)</Label>
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  value={shippingInfo.email}
                                  onChange={handleInputChange}
                                  placeholder="name@example.com"
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="address" className="text-xs font-semibold text-foreground">সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) *</Label>
                              <Input
                                id="address"
                                name="address"
                                value={shippingInfo.address}
                                onChange={handleInputChange}
                                placeholder="বাসা নং, রোড নং, এলাকা / ল্যান্ডমার্ক"
                                required
                                className="h-10 text-xs sm:text-sm rounded-xl"
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                              <div className="space-y-1">
                                <Label htmlFor="city" className="text-xs font-semibold text-foreground">জেলা / শহর (City) *</Label>
                                <Input
                                  id="city"
                                  name="city"
                                  value={shippingInfo.city}
                                  onChange={handleInputChange}
                                  placeholder="যেমন: ঢাকা"
                                  required
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="state" className="text-xs font-semibold text-foreground">বিভাগ (Division)</Label>
                                <Input
                                  id="state"
                                  name="state"
                                  value={shippingInfo.state}
                                  onChange={handleInputChange}
                                  placeholder="যেমন: ঢাকা"
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                              <div className="space-y-1 col-span-2 sm:col-span-1">
                                <Label htmlFor="zipCode" className="text-xs font-semibold text-foreground">পোস্ট কোড (Zip Code)</Label>
                                <Input
                                  id="zipCode"
                                  name="zipCode"
                                  value={shippingInfo.zipCode}
                                  onChange={handleInputChange}
                                  placeholder="যেমন: 1200"
                                  className="h-10 text-xs sm:text-sm rounded-xl"
                                />
                              </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                              পরবর্তী অর্ডারের সুবিধার জন্য এই ঠিকানা স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Coupon Code */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                      <CardHeader className="p-3.5 sm:p-5 border-b border-border/60 bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Tag className="h-4 w-4" />
                          </div>
                          কুপন কোড (Coupon Discount)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 sm:p-5">
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <div>
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">{appliedCoupon.code}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {appliedCoupon.discount_type === "percentage"
                                    ? `${appliedCoupon.discount_value}% ছাড় সক্রিয় হয়েছে`
                                    : `৳${appliedCoupon.discount_value} ছাড় সক্রিয় হয়েছে`}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="কুপন কোড দিন (যেমন: DURTUP2026)"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="h-10 flex-1 text-xs sm:text-sm rounded-xl font-mono uppercase"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={applyCoupon}
                              disabled={applyingCoupon}
                              className="h-10 px-4 text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                            >
                              {applyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "প্রয়োগ করুন"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Loyalty Points Redemption Card */}
                    {loyaltySettings?.enabled && (
                      <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent shadow-xs overflow-hidden">
                        <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-amber-500/10">
                          <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                              <Sparkles className="h-4 w-4" />
                              লয়্যালটি পয়েন্টস রিওয়ার্ড (Loyalty Points)
                            </span>
                            {user && loyaltyAccount && (
                              <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-50 dark:bg-amber-950/40">
                                ব্যালেন্স: {loyaltyAccount.points} ★
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 sm:p-4">
                          {!user ? (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>অর্ডারের সাথে পয়েন্ট আয় করতে এবং ছাড় পেতে লগইন করুন।</span>
                              <Link to="/auth?redirect=/checkout" className="text-primary font-bold hover:underline shrink-0 ml-2">
                                লগইন করুন
                              </Link>
                            </div>
                          ) : !loyaltyAccount || loyaltyAccount.points < (loyaltySettings.minPointsToRedeem || 50) ? (
                            <p className="text-xs text-muted-foreground">
                              আপনার বর্তমান ব্যালেন্স {loyaltyAccount?.points || 0} পয়েন্ট। পয়েন্ট দিয়ে ছাড় পেতে ন্যূনতম {loyaltySettings.minPointsToRedeem || 50} পয়েন্ট প্রয়োজন।
                            </p>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-2xs">
                                <div className="space-y-0.5">
                                  <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                    {pointsToRedeem || maxRedeemablePoints} পয়েন্ট রিডিম করুন
                                  </p>
                                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    ≈ ৳{Math.round((pointsToRedeem || maxRedeemablePoints) * (loyaltySettings.pointValueInTaka || 0.5))} তাৎক্ষণিক ছাড়
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={useLoyaltyPoints}
                                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                  </label>
                                </div>
                              </div>
                              {useLoyaltyPoints && (
                                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" /> সর্বমোট বিল থেকে ৳{loyaltyDiscount} ছাড় সক্রিয় করা হয়েছে!
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Wallet & Cashback Balance Payment Card */}
                    {user && userWalletBalance > 0 && (
                      <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent shadow-xs overflow-hidden">
                        <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-emerald-500/10">
                          <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                              <Coins className="h-4 w-4" />
                              ওয়ালেট ও ক্যাশব্যাক ব্যালেন্স ব্যবহার করুন
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                              ব্যালেন্স: ৳{userWalletBalance.toLocaleString()}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 sm:p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-2xs">
                              <div className="space-y-0.5">
                                <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1">
                                  <WalletIcon className="h-3.5 w-3.5 text-emerald-600" />
                                  ৳{walletDiscount || Math.min(userWalletBalance, netBeforeWallet)} ওয়ালেট থেকে পরিশোধ করুন
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  ক্যাশব্যাক ও ডিপোজিট ব্যালেন্স সরাসরি অর্ডারের বিল থেকে কাটা হবে
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useWalletBalance}
                                  onChange={(e) => setUseWalletBalance(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                            </div>
                            {useWalletBalance && (
                              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> ওয়ালেট থেকে ৳{walletDiscount} পরিশোধ সক্রিয় করা হয়েছে!
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {checkoutStep === "payment" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200 w-full min-w-0">
                    {/* Back Button & Address Preview Banner */}
                    <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 border border-border/80 rounded-xl w-full min-w-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCheckoutStep("shipping")}
                        className="text-xs font-bold text-primary hover:text-primary flex items-center gap-1 h-7 px-2"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> ঠিকানা পরিবর্তন
                      </Button>
                      <div className="text-right text-xs text-muted-foreground truncate min-w-0">
                        প্রাপক: <span className="font-bold text-foreground">{shippingInfo.firstName}</span> ({shippingInfo.phone})
                      </div>
                    </div>

                    {/* Payment Method Selection Card */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card w-full min-w-0">
                      <CardHeader className="p-3.5 sm:p-5 border-b border-border/60 bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          পেমেন্ট মাধ্যম বেছে নিন
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 sm:p-5 space-y-3 w-full min-w-0">
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3 w-full min-w-0">
                          {/* Cash on Delivery (COD) */}
                          <div
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 w-full min-w-0 ${paymentMethod === "cod"
                                ? "border-primary bg-primary/[0.04] shadow-xs"
                                : "border-border hover:border-primary/40 bg-card"
                              }`}
                          >
                            <RadioGroupItem value="cod" id="page-cod" className="shrink-0 mt-0.5" />
                            <Label htmlFor="page-cod" className="flex-1 cursor-pointer min-w-0 space-y-0.5">
                              <span className="font-bold text-sm text-foreground flex items-center flex-wrap gap-1.5">
                                <span>Cash on Delivery (ক্যাশ অন ডেলিভারি)</span>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  অগ্রিম টাকা নেই
                                </Badge>
                              </span>
                              <p className="text-xs text-muted-foreground">
                                পণ্য হাতে পেয়ে ডেলিভারি ম্যানের কাছে ক্যাশ টাকা দিয়ে রিসিভ করবেন।
                              </p>
                            </Label>
                            {paymentMethod === "cod" && <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                          </div>

                          {/* COD Info Guidance */}
                          {paymentMethod === "cod" && (
                            <div className="p-3 sm:p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-2 animate-in fade-in duration-200 text-xs text-foreground/80">
                              <div className="font-bold text-primary flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5" /> ১০০% নিরাপদ ক্যাশ অন ডেলিভারি
                              </div>
                              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                <li>অর্ডারের জন্য কোনো অগ্রিম টাকা লাগবে না।</li>
                                <li>ডেলিভারি ম্যানের সামনে পার্সেল চেক করে টাকা পরিশোধ করুন।</li>
                                <li>ঠিকানা ও অর্ডার নিশ্চিত করতে আমাদের প্রতিনিধি কল করবেন।</li>
                              </ul>
                            </div>
                          )}

                          {/* bKash Option */}
                          <div
                            onClick={() => setPaymentMethod("bkash")}
                            className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 w-full min-w-0 ${paymentMethod === "bkash"
                                ? "border-[#E2136E] bg-[#E2136E]/[0.04] shadow-xs"
                                : "border-border hover:border-[#E2136E]/40 bg-card"
                              }`}
                          >
                            <RadioGroupItem value="bkash" id="page-bkash" className="shrink-0 mt-0.5" />
                            <Label htmlFor="page-bkash" className="flex-1 cursor-pointer min-w-0 space-y-0.5">
                              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <span className="text-[#E2136E]">bKash (বিকাশ পেমেন্ট)</span>
                              </span>
                              <p className="text-xs text-muted-foreground">বিকাশে Send Money / Payment করুন</p>
                            </Label>
                            {paymentMethod === "bkash" && <CheckCircle className="h-4 w-4 text-[#E2136E] shrink-0 mt-0.5" />}
                          </div>

                          {/* bKash Payment Details Box */}
                          {paymentMethod === "bkash" && (
                            <div className="p-3.5 sm:p-5 rounded-2xl border-2 border-[#E2136E]/30 bg-gradient-to-b from-[#E2136E]/[0.06] via-[#E2136E]/[0.02] to-transparent space-y-4 animate-in fade-in duration-200 w-full min-w-0 shadow-sm">
                              {/* Important Notice: Send Money Alert */}
                              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#E2136E]/10 border border-[#E2136E]/25 text-xs text-[#E2136E]">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <span className="font-extrabold block text-sm">জরুরী পেমেন্ট নির্দেশনা:</span>
                                  দয়া করে নিচের নম্বরে শুধুমাত্র <span className="bg-[#E2136E] text-white px-1.5 py-0.5 rounded font-black text-[11px] inline-block mx-0.5">Send Money (সেন্ড মানি)</span> করবেন। মার্চেন্ট পেমেন্ট বা ক্যাশ-ইন গ্রহণযোগ্য নয়।
                                </div>
                              </div>

                              {/* Number & Amount Display Cards */}
                              <div className="grid sm:grid-cols-2 gap-2.5">
                                {/* bKash Personal Number Card */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-[#E2136E]/30 shadow-xs">
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">বিকাশ পার্সোনাল নম্বর</span>
                                    <span className="text-base sm:text-lg font-black text-[#E2136E] font-mono tracking-wider block">01885985097</span>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyBkashNumber}
                                    className="h-8 px-2.5 text-xs font-bold border-[#E2136E]/40 text-[#E2136E] hover:bg-[#E2136E]/10 flex items-center gap-1.5 rounded-lg active:scale-95 transition-transform shrink-0"
                                  >
                                    {copiedBkashNumber ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-emerald-600">কপি হয়েছে!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>কপি নম্বর</span>
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Payable Amount Card */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-[#E2136E]/30 shadow-xs">
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">প্রদেয় মোট টাকার পরিমাণ</span>
                                    <span className="text-base sm:text-lg font-black text-foreground font-mono tracking-wider block">৳{total.toLocaleString()}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyAmount}
                                    className="h-8 px-2.5 text-xs font-bold border-border hover:bg-muted text-foreground flex items-center gap-1.5 rounded-lg active:scale-95 transition-transform shrink-0"
                                  >
                                    {copiedAmount ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-emerald-600">কপি হয়েছে!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>টাকা কপি</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Step-by-Step Payment Instructions */}
                              <div className="bg-card/90 backdrop-blur-xs rounded-xl p-3.5 sm:p-4 border border-[#E2136E]/20 space-y-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#E2136E] border-b border-border/60 pb-2">
                                  <Send className="h-3.5 w-3.5" />
                                  <span>ধাপে ধাপে বিকাশ পেমেন্ট করার নিয়ম (Step-by-Step Guide):</span>
                                </div>

                                <ol className="space-y-2.5 text-xs text-foreground/90 font-medium">
                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#E2136E] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ১
                                    </span>
                                    <p className="leading-snug">
                                      আপনার মোবাইলে <strong>bKash App</strong> ওপেন করুন অথবা ডায়াল প্যাডে <strong>*247#</strong> ডায়াল করুন।
                                    </p>
                                  </li>

                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#E2136E] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ২
                                    </span>
                                    <p className="leading-snug">
                                      মেনু থেকে <strong>"Send Money" (সেন্ড মানি)</strong> অপশনটি সিলেক্ট করুন।
                                    </p>
                                  </li>

                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#E2136E] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ৩
                                    </span>
                                    <p className="leading-snug">
                                      প্রাপক নম্বরে আমাদের বিকাশ পার্সোনাল নম্বর <strong>01885985097</strong> লিখুন (বা উপরের <strong>"কপি নম্বর"</strong> বাটনে চাপুন)।
                                    </p>
                                  </li>

                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#E2136E] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ৪
                                    </span>
                                    <p className="leading-snug">
                                      টাকার পরিমাণে সঠিক মোট বিল <strong>৳{total.toLocaleString()}</strong> লিখুন (রেফারেন্সে আপনার নাম বা ফোন দিতে পারেন)।
                                    </p>
                                  </li>

                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#E2136E] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ৫
                                    </span>
                                    <p className="leading-snug">
                                      আপনার বিকাশ <strong>পিন (PIN)</strong> নম্বর দিয়ে সেন্ড মানি সম্পন্ন করতে ট্যাপ করে ধরে রাখুন।
                                    </p>
                                  </li>

                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      ৬
                                    </span>
                                    <p className="leading-snug">
                                      সেন্ড মানি সফল হলে বিকাশ থেকে প্রাপ্ত <strong>TrxID (ট্রানজেকশন আইডি)</strong> এবং যে নম্বর থেকে বিকাশ করেছেন তা নিচের বক্সে লিখে <strong>"অর্ডার নিশ্চিত করুন"</strong> বাটনে ক্লিক করুন।
                                    </p>
                                  </li>
                                </ol>
                              </div>

                              {/* Input Fields with Clear Explanations */}
                              <div className="space-y-2 pt-1">
                                <div className="grid sm:grid-cols-2 gap-3 w-full min-w-0">
                                  <div className="space-y-1">
                                    <Label htmlFor="bkashNumber" className="text-xs font-bold text-foreground flex items-center justify-between">
                                      <span>যে নম্বর থেকে বিকাশ করেছেন *</span>
                                    </Label>
                                    <Input
                                      id="bkashNumber"
                                      placeholder="01XXXXXXXXX"
                                      value={bkashNumber}
                                      onChange={(e) => setBkashNumber(e.target.value)}
                                      className="h-10 text-xs rounded-xl border-[#E2136E]/30 focus-visible:ring-[#E2136E] bg-card"
                                      required={paymentMethod === "bkash"}
                                    />
                                    <p className="text-[10px] text-muted-foreground">আপনার প্রেরক বিকাশ মোবাইল নম্বরটি লিখুন</p>
                                  </div>

                                  <div className="space-y-1">
                                    <Label htmlFor="bkashTrxId" className="text-xs font-bold text-foreground flex items-center justify-between">
                                      <span>ট্রানজেকশন আইডি (TrxID) *</span>
                                    </Label>
                                    <Input
                                      id="bkashTrxId"
                                      placeholder="যেমন: 9M7A8X9K2"
                                      value={bkashTrxId}
                                      onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                                      className="h-10 text-xs rounded-xl border-[#E2136E]/30 focus-visible:ring-[#E2136E] font-mono uppercase bg-card"
                                      required={paymentMethod === "bkash"}
                                    />
                                    <p className="text-[10px] text-muted-foreground">বিকাশ SMS বা স্টেটমেন্টের ৮-১০ ডিজিটের কোড</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Order Summary - Desktop Right Sidebar */}
              <div className="hidden lg:block lg:col-span-1">
                <Card className="sticky top-24 shadow-xs border border-border/80 rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="p-4 border-b border-border/60 bg-muted/20">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      অর্ডার সারসংক্ষেপ ({totalItems})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 p-4">
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {regularItems.map(item => (
                        <div key={item.id} className="flex gap-2.5 items-center">
                          <img
                            src={getDirectImageUrl(item.image) || item.image}
                            alt={item.product.name}
                            className="w-11 h-11 object-cover rounded-lg border shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getCategoryFallbackImage(item.product.name, (item.product as any)?.category || "");
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{item.product.name}</p>
                            <p className="text-[11px] text-muted-foreground">পরিমাণ: {item.quantity}</p>
                            <p className="text-xs font-bold text-primary">
                              ৳{((item.product.discount_price || item.product.regular_price) * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/60 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>পণ্যের মোট মূল্য:</span>
                        <span className="font-semibold text-foreground">৳{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>ডেলিভারি চার্জ:</span>
                        <span className="font-semibold text-foreground">
                          {shipping === 0 ? <span className="text-emerald-600 font-bold">ফ্রি (FREE)</span> : `৳${shipping}`}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>কুপন ছাড় ({appliedCoupon?.code}):</span>
                          <span>-৳{couponDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {referralDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>রেফারেল ছাড়:</span>
                          <span>-৳{referralDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-amber-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            লয়্যালটি পয়েন্ট ছাড় ({pointsToRedeem}★):
                          </span>
                          <span>-৳{loyaltyDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {walletDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <WalletIcon className="h-3 w-3" />
                            ওয়ালেট/ক্যাশব্যাক পেমেন্ট:
                          </span>
                          <span>-৳{walletDiscount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border/60 pt-3 flex justify-between items-baseline">
                      <span className="text-xs font-bold text-muted-foreground">সর্বমোট বিল:</span>
                      <span className="text-primary font-black text-xl">৳{total.toLocaleString()}</span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>অর্ডার সম্পন্ন হচ্ছে...</span>
                        </>
                      ) : checkoutStep === "shipping" ? (
                        <>
                          <span>পরবর্তী ধাপ (পেমেন্ট পদ্ধতি)</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>অর্ডার কনফার্ম করুন • ৳{total.toLocaleString()}</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      ১০০% নিরাপদ ও সুরক্ষিত শপিং
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Fixed Bottom Action Bar */}
            <div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
            >
              <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto w-full">
                <div className="shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">মোট প্রদেয় বিল</p>
                  <p className="text-lg font-black text-primary leading-tight">৳{total.toLocaleString()}</p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 px-6 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex-1 max-w-[240px] shadow-md shadow-primary/25 transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 ml-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>কনফার্ম হচ্ছে...</span>
                    </>
                  ) : checkoutStep === "shipping" ? (
                    <>
                      <span>পরবর্তী ধাপ</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>অর্ডার নিশ্চিত করুন</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </main>
      <Footer />
    </div>
  );
}
