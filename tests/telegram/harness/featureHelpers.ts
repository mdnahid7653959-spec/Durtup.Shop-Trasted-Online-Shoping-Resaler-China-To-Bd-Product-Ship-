/**
 * Durtup.shop Telegram Super Admin Control Center
 * Feature Domain Helpers for Offline Test Suites
 *
 * Implements domain business logic and contract-compliant helper functions
 * for Features F06-F17, enabling isolated and authentic verification
 * against MockDatabase and MockTelegramApi without external side-effects.
 */

import { MockDatabase } from './mockDatabase';
import {
  MockOrder,
  MockProduct,
  MockProfile,
  MockCoupon,
  MockReview,
  MockQuestion,
  MockTelegramSettings,
  InlineKeyboardMarkup,
  OrderNotificationData
} from './types';
import { recordTelegramAudit } from '../../../src/server/telegram/auditHelper';

// ==========================================
// F06: Rich Order Notifications & Supplier Attribution
// ==========================================

export function attributeSupplier(sku: string = '', explicitSupplier?: string): string {
  if (explicitSupplier && explicitSupplier !== 'Unknown') return explicitSupplier;
  const upperSku = sku.toUpperCase().trim();
  if (upperSku.startsWith('ECOM-') || upperSku.includes('ECOMSELLER')) {
    return 'EcomsellerBD';
  }
  if (upperSku.startsWith('MOH-') || upperSku.includes('DROPSHIP')) {
    return 'DropShipping.com.bd';
  }
  if (upperSku.startsWith('DIR-') || upperSku.includes('DIRECT')) {
    return 'Direct';
  }
  return 'Direct';
}

export function buildOrderNotificationButtons(orderId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '📦 View Order', callback_data: `ord:view:${orderId}` },
        { text: '✅ Approve', callback_data: `ord:appr_prompt:${orderId}` }
      ],
      [
        { text: '❌ Reject', callback_data: `ord:rej_prompt:${orderId}` },
        { text: '🔄 Change Status', callback_data: `ord:status_menu:${orderId}` }
      ],
      [
        { text: '👤 Customer Info', callback_data: `ord:cust:${orderId}` }
      ]
    ]
  };
}

export function formatOrderNotificationText(order: MockOrder | OrderNotificationData): string {
  const orderId = 'id' in order ? order.id : (order as OrderNotificationData).orderId;
  const orderNum = 'order_number' in order ? order.order_number : (order as OrderNotificationData).orderNumber;
  const custName = 'customer_name' in order ? order.customer_name : (order as OrderNotificationData).customerName;
  const custPhone = 'customer_phone' in order ? order.customer_phone : (order as OrderNotificationData).customerPhone;
  const address = 'shipping_address' in order ? order.shipping_address : (order as OrderNotificationData).shippingAddress;
  const payMethod = 'payment_method' in order ? order.payment_method : (order as OrderNotificationData).paymentMethod;
  const payStatus = 'payment_status' in order ? order.payment_status : (order as OrderNotificationData).paymentStatus;
  const total = 'total_amount' in order ? order.total_amount : (order as OrderNotificationData).totalAmount;

  const items = order.items || [];
  const primarySku = items[0]?.sku || '';
  const primarySupplier = attributeSupplier(primarySku, items[0] && 'supplier' in items[0] ? (items[0] as any).supplier : undefined);

  let itemsList = '';
  for (const item of items) {
    itemsList += `• ${item.name} (${item.quantity}x @ ৳${item.price})\n`;
  }

  return `🔔 <b>NEW ORDER RECEIVED: #${orderNum}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${orderId}</code>
👤 <b>Customer:</b> ${custName} (📞 <code>${custPhone}</code>)
📍 <b>Shipping Address:</b> ${address}
🏭 <b>Verified Supplier:</b> <b>${primarySupplier}</b>
💳 <b>Payment:</b> ${payMethod} [${payStatus.toUpperCase()}]
💰 <b>Total Amount:</b> <b>৳${total.toLocaleString()}</b>

📦 <b>Items:</b>
${itemsList}
👇 <i>Choose an action below:</i>`;
}

// ==========================================
// F07 & F08: Order Status Transitions, Filtering & Search
// ==========================================

