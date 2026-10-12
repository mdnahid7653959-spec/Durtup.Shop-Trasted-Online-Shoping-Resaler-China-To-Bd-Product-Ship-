/**
 * Known dummy/mock test customer names from previous development and seed fixtures
 */
const KNOWN_DEMO_NAMES = new Set([
  "farhad alam",
  "tanvir ahmed",
  "nazmul islam",
  "fatema akter",
  "zayan chowdhury",
  "anika tabassum",
  "sadia mahmud",
  "sabrina khan",
  "rubel hasan",
  "jannatul ferdous",
  "ashiqur rahman",
  "rakibul islam",
  "sharif ali",
  "rahim ahmed",
  "fatema tuz zohra",
  "bhupati changma",
  "test user",
  "demo user",
  "mock customer"
]);

/**
 * Utility to identify and filter out test/mock/fake orders created during development
 */
export function isMockOrder(o: any): boolean {
  if (!o) return true;

  // 1. Explicit boolean flag for mock test orders
  if (o.is_mock === true || o.isMock === true || o.is_test === true || o.isTest === true) {
    return true;
  }

  const num = (o.order_number || o.orderNumber || o.id || "").toString().toLowerCase().trim();
  const rawName = (
    o.shipping_address?.firstName 
      ? `${o.shipping_address.firstName} ${o.shipping_address.lastName || ""}`
      : o.shipping_address?.name || o.customer_name || o.name || ""
  ).toString().toLowerCase().trim();

  const phone = (
    o.shipping_address?.phone ||
    o.customer_phone ||
    o.phone ||
    ""
  ).toString().replace(/[^\d]/g, "").trim();

  const email = (
    o.shipping_address?.email ||
    o.customer_email ||
    o.email ||
    ""
  ).toString().toLowerCase().trim();

  // 2. Explicit legacy template mock numbers and test prefixes
  if (
    num === "ord-2026-1001" ||
    num === "ord-2026-1002" ||
    num === "ord-1001" ||
    num === "ord-1002" ||
    num === "ord-test-992" ||
    num.startsWith("mock-") ||
    num.startsWith("test-") ||
    num.startsWith("d-2024-") ||
    num.startsWith("d-2025-") ||
    num.startsWith("ord-hold-") ||
    num.startsWith("ord-adj") ||
    num.includes("mock") ||
    num.includes("sample-order")
  ) {
    return true;
  }

  // 3. Fake dummy phone numbers (sequential/repeating numbers like 01911111111, 01700000000)
  if (
    phone === "01700000000" ||
    phone === "01800000000" ||
    phone === "01911111111" ||
    phone === "01822222222" ||
    phone === "01733333333" ||
    phone === "01544444444" ||
    phone === "01655555555" ||
    phone === "01766666666" ||
    phone === "01877777777" ||
    phone === "01988888888" ||
    phone === "01799999999" ||
    phone === "01600000000" ||
    phone === "01511111111" ||
    phone === "01234567890" ||
    phone === "0123456789" ||
    phone === "01700000001"
  ) {
    return true;
  }

  // 7+ identical repeated digits in phone number (e.g. 01700000000, 01911111111)
  if (/^01\d(\d)\1{6,}$/.test(phone)) {
    return true;
  }

  // 4. Known demo names paired with demo prefixes or lack of valid customer contact
  if (
    KNOWN_DEMO_NAMES.has(rawName) && 
    (num.startsWith("d-") || num.startsWith("ord-hold-") || num.startsWith("ord-adj") || /^01\d(\d)\1{6,}$/.test(phone))
  ) {
    return true;
  }

  // 5. Fake test domains
  if (
    email.includes("example.com") ||
    email.includes("test@") ||
    email.includes("fake@") ||
    email.includes("demo@")
  ) {
    return true;
  }

  return false;
}

/**
 * Purge mock orders from browser LocalStorage caches
 */
export function purgeMockOrdersFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = ["enterprise_admin_orders", "local_orders", "durtup_admin_orders", "admin_orders"];
    keys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const cleaned = list.filter((item: any) => !isMockOrder(item));
            if (cleaned.length === 0) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {}
}

