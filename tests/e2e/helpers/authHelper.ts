/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Testing Framework - Authentication Helper
 */

import crypto from 'node:crypto';
import { AuthTokenClaims, UserProfile } from './types';

// Deterministic test secret for cryptographic token signing
export const TEST_JWT_SECRET = 'durtup_e2e_secret_key_firebase_mock_auth_2026';
export const EXPECTED_AUDIENCE = 'durtup-shop';
export const EXPECTED_ISSUER = 'https://securetoken.google.com/durtup-shop';

/**
 * Encodes an object to URL-safe Base64
 */
function base64UrlEncode(obj: object | string): string {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes URL-safe Base64 to string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs data with HMAC-SHA256
 */
function signHmacSha256(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Creates a valid, cryptographically signed Firebase ID token for testing
 */
export function createValidToken(
  uid: string,
  email: string,
  options?: {
    expiresInSeconds?: number;
    role?: string;
    seller_id?: string;
    audience?: string;
    issuer?: string;
    customClaims?: Record<string, any>;
  }
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options?.expiresInSeconds ?? 3600; // 1 hour default

  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: 'mock-key-id-2026'
  };

  const payload: AuthTokenClaims = {
    uid,
    sub: uid,
    email,
    role: options?.role || 'customer',
    seller_id: options?.seller_id,
    iss: options?.issuer || EXPECTED_ISSUER,
    aud: options?.audience || EXPECTED_AUDIENCE,
    auth_time: now,
    iat: now,
    exp: now + expiresIn,
    ...(options?.customClaims || {})
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = signHmacSha256(`${encodedHeader}.${encodedPayload}`, TEST_JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Creates an expired Firebase ID token
 */
export function createExpiredToken(uid: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const pastTime = now - 7200; // Expired 2 hours ago

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: AuthTokenClaims = {
    uid,
    sub: uid,
    email,
    iss: EXPECTED_ISSUER,
    aud: EXPECTED_AUDIENCE,
    auth_time: pastTime - 3600,
    iat: pastTime - 3600,
    exp: pastTime
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = signHmacSha256(`${encodedHeader}.${encodedPayload}`, TEST_JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Creates a token with a tampered signature
 */
export function createTamperedSignatureToken(uid: string, email: string): string {
  const valid = createValidToken(uid, email);
  const parts = valid.split('.');
  // Corrupt signature part
  const tamperedSig = parts[2].split('').reverse().join('');
  return `${parts[0]}.${parts[1]}.${tamperedSig}`;
}

/**
 * Creates a token with invalid/untrusted audience
 */
export function createWrongAudienceToken(uid: string, email: string): string {
  return createValidToken(uid, email, { audience: 'malicious-third-party-app' });
}

/**
 * Creates a malformed token string
 */
export function createMalformedToken(): string {
  return 'not_a_valid_jwt_token_payload_structure';
}

/**
 * Verifies a token's cryptographic integrity and expiration
 */
export function verifyTestToken(token: string): { valid: boolean; claims?: AuthTokenClaims; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed JWT structure: expected 3 segments' };
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSig = signHmacSha256(`${encodedHeader}.${encodedPayload}`, TEST_JWT_SECRET);

    if (signature !== expectedSig) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const claims = JSON.parse(payloadJson) as AuthTokenClaims;

    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      return { valid: false, error: `Token expired at ${claims.exp}, current time is ${now}` };
    }

    if (claims.aud && claims.aud !== EXPECTED_AUDIENCE) {
      return { valid: false, error: `Audience mismatch: expected ${EXPECTED_AUDIENCE}, got ${claims.aud}` };
    }

    return { valid: true, claims };
  } catch (err: any) {
    return { valid: false, error: `Token decode error: ${err.message}` };
  }
}

// Pre-defined test actors
export const TEST_USERS = {
  CUSTOMER_ALPHA: {
    uid: 'cust_alpha_101',
    email: 'cust.alpha@example.com',
    full_name: 'Alpha Customer',
    role: 'customer' as const
  },
  CUSTOMER_BRAVO: {
    uid: 'cust_bravo_202',
    email: 'cust.bravo@example.com',
    full_name: 'Bravo Customer',
    role: 'customer' as const
  },
  CUSTOMER_NEW: {
    uid: 'cust_charlie_303',
    email: 'cust.charlie@gmail.com',
    full_name: 'Charlie Newcomer',
    role: 'customer' as const
  },
  ADMIN_USER: {
    uid: 'admin_root_999',
    email: 'admin@durtup.shop',
    full_name: 'System Admin',
    role: 'admin' as const
  },
  SELLER_USER: {
    uid: 'seller_dhaka_555',
    email: 'seller.gadgets@durtup.shop',
    full_name: 'Dhaka Gadgets Seller',
    role: 'seller' as const,
    seller_id: 'seller_dhaka_1'
  }
};