export async function executeOrderStatusUpdate(
  db: MockDatabase,
  orderId: string,
  newStatus: MockOrder['status'],
  adminId: number | string = 8204855335,
  notes?: string
): Promise<{ success: boolean; order: MockOrder }> {
  const existing = db.getDoc('orders', orderId) as MockOrder | null;
  if (!existing) {
    throw new Error(`Order ${orderId} not found in database.`);
  }

  const oldStatus = existing.status;
  db.updateDoc('orders', orderId, { status: newStatus, notes: notes || existing.notes });
  const updated = db.getDoc('orders', orderId) as MockOrder;

  // Append to order_timelines
  db.addOrderTimeline({
    order_id: orderId,
    status: newStatus,
    notes: notes || `Status updated from ${oldStatus} to ${newStatus}`,
    updated_by: String(adminId)
  });

  // Record audit log
  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'ORDER_STATUS_UPDATE',
    entityType: 'order',
    entityId: orderId,
    oldValue: oldStatus,
    newValue: newStatus,
    details: `Order status changed from ${oldStatus} to ${newStatus}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'ORDER_STATUS_UPDATE',
    entityType: 'order',
    entityId: orderId,
    oldValue: oldStatus,
    newValue: newStatus,
    details: `Order status changed from ${oldStatus} to ${newStatus}`
  });

  return { success: true, order: updated };
}

export function filterOrdersByStatus(db: MockDatabase, status: string): MockOrder[] {
  if (status === 'all') {
    return db.listDocs('orders');
  }
  return db.query('orders', o => o.status === status);
}

export function searchOrders(db: MockDatabase, queryText: string): MockOrder[] {
  const q = queryText.toLowerCase().trim();
  return db.query('orders', o => {
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  });
}

export function buildConfirmationPromptKeyboard(actionCallback: string, returnCallback: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '⚠️ Confirm Execution', callback_data: actionCallback },
        { text: '❌ Cancel', callback_data: `cnf:cancel:${returnCallback}` }
      ]
    ]
  };
}

// ==========================================
// F09: Payment Inspection & Verification
// ==========================================

export async function verifyPayment(
  db: MockDatabase,
  orderId: string,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; order: MockOrder }> {
  const existing = db.getDoc('orders', orderId) as MockOrder | null;
  if (!existing) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const oldPayStatus = existing.payment_status;
  db.updateDoc('orders', orderId, {
    payment_status: 'verified'
  });
  const updated = db.getDoc('orders', orderId) as MockOrder;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PAYMENT_VERIFIED',
    entityType: 'payment',
    entityId: orderId,
    oldValue: oldPayStatus,
    newValue: 'verified',
    details: `Payment verified for ${existing.payment_method} (trx: ${existing.bKash_trx_id || 'N/A'})`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PAYMENT_VERIFIED',
    entityType: 'payment',
    entityId: orderId,
    oldValue: oldPayStatus,
    newValue: 'verified',
    details: `Payment verified for ${existing.payment_method}`
  });

  return { success: true, order: updated };
}

// ==========================================
// F10: Refund Review & Moderation
// ==========================================

export async function processRefund(
  db: MockDatabase,
  orderId: string,
  adminId: number | string = 8204855335,
  reason: string = 'Admin approved return'
): Promise<{ success: boolean; order: MockOrder }> {
  const existing = db.getDoc('orders', orderId) as MockOrder | null;
  if (!existing) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const oldStatus = existing.status;
  const oldPayStatus = existing.payment_status;

  db.updateDoc('orders', orderId, {
    status: 'refunded',
    payment_status: 'refunded',
    notes: `Refund processed: ${reason}`
  });
  const updated = db.getDoc('orders', orderId) as MockOrder;

  db.addOrderTimeline({
    order_id: orderId,
    status: 'refunded',
    notes: `Refund processed (Amount: ৳${existing.total_amount}): ${reason}`,
    updated_by: String(adminId)
  });

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'REFUND_APPROVED',
    entityType: 'refund',
    entityId: orderId,
    oldValue: { status: oldStatus, payment_status: oldPayStatus },
    newValue: { status: 'refunded', payment_status: 'refunded' },
    details: `Refund approved for ৳${existing.total_amount}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'REFUND_APPROVED',
    entityType: 'refund',
    entityId: orderId,
    oldValue: oldStatus,
    newValue: 'refunded',
    details: `Refund approved for ৳${existing.total_amount}`
  });

  return { success: true, order: updated };
}

