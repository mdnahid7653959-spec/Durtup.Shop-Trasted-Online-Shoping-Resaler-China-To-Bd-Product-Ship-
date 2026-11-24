/**
 * Durtup.shop Telegram Super Admin Control Center
 * In-Memory Non-Destructive Database Simulator (MockDatabase)
 *
 * Simulates Google Cloud Firestore collections completely in-memory.
 * Guarantees zero network calls or mutations against production Firestore.
 * Supports snapshots and resets for isolated, repeatable tests.
 */

import {
  MockOrder,
  MockProduct,
  MockProfile,
  MockCoupon,
  MockReview,
  MockQuestion,
  MockAuditLog,
  MockOrderTimeline,
  MockInventoryLog,
  MockTelegramSettings
} from './types';

export class MockDatabase {
  public orders: Map<string, MockOrder> = new Map();
  public products: Map<string, MockProduct> = new Map();
  public profiles: Map<string, MockProfile> = new Map();
  public audit_logs: MockAuditLog[] = [];
  public order_timelines: MockOrderTimeline[] = [];
  public inventory_logs: MockInventoryLog[] = [];
  public settings: Map<string, any> = new Map();
  public coupons: Map<string, MockCoupon> = new Map();
  public reviews: Map<string, MockReview> = new Map();
  public product_questions: Map<string, MockQuestion> = new Map();

  private initialSnapshot: string | null = null;

  constructor() {
    this.seedInitialData();
    this.initialSnapshot = this.snapshot();
  }

