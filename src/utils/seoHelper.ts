/**
 * Durtup.shop — SEO & Structured Data Master Helper
 * Generates dynamic, high-converting, Google-compliant SEO metadata,
 * Bangladesh buying intent keywords, Schema.org JSON-LD structured data, and SEO scores.
 */

export interface ProductSEOData {
  id?: string;
  name: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  regular_price?: number;
  discount_price?: number | null;
  price?: number;
  stock_quantity?: number;
  rating_average?: number;
  rating_count?: number;
  has_real_reviews?: boolean;
  sku?: string;
  brand?: string;
  category?: string;
  category_name?: string;
  image?: string;
  images?: string[];
  product_images?: Array<{ image_url: string }>;
  warranty_info?: string | null;
  free_shipping?: boolean;
}

export interface CategorySEOData {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  productCount?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SEOHealthScoreResult {
  score: number; // 0 to 100
  grade: "A+" | "A" | "B" | "C" | "Needs Improvement";
  passedChecks: string[];
  warnings: string[];
  suggestions: string[];
}

const SITE_NAME = "Durtup.shop";
const BASE_URL = "https://durtup.shop";
const DEFAULT_CURRENCY = "BDT";

export interface ArticleSEOData {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

/**
 * Normalizes any URL into a clean canonical format (strips tracking tags, search facets, query strings, trailing slashes)
 */
export function normalizeCanonicalUrl(rawUrl?: string): string {
  if (!rawUrl) return BASE_URL;
  try {
    const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`);
    let cleanPath = urlObj.pathname.toLowerCase().replace(/\/+$/, "");
    if (!cleanPath) cleanPath = "";
    return `${BASE_URL}${cleanPath}`;
  } catch {
    const cleanPath = (rawUrl.split("?")[0].split("#")[0] || "").toLowerCase().replace(/\/+$/, "");
    return `${BASE_URL}${cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath}`;
  }
}

/**
 * Generates an SEO-optimized title for products targeting Bangladesh search intent
 * Standard: [Product Name] Price in Bangladesh | Durtup.shop
 */
export function generateProductSEOTitle(product: ProductSEOData): string {
  const name = (product.name || "Product").trim();
  
  if (name.toLowerCase().includes("price in bangladesh")) {
    return name.includes(SITE_NAME) ? name : `${name} | ${SITE_NAME}`;
  }

  return `${name} Price in Bangladesh | ${SITE_NAME}`;
}

/**
 * Generates a natural, search-intent-focused meta description for product pages
 */
export function generateProductSEODescription(product: ProductSEOData): string {
  const name = (product.name || "Product").trim();
  const price = product.discount_price || product.regular_price || product.price;
  const priceText = price ? `at ৳${price.toLocaleString("en-BD")}` : "at best price";
  const rawDesc = (product.short_description || product.description || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\\x[0-9A-Fa-f]{2}/g, "")
    .trim();
  
  let snippet = "";
  if (rawDesc.length > 15) {
    snippet = rawDesc.slice(0, 85).trim() + "... ";
  }

  const stockText = (product.stock_quantity ?? 1) > 0 ? "Fast home delivery & Cash on Delivery" : "Check availability";
  const warrantyText = product.warranty_info ? ` with ${product.warranty_info}` : "";

  const desc = `Buy ${name} online ${priceText} in Bangladesh. ${snippet}${stockText}${warrantyText} at ${SITE_NAME}. Order today!`;
  return desc.slice(0, 160);
}

/**
 * Generates SEO metadata for category landing pages
 * Standard: [Category Name] Price in Bangladesh | Durtup.shop
 */
export function generateCategorySEOTitle(category: CategorySEOData): string {
  const name = (category.name || "Products").trim();
  if (name.toLowerCase().includes("price in bangladesh")) {
    return name.includes(SITE_NAME) ? name : `${name} | ${SITE_NAME}`;
  }
  return `${name} Price in Bangladesh | ${SITE_NAME}`;
}

export function generateCategorySEODescription(category: CategorySEOData): string {
  const name = (category.name || "Products").trim();
  return `Explore genuine ${name} at best prices in Bangladesh at ${SITE_NAME}. 100% authentic quality, Cash on Delivery, and fast home delivery nationwide.`;
}

/**
 * Builds Schema.org Article JSON-LD for guides/blog
 */
export function buildArticleJsonLd(article: ArticleSEOData): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image || `${BASE_URL}/icon-512.png`,
    url: normalizeCanonicalUrl(article.url),
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Person",
      name: article.authorName || "Durtup Editorial Team",
      url: `${BASE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": normalizeCanonicalUrl(article.url),
    },
  };
}

/**
 * Builds Schema.org Product JSON-LD
 */
export function buildProductJsonLd(product: ProductSEOData, canonicalUrl: string): object {
  const price = product.discount_price || product.regular_price || product.price || 0;
  const inStock = (product.stock_quantity ?? 1) > 0;
  
  const imgList: string[] = [];
  if (product.image) imgList.push(product.image);
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => { if (img && !imgList.includes(img)) imgList.push(img); });
  }
  if (product.product_images && Array.isArray(product.product_images)) {
    product.product_images.forEach(img => {
      const url = typeof img === "string" ? img : img.image_url;
      if (url && !imgList.includes(url)) imgList.push(url);
    });
  }
  if (imgList.length === 0) {
    imgList.push(`${BASE_URL}/icon-512.png`);
  }

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: imgList,
    description: generateProductSEODescription(product),
    sku: product.sku || product.id || `DURTUP-${product.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`,
    mpn: product.id || product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || "Durtup",
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: DEFAULT_CURRENCY,
      price: price.toString(),
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: BASE_URL,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn"
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.free_shipping ? "0" : "60",
          currency: DEFAULT_CURRENCY,
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "d"
          }
        }
      }
    },
  };

  // STRICT GOOGLE COMPLIANCE: Only include aggregateRating if real, verified user reviews exist on the product
  if (product.has_real_reviews && product.rating_average && product.rating_average > 0 && product.rating_count && product.rating_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating_average.toFixed(1),
      reviewCount: product.rating_count,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

/**
 * Builds Schema.org BreadcrumbList JSON-LD
 */
export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Builds Schema.org ItemList JSON-LD for category/listing pages
 */
export function buildItemListJsonLd(name: string, items: Array<{ name: string; url: string; image?: string; price?: number }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      image: item.image,
    })),
  };
}

