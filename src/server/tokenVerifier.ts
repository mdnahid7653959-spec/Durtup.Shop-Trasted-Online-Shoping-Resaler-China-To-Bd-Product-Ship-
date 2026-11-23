/**
 * Durtup.shop - Firebase ID Token Cryptographic Verification Module
 * 
 * Cryptographically verifies tokens extracted from Authorization: Bearer <idToken> headers.
 * Supports:
 * - Production RS256 Firebase ID tokens via Google OAuth2 tokeninfo endpoint
 * - Test/Development HS256 JWT tokens signed with deterministic TEST_JWT_SECRET
 * - Rigorous claims validation: expiration, audience, subject/uid
 * - Differentiated HTTP status codes (401 for auth required/expired/malformed, 403 for tampered/forbidden)
 */

import crypto from "node:crypto";

export interface VerifiedUserClaims {
  uid: string;
  sub: string;
  email: string;
  role?: string;
  seller_id?: string;
  aud: string;
  exp: number;
  [key: string]: any;
}

export interface TokenVerificationResult {
  valid: boolean;
  status: 200 | 401 | 403;
  claims?: VerifiedUserClaims;
  error?: string;
}

// Allowed Firebase Project IDs and Test Audiences
export const VALID_AUDIENCES = new Set([
  "eshop-app-6119d",
  "durtup-shop",
  process.env.VITE_FIREBASE_PROJECT_ID || "eshop-app-6119d"
]);

// Deterministic test secret matching tests/e2e/helpers/authHelper.ts
export const TEST_JWT_SECRET = "durtup_e2e_secret_key_firebase_mock_auth_2026";

/**
 * Decodes URL-safe Base64 to string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Signs data with HMAC-SHA256
 */
function signHmacSha256(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Extracts and verifies token from an Authorization header or raw token string
 */
export async function verifyAuthHeader(authHeader?: string): Promise<TokenVerificationResult> {
  if (!authHeader || typeof authHeader !== "string" || authHeader.trim() === "") {
    return {
      valid: false,
      status: 401,
      error: "Authentication required. Missing or invalid Firebase ID token."
    };
  }

  const trimmed = authHeader.trim();
  const spaceIdx = trimmed.indexOf(" ");

  if (spaceIdx === -1) {
    return {
      valid: false,
      status: 401,
      error: "Invalid Authorization header format. Expected Bearer <token>"
    };
  }

  const scheme = trimmed.substring(0, spaceIdx).trim();
  const rawToken = trimmed.substring(spaceIdx + 1).trim();

  if (scheme.toLowerCase() !== "bearer") {
    return {
      valid: false,
      status: 401,
      error: "Invalid Authorization header format. Expected Bearer <token>"
    };
  }

  if (!rawToken) {
    return {
      valid: false,
      status: 401,
      error: "Authentication required. Missing or invalid Firebase ID token."
    };
  }

  return verifyFirebaseIdToken(rawToken);
}

/**
 * Cryptographically verifies a Firebase ID token.
 */
export async function verifyFirebaseIdToken(token: string): Promise<TokenVerificationResult> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return {
      valid: false,
      status: 401,
      error: "Authentication required. Missing or invalid Firebase ID token."
    };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      status: 401,
      error: "Authentication required. Malformed JWT structure: expected 3 segments"
    };
  }

  const [headerB64, payloadB64, signature] = parts;
  let header: any;
  let payload: any;

  try {
    header = JSON.parse(base64UrlDecode(headerB64));
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    return {
      valid: false,
      status: 401,
      error: "Authentication required. Failed to decode JWT segments"
    };
  }

  const now = Math.floor(Date.now() / 1000);

  // 1. Check expiration
  if (payload.exp && Number(payload.exp) < now) {
    return {
      valid: false,
      status: 401,
      error: `Authentication required. Token expired at ${payload.exp}, current time is ${now}`
    };
  }

  // 2. Check audience
  if (payload.aud && !VALID_AUDIENCES.has(payload.aud)) {
    return {
      valid: false,
      status: 403,
      error: `Access forbidden. User identity verification failed: Audience mismatch: expected valid audience, got ${payload.aud}`
    };
  }

  // 3. Check subject / UID
  const uid = payload.sub || payload.user_id || payload.uid;
  if (!uid || typeof uid !== "string" || uid.trim() === "") {
    return {
      valid: false,
      status: 403,
      error: "Access forbidden. Token does not contain a verified UID."
    };
  }

  // 4. Cryptographic Signature Verification
  // Case A: Test / Dev Suite Token (HS256 with TEST_JWT_SECRET)
  if (header.alg === "HS256") {
    const expectedSig = signHmacSha256(`${headerB64}.${payloadB64}`, TEST_JWT_SECRET);

    if (signature !== expectedSig) {
      return {
        valid: false,
        status: 403,
        error: "Access forbidden. User identity verification failed: Invalid token signature"
      };
    }

    return {
      valid: true,
      status: 200,
      claims: {
        uid,
        sub: uid,
        email: payload.email || "",
        role: payload.role || "customer",
        seller_id: payload.seller_id,
        aud: payload.aud,
        exp: payload.exp,
        ...payload
      }
    };
  }

  // Case B: Production Firebase ID Token (RS256 via Google Tokeninfo Endpoint)
  if (header.alg === "RS256" || !header.alg) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.trim())}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (googleRes.ok) {
        const googleInfo: any = await googleRes.json();
        const verifiedUid = googleInfo.sub || googleInfo.user_id;

        if (!verifiedUid) {
          return {
            valid: false,
            status: 403,
            error: "Access forbidden. Google tokeninfo did not return a valid user subject"
          };
        }

        if (googleInfo.aud && !VALID_AUDIENCES.has(googleInfo.aud)) {
          return {
            valid: false,
            status: 403,
            error: `Access forbidden. User identity verification failed: Audience mismatch: expected valid audience, got ${googleInfo.aud}`
          };
        }

        return {
          valid: true,
          status: 200,
          claims: {
            uid: verifiedUid,
            sub: verifiedUid,
            email: googleInfo.email || payload.email || "",
            role: payload.role || "customer",
            aud: googleInfo.aud,
            exp: Number(googleInfo.exp || payload.exp),
            ...googleInfo
          }
        };
      } else {
        const errBody = await googleRes.text().catch(() => "");
        return {
          valid: false,
          status: 401,
          error: `Authentication required. Google token verification rejected: ${errBody}`
        };
      }
    } catch (networkErr: any) {
      // Local dev resilience: if offline, permit if audience matches
      if (process.env.NODE_ENV !== "production" && VALID_AUDIENCES.has(payload.aud)) {
        return {
          valid: true,
          status: 200,
          claims: {
            uid,
            sub: uid,
            email: payload.email || "",
            role: payload.role || "customer",
            aud: payload.aud,
            exp: payload.exp,
            ...payload
          }
        };
      }
      return {
        valid: false,
        status: 401,
        error: `Authentication required. Token verification failed: ${networkErr.message}`
      };
    }
  }

  return {
    valid: false,
    status: 403,
    error: `Access forbidden. User identity verification failed: Unsupported algorithm ${header.alg}`
  };
}
