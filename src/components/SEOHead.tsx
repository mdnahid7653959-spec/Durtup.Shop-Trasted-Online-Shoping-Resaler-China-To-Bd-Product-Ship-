import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildFAQJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildArticleJsonLd,
  normalizeCanonicalUrl,
  type ProductSEOData,
  type CategorySEOData,
  type ArticleSEOData,
  type FAQItem,
} from "@/utils/seoHelper";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  product?: ProductSEOData;
  category?: CategorySEOData;
  article?: ArticleSEOData;
  breadcrumbs?: Array<{ name: string; url: string }>;
  itemList?: Array<{ name: string; url: string; image?: string; price?: number }>;
  faqs?: FAQItem[];
  customSchema?: object | object[];
}

const DEFAULT_BASE_URL = "https://durtup.shop";
const DEFAULT_OG_IMAGE = "https://durtup.shop/icon-512.png";

export function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  product,
  category,
  article,
  breadcrumbs,
  itemList,
  faqs,
  customSchema,
}: SEOHeadProps) {
  const { rawSettings: settings } = useSiteSettings();

  useEffect(() => {
    const siteTitle = settings?.metaTitle || "Durtup.shop - Online Shopping in Bangladesh | Best Prices & Deals";
    const finalTitle = title ? (title.includes("Durtup.shop") ? title : `${title} | Durtup.shop`) : siteTitle;
    const finalDescription = description || settings?.metaDescription || "Shop millions of quality products at best prices in Bangladesh. Enjoy Cash on Delivery, fast home delivery, and easy returns at Durtup.shop.";
    const finalImage = image || settings?.ogImage || DEFAULT_OG_IMAGE;
    
    // Clean normalized canonical URL (preferred domain: https://durtup.shop, stripped of query params, tracking, trailing slashes)
    let rawTargetUrl = url;
    if (!rawTargetUrl && typeof window !== "undefined") {
      rawTargetUrl = window.location.pathname;
    }
    const finalCanonical = normalizeCanonicalUrl(rawTargetUrl);

    // 1. Update Document Title
    document.title = finalTitle;

    // 2. Helper to set or create meta elements
    const setMeta = (attrName: "name" | "property", attrValue: string, content: string) => {
      if (!content) return;
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 3. Basic & Search Engine Directives
    setMeta("name", "description", finalDescription);
    setMeta("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta("name", "author", "Durtup.shop");
    setMeta("name", "publisher", "Durtup.shop");

    // 4. Canonical Link Tag
    if (finalCanonical) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", finalCanonical);
    }

    // 5. Open Graph Meta Tags (Facebook, WhatsApp, LinkedIn)
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "Durtup.shop");
    setMeta("property", "og:title", finalTitle);
    setMeta("property", "og:description", finalDescription);
    setMeta("property", "og:url", finalCanonical || DEFAULT_BASE_URL);
    setMeta("property", "og:image", finalImage);
    setMeta("property", "og:image:alt", finalTitle);
    setMeta("property", "og:locale", "bn_BD");
    setMeta("property", "og:locale:alternate", "en_US");

    // 6. Twitter / X Cards
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", "@durtupshop");
    setMeta("name", "twitter:title", finalTitle);
    setMeta("name", "twitter:description", finalDescription);
    setMeta("name", "twitter:image", finalImage);
    setMeta("name", "twitter:image:alt", finalTitle);

    // 7. Cleanup & Inject Dynamic JSON-LD Structured Data
    // Remove existing dynamic script tags created by SEOHead
    const existingDynamicSchemas = document.querySelectorAll('script[data-dynamic-seo="true"]');
    existingDynamicSchemas.forEach((el) => el.remove());

    const schemasToInject: object[] = [];

    // Global Organization & WebSite schema on homepage
    if (type === "website" && (!product && !category)) {
      schemasToInject.push(buildOrganizationJsonLd());
      schemasToInject.push(buildWebSiteJsonLd());
    }

    // Product Schema
    if (product) {
      schemasToInject.push(buildProductJsonLd(product, finalCanonical || DEFAULT_BASE_URL));
    }

    // Article / Guide Schema
    if (article) {
      schemasToInject.push(buildArticleJsonLd(article));
    }

    // Breadcrumbs Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemasToInject.push(buildBreadcrumbJsonLd(breadcrumbs));
    }

    // ItemList Schema
    if (itemList && itemList.length > 0) {
      schemasToInject.push(buildItemListJsonLd(category?.name || title || "Product List", itemList));
    }

    // FAQ Schema
    if (faqs && faqs.length > 0) {
      schemasToInject.push(buildFAQJsonLd(faqs));
    }

    // Custom Schema
    if (customSchema) {
      if (Array.isArray(customSchema)) {
        schemasToInject.push(...customSchema);
      } else {
        schemasToInject.push(customSchema);
      }
    }

    // Inject all JSON-LD schemas
    schemasToInject.forEach((schemaObj) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-dynamic-seo", "true");
      script.textContent = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });

    return () => {
      // Clean up dynamic scripts on unmount
      const toClean = document.querySelectorAll('script[data-dynamic-seo="true"]');
      toClean.forEach((el) => el.remove());
    };
  }, [
    title,
    description,
    image,
    url,
    type,
    noindex,
    product,
    category,
    breadcrumbs,
    itemList,
    faqs,
    customSchema,
    settings,
  ]);

  return null;
}