  /**
   * Pre-seed realistic mock fixtures for orders, products, profiles, settings, etc.
   */
  public seedInitialData(): void {
    this.clearAll();

    // 1. Settings Fixtures (including Master Admin ID 8204855335)
    const telegramSettings: MockTelegramSettings = {
      bot_token: '9052891455:AAGrB4DfvjuXqmTwnRKmKubC7vCmgaO0QcM',
      admin_chat_ids: ['8204855335'],
      chat_id: '8204855335',
      enabled: true,
      maintenance_mode: false,
      auto_notify_orders: true,
      updated_at: '2026-11-24T00:00:00Z'
    };
    this.settings.set('telegram', { ...telegramSettings });
    this.settings.set('settings/telegram', { ...telegramSettings });

    this.settings.set('store', {
      store_name: 'Durtup.shop',
      currency: 'BDT',
      currency_symbol: '৳',
      timezone: 'Asia/Dhaka',
      support_phone: '+8801700000000',
      support_email: 'support@durtup.shop',
      order_prefix: 'ORD-'
    });

    // 2. Product Fixtures (In-stock, Low-stock <= 10, Out-of-stock = 0, Active, Inactive)
    const seedProducts: MockProduct[] = [
      {
        id: 'PROD-001',
        name: 'China Premium Cotton T-Shirt',
        sku: 'ECOM-TSHIRT-01',
        regular_price: 1200,
        discount_price: 999,
        stock_quantity: 50, // In-stock
        is_active: true,
        category: 'Clothing',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
        supplier: 'EcomsellerBD',
        created_at: '2026-11-01T10:00:00Z'
      },
      {
        id: 'PROD-002',
        name: 'Smart Waterproof Watch Series 9',
        sku: 'MOH-WATCH-09',
        regular_price: 2500,
        discount_price: 2199,
        stock_quantity: 4, // Low-stock (<= 10)
        is_active: true,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        supplier: 'DropShipping',
        created_at: '2026-11-05T12:00:00Z'
      },
      {
        id: 'PROD-003',
        name: 'Anti-Theft Travel Backpack',
        sku: 'DIR-BAG-02',
        regular_price: 1850,
        discount_price: null,
        stock_quantity: 0, // Out-of-stock (= 0)
        is_active: true,
        category: 'Bags',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
        supplier: 'Direct',
        created_at: '2026-11-10T08:30:00Z'
      },
      {
        id: 'PROD-004',
        name: 'Winter Thermal Leather Gloves',
        sku: 'ECOM-GLOVES-04',
        regular_price: 750,
        discount_price: 600,
        stock_quantity: 25,
        is_active: false, // Inactive
        category: 'Winter Collection',
        image: 'https://images.unsplash.com/photo-1584208124888-3a20b9c799e2',
        supplier: 'EcomsellerBD',
        created_at: '2026-11-12T14:15:00Z'
      },
      {
        id: 'PROD-005',
        name: 'Wireless Noise Cancelling Earbuds',
        sku: 'MOH-AUDIO-15',
        regular_price: 3200,
        discount_price: 2850,
        stock_quantity: 8, // Low-stock
        is_active: true,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
        supplier: 'DropShipping',
        created_at: '2026-11-15T09:00:00Z'
      },
      {
        id: 'PROD-006',
        name: 'Stainless Steel Vacuum Flask 1000ml',
        sku: 'DIR-FLASK-08',
        regular_price: 950,
        discount_price: 850,
        stock_quantity: 80, // High stock
        is_active: true,
        category: 'Home & Living',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
        supplier: 'Direct',
        created_at: '2026-11-16T11:20:00Z'
      }
    ];
    for (const prod of seedProducts) {
      this.products.set(prod.id, { ...prod });
    }

    // 3. Customer Profile Fixtures
    const seedProfiles: MockProfile[] = [
      {
        id: 'PROF-001',
        user_id: 'USER-001',
        full_name: 'Tanvir Hossain',
        email: 'tanvir@example.com',
        phone: '01711000001',
        role: 'customer',
        status: 'active',
        total_orders: 5,
        total_spent: 12500,
        created_at: '2026-10-15T08:00:00Z'
      },
      {
        id: 'PROF-002',
        user_id: 'USER-002',
        full_name: 'Mahmudur Rahman',
        email: 'mahmud@example.com',
        phone: '01822000002',
        role: 'customer',
        status: 'active',
        total_orders: 2,
        total_spent: 4500,
        created_at: '2026-11-01T14:30:00Z'
      },
      {
        id: 'PROF-003',
        user_id: 'USER-003',
        full_name: 'Suspicious Bot Account',
        email: 'suspicious@fakemail.com',
        phone: '01933000003',
        role: 'customer',
        status: 'suspended', // Suspended
        total_orders: 8,
        total_spent: 0,
        created_at: '2026-11-18T19:00:00Z'
      },
      {
        id: 'PROF-8204855335',
        user_id: 'ADMIN-8204855335',
        full_name: 'Master Telegram Admin',
        email: 'admin@durtup.shop',
        phone: '01700000000',
        role: 'admin',
        status: 'active',
        total_orders: 0,
        total_spent: 0,
        created_at: '2026-01-01T00:00:00Z'
      }
    ];
    for (const prof of seedProfiles) {
      this.profiles.set(prof.id, { ...prof });
    }

    // 4. Order Fixtures (with statuses, supplier tags, and bKash transaction IDs)
    const seedOrders: MockOrder[] = [
      {
        id: 'ORD-1001',
        order_number: 'DT-2611-1001',
        status: 'pending',
        payment_method: 'bKash',
        payment_status: 'pending',
        total_amount: 1998,
        customer_name: 'Tanvir Hossain',
        customer_phone: '01711000001',
        customer_email: 'tanvir@example.com',
        shipping_address: 'House 14, Road 5, Dhanmondi, Dhaka',
        items: [
          {
            product_id: 'PROD-001',
            name: 'China Premium Cotton T-Shirt',
            quantity: 2,
            price: 999,
            sku: 'ECOM-TSHIRT-01',
            supplier: 'EcomsellerBD',
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518'
          }
        ],
        bKash_trx_id: '9K28D7XZ01',
        bKash_number: '01711000001',
        created_at: '2026-11-24T06:30:00Z',
        updated_at: '2026-11-24T06:30:00Z'
      },
      {
        id: 'ORD-1002',
        order_number: 'DT-2611-1002',
        status: 'confirmed',
        payment_method: 'Cash on Delivery',
        payment_status: 'unpaid',
        total_amount: 2199,
        customer_name: 'Mahmudur Rahman',
        customer_phone: '01822000002',
        customer_email: 'mahmud@example.com',
        shipping_address: 'Flat 4B, Green Road, Dhaka',
        items: [
          {
            product_id: 'PROD-002',
            name: 'Smart Waterproof Watch Series 9',
            quantity: 1,
            price: 2199,
            sku: 'MOH-WATCH-09',
            supplier: 'DropShipping',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
          }
        ],
        created_at: '2026-11-23T14:10:00Z',
        updated_at: '2026-11-23T15:00:00Z'
      },
      {
        id: 'ORD-1003',
        order_number: 'DT-2611-1003',
        status: 'shipped',
        payment_method: 'bKash',
        payment_status: 'verified',
        total_amount: 1850,
        customer_name: 'Karim Ahmed',
        customer_phone: '01755000005',
        shipping_address: 'GEC Circle, Chittagong',
        items: [
          {
            product_id: 'PROD-003',
            name: 'Anti-Theft Travel Backpack',
            quantity: 1,
            price: 1850,
            sku: 'DIR-BAG-02',
            supplier: 'Direct',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
          }
        ],
        bKash_trx_id: '8M19P2KL44',
        bKash_number: '01755000005',
        courier: 'Pathao',
        courier_tracking_id: 'PTH-9921448',
        created_at: '2026-11-22T09:20:00Z',
        updated_at: '2026-11-23T11:00:00Z'
      },
      {
        id: 'ORD-1004',
        order_number: 'DT-2611-1004',
        status: 'delivered',
        payment_method: 'SSLCommerz',
        payment_status: 'paid',
        total_amount: 3200,
        customer_name: 'Nusrat Jahan',
        customer_phone: '01677000007',
        shipping_address: 'Zindabazar, Sylhet',
        items: [
          {
            product_id: 'PROD-005',
            name: 'Wireless Noise Cancelling Earbuds',
            quantity: 1,
            price: 2850,
            sku: 'MOH-AUDIO-15',
            supplier: 'DropShipping'
          },
          {
            product_id: 'PROD-006',
            name: 'Stainless Steel Vacuum Flask',
            quantity: 1,
            price: 350,
            sku: 'DIR-FLASK-08',
            supplier: 'Direct'
          }
        ],
        courier: 'SteadFast',
        courier_tracking_id: 'STF-441029',
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-22T17:45:00Z'
      },
      {
        id: 'ORD-1005',
        order_number: 'DT-2611-1005',
        status: 'cancelled',
        payment_method: 'bKash',
        payment_status: 'refunded',
        total_amount: 1200,
        customer_name: 'Arif Bellah',
        customer_phone: '01588000009',
        shipping_address: 'Sector 7, Uttara, Dhaka',
        items: [
          {
            product_id: 'PROD-001',
            name: 'China Premium Cotton T-Shirt',
            quantity: 1,
            price: 1200,
            sku: 'ECOM-TSHIRT-01',
            supplier: 'EcomsellerBD'
          }
        ],
        bKash_trx_id: '7L88Q4ZZ19',
        bKash_number: '01588000009',
        notes: 'Customer canceled due to duplicate order',
        created_at: '2026-11-19T13:00:00Z',
        updated_at: '2026-11-19T15:30:00Z'
      },
      {
        id: 'ORD-1006',
        order_number: 'DT-2611-1006',
        status: 'pending',
        payment_method: 'Nagad',
        payment_status: 'pending',
        total_amount: 5049,
        customer_name: 'Saiful Islam',
        customer_phone: '01899000011',
        shipping_address: 'Chowdhury Para, Malibagh, Dhaka',
        items: [
          {
            product_id: 'PROD-002',
            name: 'Smart Waterproof Watch Series 9',
            quantity: 1,
            price: 2199,
            sku: 'MOH-WATCH-09',
            supplier: 'DropShipping'
          },
          {
            product_id: 'PROD-005',
            name: 'Wireless Noise Cancelling Earbuds',
            quantity: 1,
            price: 2850,
            sku: 'MOH-AUDIO-15',
            supplier: 'DropShipping'
          }
        ],
        created_at: '2026-11-24T08:15:00Z',
        updated_at: '2026-11-24T08:15:00Z'
      }
    ];
    for (const order of seedOrders) {
      this.orders.set(order.id, { ...order });
    }

    // 5. Coupon Fixtures
    const seedCoupons: MockCoupon[] = [
      {
        id: 'COUP-WELCOME10',
        code: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 1000,
        is_active: true,
        expires_at: '2026-12-31T23:59:59Z',
        created_at: '2026-11-01T00:00:00Z'
      },
      {
        id: 'COUP-FLAT200',
        code: 'FLAT200',
        discount_type: 'fixed',
        discount_value: 200,
        min_order_amount: 2000,
        is_active: true,
        expires_at: '2026-12-15T23:59:59Z',
        created_at: '2026-11-10T00:00:00Z'
      },
      {
        id: 'COUP-EXPIRED50',
        code: 'EXPIRED50',
        discount_type: 'percentage',
        discount_value: 50,
        min_order_amount: 5000,
        is_active: false, // Inactive / Expired
        expires_at: '2026-10-01T00:00:00Z',
        created_at: '2026-09-01T00:00:00Z'
      }
    ];
    for (const c of seedCoupons) {
      this.coupons.set(c.id, { ...c });
    }

    // 6. Review Fixtures (with Verified Buyer flag)
    const seedReviews: MockReview[] = [
      {
        id: 'REV-001',
        product_id: 'PROD-001',
        user_id: 'USER-001',
        customer_name: 'Tanvir Hossain',
        rating: 5,
        comment: 'Top notch cotton fabric, feels very soft and breathable!',
        is_verified_buyer: true,
        status: 'pending',
        created_at: '2026-11-23T18:00:00Z'
      },
      {
        id: 'REV-002',
        product_id: 'PROD-002',
        user_id: 'USER-002',
        customer_name: 'Mahmudur Rahman',
        rating: 4,
        comment: 'Good battery life, display is bright outdoor.',
        is_verified_buyer: true,
        status: 'approved',
        created_at: '2026-11-22T14:00:00Z'
      },
      {
        id: 'REV-003',
        product_id: 'PROD-003',
        user_id: 'USER-999',
        customer_name: 'Unknown Spam',
        rating: 1,
        comment: 'Visit free-gifts-store-xyz.com for free gifts!',
        is_verified_buyer: false,
        status: 'pending',
        created_at: '2026-11-24T05:00:00Z'
      }
    ];
    for (const r of seedReviews) {
      this.reviews.set(r.id, { ...r });
    }

    // 7. Product Question & Answer Fixtures
    const seedQuestions: MockQuestion[] = [
      {
        id: 'QA-001',
        product_id: 'PROD-001',
        user_id: 'USER-001',
        customer_name: 'Tanvir Hossain',
        question: 'Does this shirt shrink after the first wash?',
        status: 'pending',
        created_at: '2026-11-23T12:00:00Z'
      },
      {
        id: 'QA-002',
        product_id: 'PROD-002',
        user_id: 'USER-002',
        customer_name: 'Mahmudur Rahman',
        question: 'Does it come with official 1 year replacement warranty?',
        answer: 'Yes, 1-year Durtup.shop official replacement warranty is included.',
        status: 'approved',
        created_at: '2026-11-21T09:00:00Z'
      }
    ];
    for (const q of seedQuestions) {
      this.product_questions.set(q.id, { ...q });
    }

    // 8. Initial Audit Logs
    this.audit_logs = [
      {
        id: 'AUD-001',
        telegramAdminId: '8204855335',
        adminName: 'Master Admin',
        action: 'system_initialized',
        entityType: 'system',
        entityId: 'global',
        details: 'Initial mock database fixtures pre-seeded for test harness',
        timestamp: '2026-11-24T00:00:00Z'
      }
    ];

    // 9. Initial Order Timelines
    this.order_timelines = [
      {
        id: 'TIME-001',
        order_id: 'ORD-1001',
        status: 'pending',
        notes: 'Order placed by customer via bKash',
        updated_by: 'system',
        timestamp: '2026-11-24T06:30:00Z'
      },
      {
        id: 'TIME-002',
        order_id: 'ORD-1002',
        status: 'confirmed',
        notes: 'Order confirmed by Admin',
        updated_by: '8204855335',
        timestamp: '2026-11-23T15:00:00Z'
      }
    ];

    // 10. Initial Inventory Logs
    this.inventory_logs = [
      {
        id: 'INV-001',
        product_id: 'PROD-002',
        change_amount: -1,
        previous_stock: 5,
        new_stock: 4,
        reason: 'Order confirmed: ORD-1002',
        updated_by: '8204855335',
        timestamp: '2026-11-23T15:00:00Z'
      }
    ];
  }

