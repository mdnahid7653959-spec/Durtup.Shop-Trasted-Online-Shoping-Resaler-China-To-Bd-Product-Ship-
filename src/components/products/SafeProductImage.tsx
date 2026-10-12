import React, { useState, useMemo, useEffect, useRef } from "react";
import { getProductImageCandidates, getResponsiveImageSrcSet, generateProductSvgPlaceholder, globalFailedImageUrls } from "@/utils/productImageHelper";
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
  const candidates = useMemo(() => getProductImageCandidates(product, width), [product, width]);
  const [candidateIdx, setCandidateIdx] = useState(0);

  const currentSrc = candidates[candidateIdx] || generateProductSvgPlaceholder(product?.name, product?.category);
  
  // Instant render if image is already cached or data URI
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!currentSrc) return false;
    if (currentSrc.startsWith("data:")) return true;
    return globalLoadedImageUrls.has(currentSrc);
  });

  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state when product ID or initial candidate changes
  useEffect(() => {
    setCandidateIdx(0);
    const initial = candidates[0];
    if (initial && (globalLoadedImageUrls.has(initial) || initial.startsWith("data:"))) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [product?.id, candidates[0]]);

  // Advance candidate cleanly through React state
  const advanceCandidate = () => {
    setIsLoaded(false);
    if (candidateIdx + 1 < candidates.length) {
      const nextIdx = candidateIdx + 1;
      setCandidateIdx(nextIdx);
      const nextSrc = candidates[nextIdx];
      if (nextSrc && (globalLoadedImageUrls.has(nextSrc) || nextSrc.startsWith("data:"))) {
        setIsLoaded(true);
      }
    } else {
      // Final fallback reached, guarantee display of clean SVG placeholder
      setCandidateIdx(candidates.length);
      setIsLoaded(true);
    }
  };

  // Immediate check if browser already finished loading image (cached in memory/disk)
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (globalLoadedImageUrls.has(currentSrc) || currentSrc.startsWith("data:")) {
      setIsLoaded(true);
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      globalLoadedImageUrls.add(currentSrc);
      onImageLoaded?.();
    }
  }, [currentSrc]);


  // Responsive srcset for dynamic CDNs (Unsplash, wsrv.nl)
  const imageSrcSet = useMemo(() => {
    if (candidateIdx === 0 && currentSrc && !currentSrc.startsWith("data:") && (currentSrc.includes("wsrv.nl") || currentSrc.includes("unsplash.com"))) {
      return getResponsiveImageSrcSet(currentSrc, [160, 240, 360, 480], 75);
    }
    return undefined;
  }, [candidateIdx, currentSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget) {
      e.currentTarget.srcset = "";
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

  const handleLoad = () => {
    setIsLoaded(true);
    if (currentSrc) globalLoadedImageUrls.add(currentSrc);
    onImageLoaded?.();
  };

  return (
    <div className={cn("relative w-full h-full overflow-hidden flex items-center justify-center", containerClassName)}>
      {/* Sleek skeleton placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center pointer-events-none z-0">
          <div className="w-5 h-5 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin opacity-40" />
        </div>
      )}
      <img
        ref={imgRef}
        key={currentSrc}
        src={currentSrc}
        srcSet={imageSrcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt || product?.name || "Product image"}
        title={product?.name}
        draggable={draggable}
        loading={priority ? "eager" : "lazy"}
        {...({ fetchpriority: priority ? "high" : "auto" } as any)}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full transition-opacity duration-200 relative z-1",
          fit === "contain" ? "object-contain" : "object-cover",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
};
