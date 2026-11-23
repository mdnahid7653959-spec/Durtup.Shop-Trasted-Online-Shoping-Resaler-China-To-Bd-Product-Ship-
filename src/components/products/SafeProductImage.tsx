import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getProductImageCandidates, getResponsiveImageSrcSet, generateProductSvgPlaceholder, globalFailedImageUrls, KNOWN_DEAD_ORIGIN_URLS, getDirectImageUrl } from "@/utils/productImageHelper";
import { cn } from "@/lib/utils";

// Global in-memory cache of successfully loaded images for 0ms instantaneous render across session
const globalLoadedImageUrls = new Set<string>();

export interface SafeProductImageProps {
  product: {
    id?: string | number;
    name: string;
    image?: string;
    images?: any[];
    product_images?: any[];
    category?: string;
    category_id?: string;
    [key: string]: any;
  };
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  alt?: string;
  draggable?: boolean;
  fit?: "contain" | "cover";
  onImageLoaded?: () => void;
}

export const SafeProductImage: React.FC<SafeProductImageProps> = ({
  product,
  width = 300,
  height = 300,
  sizes,
  className,
  containerClassName,
  priority = false,
  alt,
  draggable = false,
  fit = "contain",
  onImageLoaded,
}) => {
  const prodKey = String(product?.id || product?.slug || product?.name || "");
  const lastProdKeyRef = useRef(prodKey);

  const candidates = useMemo(
    () => getProductImageCandidates(product, width),
    [prodKey, product?.image, product?.image_url, width]
  );
  const [candidateIdx, setCandidateIdx] = useState(0);

  const currentSrc = candidates[candidateIdx] || generateProductSvgPlaceholder(product?.name, product?.category);

  // Instant render if image is already cached or data URI
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!currentSrc) return false;
    if (currentSrc.startsWith("data:")) return true;
    return globalLoadedImageUrls.has(currentSrc);
  });

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Advance candidate cleanly through React state skipping known dead URLs
  const advanceCandidate = useCallback(() => {
    let nextIdx = candidateIdx + 1;
    while (
      nextIdx < candidates.length &&
      (globalFailedImageUrls.has(candidates[nextIdx]) || KNOWN_DEAD_ORIGIN_URLS.has(candidates[nextIdx]))
    ) {
      nextIdx++;
    }

    if (nextIdx < candidates.length) {
      setCandidateIdx(nextIdx);
      const nextSrc = candidates[nextIdx];
      if (nextSrc && (globalLoadedImageUrls.has(nextSrc) || nextSrc.startsWith("data:"))) {
        setIsLoaded(true);
      } else {
        setIsLoaded(false);
      }
    } else {
      // Final fallback reached, guarantee display of clean SVG placeholder
      setCandidateIdx(candidates.length);
      setIsLoaded(true);
    }
  }, [candidateIdx, candidates]);

  // Callback ref to instantly detect cached / immediately decoded images
  const setImgRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node && node.complete && node.naturalWidth > 1) {
      setIsLoaded(true);
      if (currentSrc) globalLoadedImageUrls.add(currentSrc);
      onImageLoaded?.();
    }
  }, [currentSrc, onImageLoaded]);

  // Sync state ONLY when product actually changes (prevents re-render flashing loops)
  useEffect(() => {
    if (lastProdKeyRef.current !== prodKey) {
      lastProdKeyRef.current = prodKey;
      setCandidateIdx(0);
      const initial = candidates[0];
      if (initial && (globalLoadedImageUrls.has(initial) || initial.startsWith("data:"))) {
        setIsLoaded(true);
      } else {
        setIsLoaded(false);
      }
    }
  }, [prodKey, candidates]);

  // Immediate check if browser already finished loading image (cached in memory/disk)
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (globalLoadedImageUrls.has(currentSrc) || currentSrc.startsWith("data:")) {
      setIsLoaded(true);
      return;
    }

    if (img.complete && img.naturalWidth > 1) {
      setIsLoaded(true);
      globalLoadedImageUrls.add(currentSrc);
      onImageLoaded?.();
    }
  }, [currentSrc, onImageLoaded]);



  // Responsive srcset for dynamic CDNs (Unsplash, wsrv.nl)
  const imageSrcSet = useMemo(() => {
    if (
      currentSrc &&
      !currentSrc.startsWith("data:") &&
      !currentSrc.startsWith("blob:") &&
      (currentSrc.includes("wsrv.nl") || currentSrc.includes("images.unsplash.com"))
    ) {
      const set = getResponsiveImageSrcSet(currentSrc, [180, 260, 360, 480], 75);
      return set && set.trim().length > 0 ? set.trim() : undefined;
    }
    return undefined;
  }, [currentSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgEl = e.currentTarget;
    if (imgEl) {
      imgEl.removeAttribute("srcset");
    }
    if (currentSrc && !currentSrc.startsWith("data:")) {
      globalFailedImageUrls.add(currentSrc);
    }
    if (currentSrc.startsWith("data:")) {
      setIsLoaded(true);
      return;
    }

    advanceCandidate();
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img && (img.naturalWidth <= 1 || img.naturalHeight <= 1)) {
      handleError(e);
      return;
    }
    setIsLoaded(true);
    if (currentSrc) globalLoadedImageUrls.add(currentSrc);
    onImageLoaded?.();
  };

  return (
    <div className={cn("relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900/40", containerClassName)}>
      {/* High-end shimmering skeleton placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 skeleton-shimmer pointer-events-none z-0" />
      )}
      <img
        ref={setImgRef}
        key={`${prodKey}-${candidateIdx}`}
        src={currentSrc}
        srcSet={imageSrcSet || undefined}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt || product?.name || "Product image"}
        title={product?.name}
        draggable={draggable}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full relative z-1 transition-opacity duration-300 ease-out will-change-[opacity]",
          fit === "contain" ? "object-contain" : "object-cover",
          isLoaded 
            ? "opacity-100" 
            : "opacity-0",
          className
        )}
      />
    </div>
  );
};