  /**
   * Clear all collections.
   */
  public clearAll(): void {
    this.orders.clear();
    this.products.clear();
    this.profiles.clear();
    this.audit_logs = [];
    this.order_timelines = [];
    this.inventory_logs = [];
    this.settings.clear();
    this.coupons.clear();
    this.reviews.clear();
    this.product_questions.clear();
  }

  /**
   * Reset the database back to initial pre-seeded state.
   */
  public reset(): void {
    if (this.initialSnapshot) {
      this.restore(this.initialSnapshot);
    } else {
      this.seedInitialData();
    }
  }

  /**
   * Restore initial snapshot (alias for reset).
   */
  public restoreSnapshot(): void {
    this.reset();
  }

  /**
   * Create an in-memory snapshot of the current state.
   */
  public snapshot(): string {
    return JSON.stringify({
      orders: Array.from(this.orders.entries()),
      products: Array.from(this.products.entries()),
      profiles: Array.from(this.profiles.entries()),
      audit_logs: this.audit_logs,
      order_timelines: this.order_timelines,
      inventory_logs: this.inventory_logs,
      settings: Array.from(this.settings.entries()),
      coupons: Array.from(this.coupons.entries()),
      reviews: Array.from(this.reviews.entries()),
      product_questions: Array.from(this.product_questions.entries())
    });
  }