/**
 * Builds Schema.org FAQPage JSON-LD
 */
export function buildFAQJsonLd(faqs: FAQItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Builds Schema.org Organization & WebSite JSON-LD
 * Fully establishes Durtup.shop brand entity and all recognized query variations
 */
export function buildOrganizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineBusiness",
    "@id": `${BASE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [
      "Durtup",
      "durtup",
      "DURTUP",
      "Durtup Shop",
      "Durtup.shop",
      "Durtup Shop BD",
      "Durtup BD",
      "Durtup Bangladesh",
      "Durtup Ecommerce",
      "Durtup Online Shopping",
      "durt",
      "durtu",
      "durtup.com",
      "দুর্তুপ",
      "দোরতূপ",
      "অনলাইন শপিং বাংলাদেশ",
    ],
    legalName: "Durtup Shop Bangladesh",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/icon-512.png`,
      caption: "Durtup.shop Logo",
    },
    image: `${BASE_URL}/icon-512.png`,
    description: "পছন্দের পণ্য খুঁজে নিন Durtup.shop-এ। গ্যাজেট, ইলেকট্রনিক্স, ফ্যাশন, হোম ও আরও অনেক পণ্য সাশ্রয়ী দামে—সহজ অর্ডার ও নিরাপদ শপিং।",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dhanmondi",
      addressLocality: "Dhaka",
      postalCode: "1209",
      addressCountry: "BD",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "23.7461",
      longitude: "90.3742",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+8801622530550",
        contactType: "customer service",
        areaServed: "BD",
        availableLanguage: ["Bangla", "English"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/profile.php?id=61582125938251",
      "https://www.instagram.com/durtup.shop/",
      "https://www.tiktok.com/@durtup.shop?is_from_webapp=1&sender_device=pc",
    ],
    knowsAbout: [
      "E-commerce in Bangladesh",
      "Online Shopping BD",
      "Consumer Electronics",
      "Smart Watches",
      "Earbuds & Audio",
      "Men's & Women's Fashion",
      "Cash on Delivery Bangladesh",
    ],
  };
}

