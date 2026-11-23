/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Testing Framework - Firestore Security Rules Evaluator
 */

import { AuthTokenClaims } from './types';

/**
 * Checks if the caller has admin privileges according to firestore.rules
 */
export function isAdmin(claims?: AuthTokenClaims | null): boolean {
  if (!claims) return false;
  return Boolean(claims.admin === true || claims.role === 'admin');
}

/**
 * Evaluates Read access for /orders/{orderId}
 * Rule: allow read: if isAuthenticated() && (resource.data.user_id == request.auth.uid || isAdmin());
 */
export function evaluateOrderReadRule(
  authClaims: AuthTokenClaims | null,
  orderData: { user_id: string; [key: string]: any }
): { allowed: boolean; status: number; reason?: string } {
  if (!authClaims || !authClaims.uid) {
    return {
      allowed: false,
      status: 401,
      reason: 'Authentication required. Missing auth token.'
    };
  }

  if (isAdmin(authClaims)) {
    return { allowed: true, status: 200 };
  }

  if (orderData.user_id === authClaims.uid) {
    return { allowed: true, status: 200 };
  }

  return {
    allowed: false,
    status: 403,
    reason: `Forbidden. Customer ${authClaims.uid} cannot access order owned by ${orderData.user_id}.`
  };
}

/**
 * Evaluates Create access for /orders/{orderId}
 * Rule: allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
 */
export function evaluateOrderCreateRule(
  authClaims: AuthTokenClaims | null,
  newOrderData: { user_id?: string; [key: string]: any }
): { allowed: boolean; status: number; reason?: string } {
  if (!authClaims || !authClaims.uid) {
    return {
      allowed: false,
      status: 401,
      reason: 'Authentication required to create order.'
    };
  }

  if (isAdmin(authClaims)) {
    return { allowed: true, status: 200 };
  }

  if (newOrderData.user_id && newOrderData.user_id !== authClaims.uid) {
    return {
      allowed: false,
      status: 403,
      reason: `Forbidden. Cannot create order with user_id ${newOrderData.user_id} when authenticated as ${authClaims.uid}.`
    };
  }

  return { allowed: true, status: 200 };
}

/**
 * Evaluates Update access for /orders/{orderId}
 * Rule: allow update, delete: if isAdmin();
 */
export function evaluateOrderUpdateRule(
  authClaims: AuthTokenClaims | null,
  existingOrder: { user_id: string; [key: string]: any },
  updates: Record<string, any>
): { allowed: boolean; status: number; reason?: string } {
  if (!authClaims || !authClaims.uid) {
    return {
      allowed: false,
      status: 401,
      reason: 'Authentication required.'
    };
  }

  if (isAdmin(authClaims)) {
    return { allowed: true, status: 200 };
  }

  // Regular customers are strictly forbidden from modifying orders after creation
  return {
    allowed: false,
    status: 403,
    reason: 'Forbidden. Only administrators may modify or cancel placed orders.'
  };
}

/**
 * Evaluates Scoped Order Query isolation (My Orders page)
 * Simulates Firestore query: where("user_id", "==", authUid)
 */
export function simulateScopedOrdersQuery(
  allOrdersInDb: Array<{ id: string; user_id: string; total: number; order_number?: string }>,
  currentUid: string
): Array<{ id: string; user_id: string; total: number; order_number?: string }> {
  // Scoped Firestore query returns only rows matching user_id
  return allOrdersInDb.filter((order) => order.user_id === currentUid);
}

/**
 * Evaluates profile update security rule
 * Rule: protect wallet_balance and role from untrusted modification
 */
export function evaluateProfileUpdateRule(
  authClaims: AuthTokenClaims | null,
  profileUserId: string,
  updatedFields: Record<string, any>
): { allowed: boolean; status: number; reason?: string } {
  if (!authClaims || !authClaims.uid) {
    return { allowed: false, status: 401, reason: 'Unauthenticated.' };
  }

  if (isAdmin(authClaims)) {
    return { allowed: true, status: 200 };
  }

  if (authClaims.uid !== profileUserId) {
    return { allowed: false, status: 403, reason: 'Forbidden. Cannot edit other user profile.' };
  }

  const forbiddenKeys = ['wallet_balance', 'walletBalance', 'total_earned', 'totalEarned', 'role'];
  const hasForbiddenKey = Object.keys(updatedFields).some((key) => forbiddenKeys.includes(key));

  if (hasForbiddenKey) {
    return {
      allowed: false,
      status: 403,
      reason: 'Forbidden. Untrusted client cannot modify financial balances or user roles.'
    };
  }

  return { allowed: true, status: 200 };
}