// ==========================================
// F11: Product Search, Details & Live Controls
// ==========================================

export async function updateProductPrice(
  db: MockDatabase,
  productId: string,
  newPrice: number,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; product: MockProduct }> {
  const prod = db.getDoc('products', productId) as MockProduct | null;
  if (!prod) {
    throw new Error(`Product ${productId} not found.`);
  }

  const oldPrice = prod.regular_price;
  db.updateDoc('products', productId, { regular_price: newPrice });
  const updated = db.getDoc('products', productId) as MockProduct;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PRODUCT_PRICE_UPDATE',
    entityType: 'product',
    entityId: productId,
    oldValue: oldPrice,
    newValue: newPrice,
    details: `Price updated for ${prod.name}: ৳${oldPrice} -> ৳${newPrice}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PRODUCT_PRICE_UPDATE',
    entityType: 'product',
    entityId: productId,
    oldValue: oldPrice,
    newValue: newPrice
  });

  return { success: true, product: updated };
}

export async function updateProductStock(
  db: MockDatabase,
  productId: string,
  newStock: number,
  adminId: number | string = 8204855335,
  reason: string = 'Manual Telegram admin adjustment'
): Promise<{ success: boolean; product: MockProduct }> {
  const prod = db.getDoc('products', productId) as MockProduct | null;
  if (!prod) {
    throw new Error(`Product ${productId} not found.`);
  }

  const oldStock = prod.stock_quantity;
  const change = newStock - oldStock;
  db.updateDoc('products', productId, { stock_quantity: newStock });
  const updated = db.getDoc('products', productId) as MockProduct;

  db.addInventoryLog({
    product_id: productId,
    change_amount: change,
    previous_stock: oldStock,
    new_stock: newStock,
    reason,
    updated_by: String(adminId)
  });

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'STOCK_ADJUSTMENT',
    entityType: 'inventory',
    entityId: productId,
    oldValue: oldStock,
    newValue: newStock,
    details: `Stock adjusted for ${prod.name}: ${oldStock} -> ${newStock} (${change >= 0 ? '+' : ''}${change})`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'STOCK_ADJUSTMENT',
    entityType: 'inventory',
    entityId: productId,
    oldValue: oldStock,
    newValue: newStock
  });

  return { success: true, product: updated };
}

export async function toggleProductActive(
  db: MockDatabase,
  productId: string,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; product: MockProduct }> {
  const prod = db.getDoc('products', productId) as MockProduct | null;
  if (!prod) {
    throw new Error(`Product ${productId} not found.`);
  }

  const nextActive = !prod.is_active;
  db.updateDoc('products', productId, { is_active: nextActive });
  const updated = db.getDoc('products', productId) as MockProduct;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PRODUCT_STATUS_TOGGLE',
    entityType: 'product',
    entityId: productId,
    oldValue: prod.is_active,
    newValue: nextActive,
    details: `Product ${prod.name} toggled to ${nextActive ? 'active' : 'inactive'}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'PRODUCT_STATUS_TOGGLE',
    entityType: 'product',
    entityId: productId,
    oldValue: prod.is_active,
    newValue: nextActive
  });

  return { success: true, product: updated };
}

// ==========================================
// F12: Inventory Valuation & Stock Alerts
// ==========================================

export function calculateInventoryValuation(db: MockDatabase): {
  totalItems: number;
  totalQuantity: number;
  totalValuationBDT: number;
  lowStockCount: number;
  outOfStockCount: number;
} {
  const products = db.listDocs('products') as MockProduct[];
  let totalItems = products.length;
  let totalQuantity = 0;
  let totalValuationBDT = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    const qty = p.stock_quantity || 0;
    const price = p.discount_price !== null && p.discount_price !== undefined ? p.discount_price : p.regular_price;
    totalQuantity += qty;
    totalValuationBDT += qty * price;

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= 10) {
      lowStockCount++;
    }
  }

  return {
    totalItems,
    totalQuantity,
    totalValuationBDT,
    lowStockCount,
    outOfStockCount
  };
}

export function getLowStockAlerts(db: MockDatabase): MockProduct[] {
  return db.query('products', p => p.stock_quantity <= 10 && p.stock_quantity > 0);
}

// ==========================================
// F13: Customer Profile & Access Control
// ==========================================

