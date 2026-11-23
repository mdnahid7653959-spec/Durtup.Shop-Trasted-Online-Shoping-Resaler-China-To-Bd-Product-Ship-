---
name: durtup-mobile-commerce-ux
description: "Mobile-first ecommerce UX optimization standards for Durtup.shop. Covers handheld thumb-zone navigation, mobile checkout flows (COD, bKash, Nagad), touch targets (>=44px), network resilience (2G/3G/4G optimization in Bangladesh), bottom navigation bars, sticky buy bars, fluid sheet drawers, and Bengali-English microcopy."
---

# Durtup Mobile Commerce UX Standards

This skill provides comprehensive mobile UX and mobile-first responsive design intelligence specifically engineered for **Durtup.shop**, a high-volume Bangladesh-focused ecommerce and reseller platform.

---

## 1. Core Mobile UX Principles for Bangladesh E-Commerce

### A. The "Natural Thumb Zone" Architecture
Over 88% of Durtup.shop shoppers access the platform via mobile phones (primarily Android on 360px–414px viewports).
- **Primary Actions in the Thumb Zone (Bottom 35% of the screen)**:
  - Sticky Add to Cart / Order Now actions (`fixed bottom-0 left-0 right-0 z-50`).
  - Mobile bottom navigation bar (`MobileBottomNav.tsx`) with Home, Categories, Cart (with live badge), Orders/Wishlist, Account.
  - Form submit buttons in checkout and address drawers.
- **Secondary Actions (Middle 45% of the screen)**:
  - Product specs, variant selectors (color chips, size pills), customer reviews, Q&A section.
- **Header & Navigation (Top 20% of the screen)**:
  - Sleek top header (`Header.tsx`) with Hamburger menu, Durtup logo with signature curve, and search trigger.
  - Sticky floating taskbar that slides in smoothly when scrolling down (`isScrolled > 120px`).

### B. Touch Target & Ergonomics
- All interactive elements (buttons, pills, icons, checkboxes, quantity steppers) must have a minimum touch target of **44x44px** (WCAG 2.5.5).
- Spacing between adjacent interactive targets must be at least **8px** to prevent accidental mis-taps.
- Text inputs must use `font-size: 16px` (or `text-base` in Tailwind on mobile) to prevent iOS Safari auto-zooming.

---

## 2. Frictionless Mobile Checkout (Bangladesh Localized)

### A. 1-Step Express Mobile Checkout
- **Cash on Delivery (COD) Priority**: COD remains the dominant payment choice in Bangladesh. Keep COD selected as default with clear reassurance: *"পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন (No advance payment needed for regular items)"*.
- **MFS Payment Integration (bKash & Nagad)**:
  - Visual branded payment chips (bKash pink, Nagad orange) with clear discount or cashback labels if active.
  - Clear merchant payment instructions and automatic transaction ID verification.
- **District & Upazila Selection**:
  - Do not require users to manually type postal codes or English spelling variants.
  - Provide fast searchable dropdowns / bottom sheets for 64 districts (Dhaka, Chattogram, Sylhet, Rajshahi, etc.) and automatic delivery fee calculation:
    - Inside Dhaka: ৳60–৳80 (24–48 hours)
    - Outside Dhaka: ৳120–৳150 (2–4 days)
- **Guest / Phone-Only Checkout**:
  - Customers can complete purchases with just Name, Mobile Number, and Delivery Address. No mandatory password creation before ordering.

---

## 3. Mobile Product Card & Discovery Standards

### A. 2-Column Responsive Product Grid
- Grid specification: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4`.
- **Card Hierarchy**:
  1. **Image Ratio**: 1:1 square ratio with subtle rounded corners (`rounded-xl` or `rounded-2xl`).
  2. **Badges**: Top-left discount badge (e.g., `-28%`), top-right wishlist heart toggle.
  3. **Title**: 2 lines max with `line-clamp-2`, readable font size (`text-xs sm:text-sm`).
  4. **Pricing**: Current discount price in bold BDT (`text-sm sm:text-base font-extrabold text-primary`), crossed-out original price (`text-[11px] text-muted-foreground line-through`).
  5. **Social Proof**: Star rating (`★ 4.8`) and verified units sold (`108 sold` / `৫২টি বিক্রি`).
  6. **Call to Action**: High-visibility "Order Now" / "অর্ডার করুন" button with active feedback (`active:scale-95`).

### B. Mobile Sticky Floating Taskbar & Category Navigation
- Fluid horizontal sliding category pills (`CategoryPillsNav.tsx`) with smooth drag support and active droplet indicator.
- Floating sticky taskbar on scroll (`fixed top-0` with `translate-y-0` and backdrop blur) so search and cart are always accessible without scrolling back to top.

---

## 4. Network & Performance Optimization (2G/3G/4G Conditions)

Many users in rural or suburban Bangladesh browse on fluctuating mobile connections:
1. **Aggressive Image Optimization**:
   - Modern WebP / AVIF formats with responsive `srcset`.
   - Native lazy loading (`loading="lazy"`) for all below-the-fold images.
   - SVG icons (`lucide-react`) instead of heavy icon fonts or PNG sprites.
2. **Offline Resilience & Instant Feedback**:
   - Optimistic UI updates for Wishlist, Cart counter, and Q&A votes.
   - Skeleton loaders matching the exact geometric shapes of product cards to eliminate Cumulative Layout Shift (CLS < 0.1).
3. **PWA & Native App Experience**:
   - Mobile web app manifest configured with official icons.
   - Background push notifications via FCM for order updates, flash sales, and price drop alerts.

---

## 5. Bilingual Microcopy Guidelines (Bengali + English)

Durtup.shop serves a bilingual audience. Use clean, respectful, and culturally intuitive phrasing:
- **Buttons**:
  - "Order Now" / "এখনই অর্ডার করুন"
  - "Add to Cart" / "কার্টে যোগ করুন"
  - "Ask Question" / "প্রশ্ন করুন"
  - "Track Order" / "অর্ডার ট্র্যাক করুন"
- **Trust Reassurances**:
  - "১০০% অরিজিনাল পণ্য" (100% Authentic Product)
  - "ক্যাশ অন ডেলিভারি সুবিধা" (Cash on Delivery Available)
  - "৭ দিনের সহজ রিটার্ন পলিসি" (7 Days Easy Replacement)
  - "সারা বাংলাদেশে দ্রুত ডেলিভারি" (Fast Nationwide Delivery)

---

## 6. Review Checklist for Any Mobile Change

When designing or reviewing mobile components in Durtup.shop:
- [ ] Viewport tested on 360px (Galaxy S-series), 390px (iPhone 13/14/15), and 414px (Plus/Max models).
- [ ] No horizontal layout overflow (`overflow-x-hidden`, zero horizontal scrollbars).
- [ ] Touch targets are at least 44x44px.
- [ ] Sticky bottom action bar does not obscure the bottom content (proper padding `pb-20` on product page).
- [ ] Sticky top header transitions smoothly without jitter or layout reflow.
- [ ] Font size in inputs is >= 16px to prevent iOS zoom.
- [ ] Prices clearly formatted with the Bengali Taka sign (`৳`).