export function buildWebSiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ["Durtup", "Durtup Shop", "Durtup BD", "Durtup Bangladesh"],
    url: BASE_URL,
    inLanguage: ["bn-BD", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Default Genuine Bangladesh FAQs for Products & Categories
 */
export const DEFAULT_BANGLADESH_PRODUCT_FAQS: FAQItem[] = [
  {
    question: "এই পণ্যটি কি সারা বাংলাদেশে হোম ডেলিভারি পাওয়া যায়?",
    answer: "হ্যাঁ, Durtup.shop থেকে ঢাকা সহ বাংলাদেশের যেকোনো জেলা ও উপজেলায় দ্রুত হোম ডেলিভারি দেওয়া হয়।",
  },
  {
    question: "ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা আছে কি?",
    answer: "হ্যাঁ, আপনি কোনো অগ্রিম পেমেন্ট ছাড়াই পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে টাকা পরিশোধ করতে পারবেন।",
  },
  {
    question: "ডেলিভারি পেতে কতদিন সময় লাগে?",
    answer: "ঢাকা সিটির ভেতরে ১-২ দিন এবং ঢাকার বাইরে ২-৩ কার্যদিবসের মধ্যে পার্সেল ডেলিভারি সম্পন্ন হয়।",
  },
  {
    question: "পণ্যটিতে কোনো সমস্যা থাকলে কি রিটার্ন করা যাবে?",
    answer: "পণ্য হাতে পাওয়ার সাথে সাথে ডেলিভারি রাইডারের সামনে প্যাকেট খুলে চেক করে নিতে হবে। কোনো ত্রুটি বা সমস্যা থাকলে তাৎক্ষণিকভাবে রাইডারের কাছেই রিটার্ন করতে হবে (অন্যথায় পরবর্তীতে কোনো রিটার্ন রিকোয়েস্ট গ্রহণযোগ্য হবে না)।",
  },
];

/**
 * Practical Internal SEO Health Score Calculator (0 - 100%)
 */
export function calculateSEOHealthScore(params: {
  title?: string;
  description?: string;
  slug?: string;
  hasImage?: boolean;
  hasSchema?: boolean;
  contentLength?: number;
  focusKeyword?: string;
}): SEOHealthScoreResult {
  let score = 0;
  const passed: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const {
    title = "",
    description = "",
    slug = "",
    hasImage = false,
    hasSchema = false,
    contentLength = 0,
    focusKeyword = "",
  } = params;

  // 1. Title Check (25 pts)
  const titleLen = title.trim().length;
  if (titleLen >= 30 && titleLen <= 65) {
    score += 25;
    passed.push("Title length is optimal (30-65 chars).");
  } else if (titleLen > 0) {
    score += 15;
    warnings.push(titleLen < 30 ? "Title is slightly short." : "Title exceeds 65 chars and may be truncated on Google.");
  } else {
    suggestions.push("Add a descriptive SEO title.");
  }

  // 2. Meta Description Check (20 pts)
  const descLen = description.trim().length;
  if (descLen >= 110 && descLen <= 160) {
    score += 20;
    passed.push("Meta description length is ideal (110-160 chars).");
  } else if (descLen > 0) {
    score += 10;
    warnings.push(descLen < 110 ? "Meta description is too short." : "Meta description exceeds 160 chars.");
  } else {
    suggestions.push("Add a high-converting meta description.");
  }

  // 3. Slug / URL Quality (15 pts)
  if (slug && /^[a-z0-9-]+$/.test(slug)) {
    score += 15;
    passed.push("URL slug is clean and SEO-friendly.");
  } else if (slug) {
    score += 8;
    warnings.push("Slug contains uppercase letters or special characters.");
  } else {
    suggestions.push("Ensure a clean lowercase slug is generated.");
  }

  // 4. Product Image Presence (15 pts)
  if (hasImage) {
    score += 15;
    passed.push("Product image & OpenGraph visuals are ready.");
  } else {
    suggestions.push("Upload at least one high-resolution product image.");
  }

  // 5. Structured Data / Schema (15 pts)
  if (hasSchema) {
    score += 15;
    passed.push("Schema.org Product & BreadcrumbList structured data configured.");
  } else {
    suggestions.push("Enable JSON-LD structured data.");
  }

  // 6. Content Depth / Description length (10 pts)
  if (contentLength >= 100) {
    score += 10;
    passed.push("Product description provides sufficient details.");
  } else if (contentLength > 0) {
    score += 5;
    warnings.push("Product description is brief. Adding more specifications improves search rankings.");
  } else {
    suggestions.push("Write a clear product description with specifications.");
  }

  // Focus keyword bonus check
  if (focusKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    passed.push(`Title includes focus keyword: "${focusKeyword}"`);
  }

  let grade: SEOHealthScoreResult["grade"] = "Needs Improvement";
  if (score >= 90) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 40) grade = "C";

  return {
    score,
    grade,
    passedChecks: passed,
    warnings,
    suggestions,
  };
}