export async function toggleCustomerAccess(
  db: MockDatabase,
  profileId: string,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; profile: MockProfile }> {
  const prof = db.getDoc('profiles', profileId) as MockProfile | null;
  if (!prof) {
    throw new Error(`Customer profile ${profileId} not found.`);
  }

  const nextStatus: MockProfile['status'] = prof.status === 'active' ? 'suspended' : 'active';
  db.updateDoc('profiles', profileId, { status: nextStatus });
  const updated = db.getDoc('profiles', profileId) as MockProfile;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'CUSTOMER_ACCESS_TOGGLE',
    entityType: 'customer',
    entityId: profileId,
    oldValue: prof.status,
    newValue: nextStatus,
    details: `Customer ${prof.full_name} (${prof.phone}) status toggled to ${nextStatus}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'CUSTOMER_ACCESS_TOGGLE',
    entityType: 'customer',
    entityId: profileId,
    oldValue: prof.status,
    newValue: nextStatus
  });

  return { success: true, profile: updated };
}

// ==========================================
// F14: Supplier Tracking & Courier Shipping
// ==========================================

export async function assignCourierToOrder(
  db: MockDatabase,
  orderId: string,
  courier: 'Pathao' | 'RedX' | 'SteadFast',
  trackingId?: string,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; order: MockOrder; message: string }> {
  const order = db.getDoc('orders', orderId) as MockOrder | null;
  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  // Prevent duplicate courier booking if already booked
  if (order.courier && order.courier_tracking_id) {
    return {
      success: false,
      order,
      message: `Order ${orderId} already booked with ${order.courier} (Tracking: ${order.courier_tracking_id}). Duplicate booking rejected.`
    };
  }

  const generatedTracking = trackingId || `${courier.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  db.updateDoc('orders', orderId, {
    courier,
    courier_tracking_id: generatedTracking,
    status: 'shipped'
  });
  const updated = db.getDoc('orders', orderId) as MockOrder;

  db.addOrderTimeline({
    order_id: orderId,
    status: 'shipped',
    notes: `Courier assigned: ${courier} (Tracking ID: ${generatedTracking})`,
    updated_by: String(adminId)
  });

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'COURIER_ASSIGNED',
    entityType: 'shipping',
    entityId: orderId,
    oldValue: null,
    newValue: { courier, trackingId: generatedTracking },
    details: `Dispatched with ${courier}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'COURIER_ASSIGNED',
    entityType: 'shipping',
    entityId: orderId,
    newValue: { courier, trackingId: generatedTracking }
  });

  return {
    success: true,
    order: updated,
    message: `Dispatched via ${courier} with tracking ID ${generatedTracking}`
  };
}

// ==========================================
// F15: Coupons & Review / Q&A Moderation
// ==========================================

export async function toggleCouponActive(
  db: MockDatabase,
  couponId: string,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; coupon: MockCoupon }> {
  const coup = db.getDoc('coupons', couponId) as MockCoupon | null;
  if (!coup) {
    throw new Error(`Coupon ${couponId} not found.`);
  }

  const nextActive = !coup.is_active;
  db.updateDoc('coupons', couponId, { is_active: nextActive });
  const updated = db.getDoc('coupons', couponId) as MockCoupon;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'COUPON_TOGGLE',
    entityType: 'coupon',
    entityId: couponId,
    oldValue: coup.is_active,
    newValue: nextActive,
    details: `Coupon ${coup.code} toggled to ${nextActive ? 'active' : 'inactive'}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'COUPON_TOGGLE',
    entityType: 'coupon',
    entityId: couponId,
    oldValue: coup.is_active,
    newValue: nextActive
  });

  return { success: true, coupon: updated };
}

