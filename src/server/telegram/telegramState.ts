/**
 * src/server/telegram/telegramState.ts
 * Telegram State Manager & Idempotency Guard for Durtup.shop
 */

export interface UserInteractionContext {
  userId: number | string;
  expecting:
    | "price_update"
    | "stock_update"
    | "order_search"
    | "customer_search"
    | "product_search"
    | "tracking_id"
    | "reject_reason"
    | "refund_reason"
    | string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

export class TelegramStateManager {
  private static idempotencyMap = new Map<string, number>();
  private static userContextMap = new Map<string, UserInteractionContext>();
  private static paginationMap = new Map<string, number>();

  /**
   * Idempotency check: returns true if action is new and allowed,
   * false if it was already executed within the sliding window (default 4000ms).
   */
  public static checkAndSetIdempotency(actionKey: string, windowMs = 4000): boolean {
    const key = String(actionKey).trim();
    if (!key) return true;

    const now = Date.now();
    this.sweepExpiredIdempotency(now, windowMs);

    const lastRun = this.idempotencyMap.get(key);
    if (lastRun && now - lastRun < windowMs) {
      return false; // Duplicate detected within window
    }

    this.idempotencyMap.set(key, now);
    return true; // Allowed
  }

  /**
   * Checks if a callback query ID was already processed.
   */
  public static isCallbackProcessed(callbackQueryId: string, windowMs = 4000): boolean {
    const key = `cb_${String(callbackQueryId).trim()}`;
    const allowed = this.checkAndSetIdempotency(key, windowMs);
    return !allowed; // If not allowed, it was already processed
  }

  private static sweepExpiredIdempotency(now: number, windowMs: number): void {
    if (this.idempotencyMap.size > 200) {
      for (const [key, timestamp] of this.idempotencyMap.entries()) {
        if (now - timestamp > windowMs * 2) {
          this.idempotencyMap.delete(key);
        }
      }
    }
  }

  /**
   * Interaction context: Tracks conversational input states with automatic TTL (default 60s).
   */
  public static setUserContext(
    userId: number | string,
    context: Omit<UserInteractionContext, "createdAt">
  ): void {
    const key = String(userId).trim();
    this.userContextMap.set(key, {
      ...context,
      createdAt: Date.now(),
      expiresAt: context.expiresAt || Date.now() + 60_000
    });
  }

  public static getUserContext(userId: number | string): UserInteractionContext | null {
    const key = String(userId).trim();
    const ctx = this.userContextMap.get(key);
    if (!ctx) return null;
    if (Date.now() > ctx.expiresAt) {
      this.userContextMap.delete(key);
      return null;
    }
    return ctx;
  }

  public static clearUserContext(userId: number | string): void {
    this.userContextMap.delete(String(userId).trim());
  }

  /**
   * Pagination offsets per user and feature module.
   */
  public static setPagination(userId: number | string, module: string, page: number): void {
    this.paginationMap.set(`${String(userId).trim()}:${module}`, page);
  }

  public static getPagination(userId: number | string, module: string): number {
    return this.paginationMap.get(`${String(userId).trim()}:${module}`) || 1;
  }

  /**
   * Reset all state (useful for offline tests and cache flushes).
   */
  public static resetState(): void {
    this.idempotencyMap.clear();
    this.userContextMap.clear();
    this.paginationMap.clear();
  }
}

// Standalone exports for backward and test compatibility
export function checkAndSetIdempotency(actionKey: string, windowMs = 4000): boolean {
  return TelegramStateManager.checkAndSetIdempotency(actionKey, windowMs);
}

export function isCallbackProcessed(callbackQueryId: string, windowMs = 4000): boolean {
  return TelegramStateManager.isCallbackProcessed(callbackQueryId, windowMs);
}

export function resetTelegramState(): void {
  TelegramStateManager.resetState();
}
