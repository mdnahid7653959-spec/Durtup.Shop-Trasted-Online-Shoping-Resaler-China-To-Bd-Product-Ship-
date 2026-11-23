/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Testing Framework - Common Types and Contracts
 */

export interface TestResult {
  tier: number;
  feature?: string;
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestCase {
  id: string;
  name: string;
  feature?: string;
  run: () => Promise<void> | void;
}

export interface TestSuite {
  tier: number;
  title: string;
  tests: TestCase[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'customer' | 'admin' | 'seller';
  seller_id?: string;
  phone?: string;
  created_at?: string;
}

export interface AuthTokenClaims {
  uid: string;
  sub: string;
  email: string;
  role?: string;
  seller_id?: string;
  iss: string;
  aud: string;
  auth_time: number;
  iat: number;
  exp: number;
  [key: string]: any;
}

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  discount_price: number | null;
  stock_quantity: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  variant_id?: string | null;
  selected_variants?: Record<string, string>;
  color?: string | null;
  size?: string | null;
  variant_name?: string | null;
  product: CartItemProduct;
  image?: string;
  source?: 'regular' | 'cj';
  client_price?: number;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  selected_variants?: Record<string, string>;
  source?: 'regular' | 'cj';
  client_price?: number;
}

export interface OrderCreatePayload {
  items: OrderItemInput[];
  shipping_address: ShippingAddress;
  payment_method: 'cod' | 'bkash';
  bkash_details?: {
    sender_number: string;
    trx_id: string;
  };
  coupon_code?: string | null;
  notes?: string;
  user_id?: string; // Potential client spoofing attempt
  total?: number;   // Potential client spoofing attempt
  subtotal?: number;
}

export interface OrderApiResponse {
  status: number;
  success: boolean;
  order_id?: string;
  order_number?: string;
  total?: number;
  subtotal?: number;
  shipping_cost?: number;
  discount_amount?: number;
  user_id?: string;
  payment_method?: string;
  payment_status?: string;
  error?: string;
  details?: any;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  price: number; // authoritative active sale price
  stock: number;
  variants?: Array<{
    id?: string;
    name?: string;
    color?: string;
    size?: string;
    price?: number;
    stock?: number;
  }>;
  source?: 'regular' | 'cj';
}

export interface CouponItem {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount: number;
  is_active: boolean;
  expires_at?: string;
}