export async function moderateReview(
  db: MockDatabase,
  reviewId: string,
  newStatus: 'approved' | 'rejected',
  adminId: number | string = 8204855335
): Promise<{ success: boolean; review: MockReview }> {
  const rev = db.getDoc('reviews', reviewId) as MockReview | null;
  if (!rev) {
    throw new Error(`Review ${reviewId} not found.`);
  }

  const oldStatus = rev.status;
  // Ensure verified buyer status is preserved
  db.updateDoc('reviews', reviewId, { status: newStatus });
  const updated = db.getDoc('reviews', reviewId) as MockReview;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: newStatus === 'approved' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
    entityType: 'review',
    entityId: reviewId,
    oldValue: oldStatus,
    newValue: newStatus,
    details: `Review by ${rev.customer_name} set to ${newStatus}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: newStatus === 'approved' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
    entityType: 'review',
    entityId: reviewId,
    oldValue: oldStatus,
    newValue: newStatus
  });

  return { success: true, review: updated };
}

export async function moderateQuestion(
  db: MockDatabase,
  questionId: string,
  newStatus: 'approved' | 'rejected',
  adminId: number | string = 8204855335
): Promise<{ success: boolean; question: MockQuestion }> {
  const q = db.getDoc('product_questions', questionId) as MockQuestion | null;
  if (!q) {
    throw new Error(`Question ${questionId} not found.`);
  }

  db.updateDoc('product_questions', questionId, { status: newStatus });
  const updated = db.getDoc('product_questions', questionId) as MockQuestion;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: newStatus === 'approved' ? 'QA_APPROVED' : 'QA_REJECTED',
    entityType: 'question',
    entityId: questionId,
    oldValue: q.status,
    newValue: newStatus
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: newStatus === 'approved' ? 'QA_APPROVED' : 'QA_REJECTED',
    entityType: 'question',
    entityId: questionId,
    oldValue: q.status,
    newValue: newStatus
  });

  return { success: true, question: updated };
}

// ==========================================
// F16: Live Analytics in Asia/Dhaka Timezone
// ==========================================

export function computeAnalyticsReport(
  db: MockDatabase,
  range: 'today' | 'yesterday' | '7d' | '30d',
  referenceDate: Date = new Date('2026-11-24T12:00:00Z')
): {
  range: string;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenueBDT: number;
  timezone: string;
} {
  const orders = db.listDocs('orders') as MockOrder[];
  const timezone = 'Asia/Dhaka';

  // Format reference date in Dhaka
  const dhakaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayDhakaStr = dhakaFormatter.format(referenceDate);

  const yesterdayDate = new Date(referenceDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDhakaStr = dhakaFormatter.format(yesterdayDate);

  const sevenDaysAgo = new Date(referenceDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let totalOrders = 0;
  let confirmedOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;
  let totalRevenueBDT = 0;

  for (const o of orders) {
    const oDate = new Date(o.created_at);
    const oDhakaStr = dhakaFormatter.format(oDate);

    let inRange = false;
    if (range === 'today') {
      inRange = oDhakaStr === todayDhakaStr;
    } else if (range === 'yesterday') {
      inRange = oDhakaStr === yesterdayDhakaStr;
    } else if (range === '7d') {
      inRange = oDate >= sevenDaysAgo && oDate <= referenceDate;
    } else if (range === '30d') {
      inRange = oDate >= thirtyDaysAgo && oDate <= referenceDate;
    }

    if (inRange) {
      totalOrders++;
      if (o.status === 'confirmed' || o.status === 'delivered' || o.status === 'shipped') {
        confirmedOrders++;
        totalRevenueBDT += o.total_amount;
      } else if (o.status === 'pending') {
        pendingOrders++;
      } else if (o.status === 'cancelled') {
        cancelledOrders++;
      }
    }
  }

  return {
    range,
    totalOrders,
    confirmedOrders,
    pendingOrders,
    cancelledOrders,
    totalRevenueBDT,
    timezone
  };
}

// ==========================================
// F17: Settings & Security Controls
// ==========================================

export async function toggleMaintenanceMode(
  db: MockDatabase,
  enabled: boolean,
  adminId: number | string = 8204855335
): Promise<{ success: boolean; settings: MockTelegramSettings }> {
  const current = db.getDoc('settings', 'telegram') as MockTelegramSettings;
  const oldVal = current?.maintenance_mode ?? false;

  db.updateDoc('settings', 'telegram', { maintenance_mode: enabled });
  const updated = db.getDoc('settings', 'telegram') as MockTelegramSettings;

  await recordTelegramAudit({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'SETTINGS_MAINTENANCE_TOGGLE',
    entityType: 'settings',
    entityId: 'telegram',
    oldValue: oldVal,
    newValue: enabled,
    details: `Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`
  });

  db.addAuditLog({
    telegramAdminId: adminId,
    adminName: 'Master Admin',
    action: 'SETTINGS_MAINTENANCE_TOGGLE',
    entityType: 'settings',
    entityId: 'telegram',
    oldValue: oldVal,
    newValue: enabled
  });

  return { success: true, settings: updated };
}
