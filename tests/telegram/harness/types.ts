/**
 * Durtup.shop Telegram Super Admin Control Center
 * Test Harness Types & Interface Contracts
 *
 * Defines contracts matching PROJECT.md § Interface Contracts,
 * SCOPE.md, and offline test execution interfaces.
 */

// ==========================================
// Telegram Bot API & Webhook Types
// ==========================================

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  reply_markup?: InlineKeyboardMarkup;
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }>;
  caption?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
  chat_instance?: string;
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ==========================================
// System Module & Router Contracts
// ==========================================

export interface WebhookResult {
  handled: boolean;
  action?: string;
  authorized: boolean;
  error?: string;
}

export interface AuthResult {
  authorized: boolean;
  reason?: string;
  adminId?: number;
  isAdmin8204855335: boolean;
}

export interface TelegramAuditEntry {
  telegramAdminId: number | string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  timestamp?: string;
}

export interface OrderNotificationItem {
  id?: string;
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  sku?: string;
}

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  items: OrderNotificationItem[];
}

// ==========================================
// Mock Database Model Types
// ==========================================

export interface MockOrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  sku: string;
  image?: string;
  supplier?: 'EcomsellerBD' | 'DropShipping' | 'CJ' | 'Direct' | string;
}

export interface MockOrder {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: 'bKash' | 'Nagad' | 'Rocket' | 'SSLCommerz' | 'Cash on Delivery';
  payment_status: 'pending' | 'verified' | 'paid' | 'unpaid' | 'failed' | 'refunded';
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  items: MockOrderItem[];
  bKash_trx_id?: string;
  bKash_number?: string;
  courier?: 'Pathao' | 'RedX' | 'SteadFast' | string;
  courier_tracking_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface MockProduct {
  id: string;
  name: string;
  sku: string;
  regular_price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  category: string;
  image?: string;
  supplier?: string;
  created_at: string;
  updated_at?: string;
}

export interface MockProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'seller';
  status: 'active' | 'suspended';
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at?: string;
}

export interface MockCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface MockReview {
  id: string;
  product_id: string;
  user_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface MockQuestion {
  id: string;
  product_id: string;
  user_id: string;
  customer_name: string;
  question: string;
  answer?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface MockAuditLog {
  id: string;
  telegramAdminId: number | string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  timestamp: string;
}

export interface MockOrderTimeline {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  updated_by: string;
  timestamp: string;
}

export interface MockInventoryLog {
  id: string;
  product_id: string;
  change_amount: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  updated_by: string;
  timestamp: string;
}

export interface MockTelegramSettings {
  bot_token: string;
  admin_chat_ids: string[];
  chat_id: string;
  enabled: boolean;
  maintenance_mode?: boolean;
  auto_notify_orders?: boolean;
  updated_at?: string;
}

// ==========================================
// Test Runner & Assertion Contracts
// ==========================================

export interface MockTelegramCall {
  method: 'sendMessage' | 'editMessageText' | 'answerCallbackQuery' | 'sendPhoto';
  payload: any;
  timestamp: number;
}

export interface TestAssertions {
  equal: <T>(actual: T, expected: T, message?: string) => void;
  deepEqual: <T>(actual: T, expected: T, message?: string) => void;
  isTrue: (value: boolean, message?: string) => void;
  isFalse: (value: boolean, message?: string) => void;
  includes: (haystack: string | any[], needle: any, message?: string) => void;
  notIncludes: (haystack: string | any[], needle: any, message?: string) => void;
  throws: (fn: () => any, expectedMessageOrRegex?: string | RegExp, message?: string) => void;
  rejects: (promise: Promise<any>, expectedMessageOrRegex?: string | RegExp, message?: string) => Promise<void>;
}

export interface TestContext {
  mockTelegramApi: any; // Instance of MockTelegramApi
  mockDb: any;          // Instance of MockDatabase
  createCommandUpdate: (
    command: string,
    userId?: number,
    chatId?: number,
    username?: string
  ) => TelegramWebhookUpdate;
  createCallbackQueryUpdate: (
    callbackData: string,
    userId?: number,
    chatId?: number,
    messageId?: number
  ) => TelegramWebhookUpdate;
  createTextUpdate: (
    text: string,
    userId?: number,
    chatId?: number
  ) => TelegramWebhookUpdate;
  assert: TestAssertions;
}

export interface TestCase {
  id: string;
  feature: string;
  name: string;
  tier: number;
  run: (ctx: TestContext) => Promise<void> | void;
}

export interface TestSuite {
  tier: number;
  title: string;
  tests: TestCase[];
}

export interface TestResult {
  tier: number;
  feature: string;
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}