  /**
   * Restore collections from a saved snapshot string.
   */
  public restore(snapshotJson: string): void {
    this.clearAll();
    const data = JSON.parse(snapshotJson);

    for (const [k, v] of data.orders || []) this.orders.set(k, v);
    for (const [k, v] of data.products || []) this.products.set(k, v);
    for (const [k, v] of data.profiles || []) this.profiles.set(k, v);
    for (const [k, v] of data.settings || []) this.settings.set(k, v);
    for (const [k, v] of data.coupons || []) this.coupons.set(k, v);
    for (const [k, v] of data.reviews || []) this.reviews.set(k, v);
    for (const [k, v] of data.product_questions || []) this.product_questions.set(k, v);

    this.audit_logs = [...(data.audit_logs || [])];
    this.order_timelines = [...(data.order_timelines || [])];
    this.inventory_logs = [...(data.inventory_logs || [])];
  }

  // ==========================================
  // Document Operations & Query Helpers
  // ==========================================

  public getDoc(collection: string, id: string): any | null {
    const map = this.getCollectionMap(collection);
    if (!map) return null;
    const doc = map.get(id);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  public setDoc(collection: string, id: string, data: any): void {
    const map = this.getCollectionMap(collection);
    if (!map) throw new Error(`Collection "${collection}" not supported in MockDatabase.`);
    map.set(id, JSON.parse(JSON.stringify({ ...data, id })));
  }

  public updateDoc(collection: string, id: string, partial: Record<string, any>): void {
    const map = this.getCollectionMap(collection);
    if (!map) throw new Error(`Collection "${collection}" not supported in MockDatabase.`);
    const existing = map.get(id);
    if (!existing) {
      throw new Error(`Document with ID "${id}" in collection "${collection}" does not exist.`);
    }
    const updated = {
      ...existing,
      ...partial,
      id,
      updated_at: new Date().toISOString()
    };
    map.set(id, JSON.parse(JSON.stringify(updated)));
  }

  public deleteDoc(collection: string, id: string): boolean {
    const map = this.getCollectionMap(collection);
    if (!map) return false;
    return map.delete(id);
  }

  public addDoc(collection: string, data: any): any {
    const id = data.id || `${collection.toUpperCase().slice(0, 4)}-${Date.now().toString(36)}`;
    this.setDoc(collection, id, { ...data, id });
    return this.getDoc(collection, id);
  }

  public listDocs(collection: string): any[] {
    const map = this.getCollectionMap(collection);
    if (map) {
      return Array.from(map.values()).map(v => JSON.parse(JSON.stringify(v)));
    }
    if (collection === 'audit_logs') return JSON.parse(JSON.stringify(this.audit_logs));
    if (collection === 'order_timelines') return JSON.parse(JSON.stringify(this.order_timelines));
    if (collection === 'inventory_logs') return JSON.parse(JSON.stringify(this.inventory_logs));
    return [];
  }

  public query(collection: string, predicate: (item: any) => boolean): any[] {
    return this.listDocs(collection).filter(predicate);
  }

  // ==========================================
  // Domain Specific Log Appenders
  // ==========================================

  public addAuditLog(entry: Omit<MockAuditLog, 'id' | 'timestamp'> & { timestamp?: string; id?: string }): MockAuditLog {
    const log: MockAuditLog = {
      id: entry.id || `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };
    this.audit_logs.push(log);
    return log;
  }

  public addOrderTimeline(timeline: Omit<MockOrderTimeline, 'id' | 'timestamp'> & { timestamp?: string; id?: string }): MockOrderTimeline {
    const item: MockOrderTimeline = {
      id: timeline.id || `TIME-${Date.now().toString(36)}`,
      timestamp: timeline.timestamp || new Date().toISOString(),
      ...timeline
    };
    this.order_timelines.push(item);
    return item;
  }

  public addInventoryLog(log: Omit<MockInventoryLog, 'id' | 'timestamp'> & { timestamp?: string; id?: string }): MockInventoryLog {
    const item: MockInventoryLog = {
      id: log.id || `INV-${Date.now().toString(36)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      ...log
    };
    this.inventory_logs.push(item);
    return item;
  }

  // ==========================================
  // Internal Helpers
  // ==========================================

  private getCollectionMap(name: string): Map<string, any> | null {
    switch (name) {
      case 'orders':
        return this.orders;
      case 'products':
        return this.products;
      case 'profiles':
        return this.profiles;
      case 'settings':
        return this.settings;
      case 'coupons':
        return this.coupons;
      case 'reviews':
        return this.reviews;
      case 'product_questions':
        return this.product_questions;
      default:
        return null;
    }
  }
}
