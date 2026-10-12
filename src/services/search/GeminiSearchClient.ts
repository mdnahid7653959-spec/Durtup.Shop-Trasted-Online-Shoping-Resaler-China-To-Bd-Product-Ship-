/**
 * Durtup.shop — Gemini AI Search Client
 * 
 * Provides client-side interface to the server-side Gemini Search Engine.
 * Features:
 * - High-speed caching (0ms for repeat queries)
 * - Request debouncing
 * - Fallback to local high-precision search if offline
 * - Zero hallucination guarantee: only returns real Durtup catalog products
 */

import { smartSearchService } from "./SmartSearchService";
import type { GeminiSearchIntent, GeminiProductResult } from "@/server/geminiSearchEngine";

export interface GeminiSearchClientOptions {
  categoryHint?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  imageAttachment?: {
    base64: string;
    mimeType?: string;
  };
}

export interface GeminiSearchClientResponse {
  success: boolean;
  intent: GeminiSearchIntent;
  products: GeminiProductResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  source: "durtup_catalog";
  aiPowered: boolean;
}

// In-Memory Client Cache (15-Minute TTL)
const CLIENT_CACHE = new Map<string, { data: GeminiSearchClientResponse; expiresAt: number }>();
const CLIENT_CACHE_TTL = 15 * 60 * 1000;

class GeminiSearchClient {
  public async search(
    query: string,
    options: GeminiSearchClientOptions = {}
  ): Promise<GeminiSearchClientResponse> {
    const qTrim = (query || "").trim();
    const cacheKey = JSON.stringify({ q: qTrim.toLowerCase(), ...options });

    const cached = CLIENT_CACHE.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: qTrim,
          categoryHint: options.categoryHint,
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
          page: options.page || 1,
          limit: options.limit || 24,
          imageAttachment: options.imageAttachment
        })
      });

      if (res.ok) {
        const data: GeminiSearchClientResponse = await res.json();
        if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
          CLIENT_CACHE.set(cacheKey, { data, expiresAt: Date.now() + CLIENT_CACHE_TTL });
          return data;
        }
      }
    } catch (err) {
      console.warn("[GeminiSearchClient] Server API call failed, using client fallback:", err);
    }

    // Client-side Fallback using smartSearchService
    const localRes = await smartSearchService.search(qTrim, {
      category: options.categoryHint,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      page: options.page || 1,
      limit: options.limit || 24
    });

    const fallbackResponse: GeminiSearchClientResponse = {
      success: true,
      intent: {
        originalQuery: qTrim,
        normalizedQuery: qTrim.toLowerCase(),
        productType: qTrim.toLowerCase(),
        category: options.categoryHint || "general",
        attributes: {},
        synonyms: [qTrim],
        negativeTerms: [],
        spellingCorrected: false,
        correctedQuery: null,
        detectedLanguage: /[\u0980-\u09FF]/.test(qTrim) ? "bn" : "en"
      },
      products: localRes.products.map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        rating: p.rating,
        reviews: p.reviews,
        sold: p.sold,
        category: p.category,
        category_name: p.category_name,
        category_slug: p.category_slug,
        score: p.score,
        matchReasons: [p.matchType || "Catalog Match"]
      })),
      total: localRes.total,
      page: localRes.page,
      limit: localRes.limit,
      totalPages: localRes.totalPages,
      source: "durtup_catalog",
      aiPowered: false
    };

    CLIENT_CACHE.set(cacheKey, { data: fallbackResponse, expiresAt: Date.now() + CLIENT_CACHE_TTL });
    return fallbackResponse;
  }

  public clearCache(): void {
    CLIENT_CACHE.clear();
  }
}

export const geminiSearchClient = new GeminiSearchClient();
