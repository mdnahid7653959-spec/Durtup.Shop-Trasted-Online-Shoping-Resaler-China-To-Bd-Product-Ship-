---
name: durtup-ecommerce-design
description: "Comprehensive ecommerce design and brand system guidelines for Durtup.shop. Covers marketplace visual hierarchy, signature orange brand palette, product card architecture, Reseller & China-to-BD sourcing interfaces, checkout trust elements, BDT pricing formats, dark mode styling, and shadcn/ui component integration."
---

# Durtup Ecommerce Design System & Architecture

This skill defines the visual identity, UI design standards, and marketplace patterns for **Durtup.shop** — Bangladesh's premier online shopping, China-to-BD direct product reseller, and multi-vendor marketplace platform.

---

## 1. Durtup Brand Identity & Design Tokens

### A. Color Palette
- **Primary Brand Color**: Vibrant Coral Orange (`#ea580c` / Tailwind `orange-600` / CSS variable `--primary: 24.6 95% 53.1%`).
  - *Usage*: Main CTAs, Add to Cart buttons, active navigation states, discount percentage tags, notification badges.
- **Secondary / Accent Colors**:
  - **Success / Verified**: Emerald Green (`#059669` / Tailwind `emerald-600`). Used for "Verified Buyer ✓", "In Stock", "100% Secure", "Delivered".
  - **Notice / Flash Deal**: Amber Gold (`#d97706` / Tailwind `amber-600`). Used for "Hot Deal", "Flash Sale", star ratings (`★`), limited stock alerts.
  - **Support / Messaging**: WhatsApp Emerald (`#25D366`) and Telegram Blue (`#229ED9`).
- **Neutrals & Surfaces**:
  - **Light Mode**: Clean White (`#ffffff`), Subtle Background (`#f8fafc` / `slate-50`), Soft Borders (`#e2e8f0` / `slate-200`).
  - **Dark Mode**: Deep Charcoal (`#0f172a` / `slate-900`), Card Elevated Surface (`#1e293b` / `slate-800`), Border Dark (`#334155` / `slate-700`).

### B. Typography & Brand Signature
- **Font Stack**: Modern Sans-Serif (`Inter`, `system-ui`, `-apple-system`, `sans-serif`) paired with clean Bengali Unicode typography (`SolaimanLipi`, `Hind Siliguri`, or system Bengali).
- **Logo Signature**:
  - Bold wordmark: `<span className="text-orange-600 font-extrabold">Durtup</span><span className="font-bold">.shop</span>`
  - Accompanied by the signature curved smile arrow underneath representing speedy fulfillment and customer satisfaction.
- **Currency Standard**:
  - Always prefix prices with the authentic Bengali Taka symbol `৳` (e.g., `৳১,২৫০` or `৳1,250`).
  - Original/Strikethrough price placed adjacent to current price (`line-through text-muted-foreground text-xs sm:text-sm`).

---

## 2. Core Marketplace Components Architecture

### A. Professional Product Card (`ProductCard.tsx`)
A high-converting product card designed for maximum scanability:
- **Card Container**: `rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col justify-between`.
- **Top Overlay Elements**:
  - Discount Badge: `bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full`.
  - Floating Action Icons: Quick Wishlist (`Heart`), Product Compare (`Scale`), and Quick View eye icon.
- **Content Area**:
  - Brand / Category label in uppercase muted text (`text-[10px] font-bold text-muted-foreground uppercase`).
  - Product Name: 2 lines clamping with generous line-height (`text-xs sm:text-sm font-semibold line-clamp-2 hover:text-primary transition-colors`).
  - Ratings & Sold Volume: `★ 4.8 (44) • 92 sold`.
  - Pricing Row: Bold accent price + crossed regular price.
- **Action Footer**:
  - Full-width "Order Now" / "অর্ডার করুন" button with instant Buy Now and Add to Cart options.

### B. Product Details Page Architecture (`ProductDetail.tsx`)
1. **Breadcrumbs**: Hierarchical category path (Home > Category > Subcategory > Product).
2. **Interactive Gallery**: Main hero image with thumbnail slider, swipe gestures on touch screens, and zoom lens.
3. **Product Information Grid**:
   - Product title, stock status pill (`In Stock` / `Limited Stock` / `Out of Stock`).
   - Price breakdown (including wholesale reseller margin indicator when logged in as a reseller).
   - Variant Selectors (color swatches, size buttons, specification chips).
   - Delivery & Shipping Estimator (Inside Dhaka vs Outside Dhaka, Air vs Sea shipping).
   - 7 Days Replacement Warranty badge and Cash on Delivery guarantee.
4. **Content Sections Tab / Stack**:
   - Comprehensive description with high-resolution imagery and specs table.
   - Verified Customer Reviews & Photo feedback.
   - Questions & Answers (Q&A) section with verified purchase tags.
   - Frequently Bought Together bundle selector.
   - Related Products & Smart Recommendations.

---

## 3. Bangladesh Reseller & Supplier Hub Integrations

Durtup.shop operates a unique dual-model: Direct Consumer Retail + Reseller Ecosystem.
- **Reseller Experience (`/reseller`)**:
  - Clean wholesale dashboard displaying wholesale price vs suggested retail price.
  - "One-click Add to My Reseller Catalog" and margin calculator.
  - Direct customer fulfillment: Resellers can submit orders where Durtup ships directly to the end-buyer with custom reseller branding / invoice options.
- **China-to-BD Sourcing & Logistics (`/admin/suppliers`)**:
  - Transparent shipping timeline badges on products:
    - ⚡ *Local Stock / রেডি স্টক*: Delivery within 24–48 hours across Bangladesh.
    - ✈️ *China Air Express*: Delivery within 7–12 business days.
    - 🚢 *Sea Freight Sourcing*: Delivery within 25–35 days for bulk/heavy merchandise.

---

## 4. Trust & Security UX across Checkout

In the Bangladesh ecommerce ecosystem, trust is paramount to eliminate cart abandonment:
1. **Prominent Reassurance Badges**:
   - "১০০% আসল পণ্যের নিশ্চয়তা" (100% Genuine Product Guarantee)
   - "পণ্য হাতে পেয়ে মূল্য পরিশোধ (ক্যাশ অন ডেলিভারি)"
   - "৭ দিনে দ্রুত ও সহজ পণ্য পরিবর্তন"
   - "লাইভ কাস্টমার সাপোর্ট ও হেল্পলাইন"
2. **Checkout Step Reduction**:
   - Keep checkout to a single focused page (`/checkout`).
   - Provide clear item summary, delivery fee breakdown, coupon input, and payment selector.
   - Never force user registration before order confirmation — allow guest checkout and auto-create or link profile via mobile number.

---

## 5. Implementation & Code Quality Standards

When writing or refactoring UI components for Durtup.shop:
- Build on top of existing **shadcn/ui** and **Radix UI** primitives located in `@/components/ui/`.
- Use Tailwind CSS utility classes; avoid custom inline CSS styles unless calculating dynamic animations.
- Ensure strict mobile responsiveness: test on 360px, 768px, 1024px, and 1440px viewports.
- Maintain accessible markup: `aria-label` on icon-only buttons, proper `<label>` associations on form inputs, keyboard navigation support on modals and drawers.
- Never hardcode dynamic product attributes; utilize established TypeScript interfaces (`Product`, `Category`, `CartItem`, `Order`).
