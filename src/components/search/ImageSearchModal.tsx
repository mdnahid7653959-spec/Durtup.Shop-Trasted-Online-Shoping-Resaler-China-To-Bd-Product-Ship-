import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X,
  Scan,
  AlertCircle,
  Camera,
  UploadCloud,
  Sparkles,
  Link2,
  Clipboard,
  ArrowRight,
  FlipHorizontal,
  CheckCircle2,
  Check,
  Image as ImageIcon
} from "lucide-react";
import { analyzeProductImage, setVisualSearchSession } from "@/utils/imageSearch";
import { cn } from "@/lib/utils";

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectKeyword?: (keyword: string) => void;
}


export function ImageSearchModal({ open, onOpenChange, onSelectKeyword }: ImageSearchModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doraemonVideoRef = useRef<HTMLVideoElement>(null);

  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [combinedTextQuery, setCombinedTextQuery] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [videoStatusText, setVideoStatusText] = useState<string>("Searching catalog for matching products... 🎒");
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [showCameraStream, setShowCameraStream] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isDragging, setIsDragging] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Synchronization refs: Wait for Doraemon to pull gadget out before navigating
  const searchReadyToNavigateRef = useRef<(() => void) | null>(null);
  const videoFinishedRef = useRef<boolean>(false);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraStream(false);
  };

  useEffect(() => {
    if (!open) {
      stopCameraStream();
      setAnalyzing(false);
      setShowCameraStream(false);
      setSelectedFilePreview(null);
      setCombinedTextQuery("");
      setErrorMessage(null);
      setCameraError(null);
      setIsDragging(false);
      setVideoProgress(0);
      setVideoStatusText("Searching catalog for matching products... 🎒");
      searchReadyToNavigateRef.current = null;
      videoFinishedRef.current = false;
    }
  }, [open]);

  // When analyzing becomes true, play Doraemon animation with natural progress transitions
  useEffect(() => {
    if (analyzing) {
      if (doraemonVideoRef.current) {
        doraemonVideoRef.current.currentTime = 0;
        doraemonVideoRef.current.playbackRate = 1.75;
        doraemonVideoRef.current.play().catch(() => {});
      }

      // Smooth progress animation: 25% -> 60% -> 85%
      const p1 = setTimeout(() => {
        setVideoProgress(60);
        setVideoStatusText("AI Vision is analyzing the product... ✨");
      }, 500);

      const p2 = setTimeout(() => {
        setVideoProgress(85);
        setVideoStatusText("Scanning 3,000+ catalog items for the best match... 🔍");
      }, 1500);

      // Generous safety fallback (15s) in case network completely drops
      const maxTimer = setTimeout(() => {
        setAnalyzing(false);
        onOpenChange(false);
        navigate("/products?visualSearch=true");
      }, 15000);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearTimeout(maxTimer);
      };
    }
  }, [analyzing, navigate, onOpenChange]);

  const handleVideoTimeUpdate = () => {
    const v = doraemonVideoRef.current;
    if (!v || !v.duration) return;
    const current = v.currentTime;
    const dur = v.duration;
    const pct = Math.min(100, Math.round((current / dur) * 100));
    setVideoProgress(Math.max(pct, 20));
  };

  const handleVideoEnded = () => {
    videoFinishedRef.current = true;
    setVideoProgress(100);

    // If search results are already prepared, navigate immediately
    if (searchReadyToNavigateRef.current) {
      const fn = searchReadyToNavigateRef.current;
      searchReadyToNavigateRef.current = null;
      setTimeout(() => {
        fn();
      }, 100);
    } else {
      // If search is finalizing, poll quickly until results arrive
      const pollTimer = setInterval(() => {
        if (searchReadyToNavigateRef.current) {
          clearInterval(pollTimer);
          const fn = searchReadyToNavigateRef.current;
          searchReadyToNavigateRef.current = null;
          setTimeout(() => fn(), 50);
        }
      }, 80);

      setTimeout(() => {
        clearInterval(pollTimer);
      }, 4000);
    }
  };

  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    setErrorMessage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        mediaStreamRef.current = stream;
        setShowCameraStream(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err: any) {
      console.warn("Camera stream unavailable. Opening device camera...", err);
      setCameraError("Camera stream unavailable. Opening device camera...");
      cameraInputRef.current?.click();
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          stopCameraStream();
          onSelectFile(file);
        }
      }, "image/jpeg", 0.92);
    }
  };

  const onSelectFile = (file: File | null) => {
    if (!file) return;
    setErrorMessage(null);
    setCameraError(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image file size cannot exceed 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setSelectedFilePreview(preview);
      executeSearch(file, preview);
    };
    reader.readAsDataURL(file);
  };

  // Direct URL Drop or Sample Image selection
  const handleImageUrlDrop = async (url: string, hintKeyword?: string) => {
    try {
      setAnalyzing(true);
      setSelectedFilePreview(url);
      videoFinishedRef.current = false;
      searchReadyToNavigateRef.current = null;
      setVideoProgress(15);
      setVideoStatusText("Searching catalog for matching products... 🎒");

      const res = await fetch(url);
      const blob = await res.blob();
      const rawFileName = url.split("?")[0].split("/").pop() || "selected-image.webp";
      const file = new File([blob], rawFileName, { type: blob.type || "image/webp" });
      if (hintKeyword) {
        setCombinedTextQuery(hintKeyword);
      }
      executeSearch(file, url, hintKeyword);
    } catch (err) {
      console.warn("Could not fetch dropped image url directly, using as search:", err);
      executeSearchWithUrl(url, hintKeyword);
    }
  };

  const executeSearchWithUrl = async (url: string, hintKeyword?: string) => {
    setAnalyzing(true);
    videoFinishedRef.current = false;
    searchReadyToNavigateRef.current = null;
    setVideoProgress(15);
    setVideoStatusText("Searching catalog for matching products... 🎒");

    const activeQuery = (hintKeyword && hintKeyword.trim()) || (combinedTextQuery && combinedTextQuery.trim()) || "";

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch("/api/ai/visual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ filename: url, userQuery: activeQuery, maxResults: 24 })
      });
      clearTimeout(timer);

      const data = await resp.json();
      if (data && data.products) {
        const mapped = data.products.map((p: any) => ({
          product: p,
          matchScore: p.matchScore || 90,
          matchTier: p.matchTier || (p.matchScore >= 2000 ? "best" : "similar"),
          matchedReasons: p.matchedReasons || ["Visual Match"]
        }));
        setVisualSearchSession({
          previewUrl: url,
          sessionKey: data.sessionKey,
          matchedProducts: mapped,
          bestMatches: mapped.filter((m: any) => m.matchTier === "best"),
          similarProducts: mapped.filter((m: any) => m.matchTier === "similar"),
          confidence: data.confidence || 90,
          keyword: activeQuery || data.primaryKeyword || "Visual Search",
          total: data.total !== undefined ? data.total : mapped.length,
          page: data.page || 1,
          hasMore: Boolean(data.hasMore),
          aiAnalysis: data.aiAnalysis
        });
      }

      const navigateAction = () => {
        setAnalyzing(false);
        onOpenChange(false);
        if (activeQuery) {
          navigate(`/products?search=${encodeURIComponent(activeQuery)}&visualSearch=true`);
        } else {
          navigate(`/products?visualSearch=true`);
        }
      };

      setVideoProgress(100);
      setTimeout(navigateAction, 300);
    } catch (err) {
      console.warn("Visual search request error:", err);
      setTimeout(() => {
        setAnalyzing(false);
        onOpenChange(false);
        navigate(`/products?visualSearch=true`);
      }, 150);
    }
  };

  const executeSearch = async (file: File, previewUrl: string, explicitQuery?: string) => {
    stopCameraStream();
    setAnalyzing(true);
    setErrorMessage(null);
    videoFinishedRef.current = false;
    searchReadyToNavigateRef.current = null;
    setVideoProgress(20);
    setVideoStatusText("Searching catalog for matching products... 🎒");

    try {
      const userText = (explicitQuery && explicitQuery.trim()) || (combinedTextQuery && combinedTextQuery.trim()) || "";
      const res = await analyzeProductImage(file, userText);

      const confidence = res.confidence || res.matchedProducts[0]?.matchScore || 0;
      const finalMatchedProducts = res.matchedProducts || [];

      setVisualSearchSession({
        previewUrl: res.previewUrl || previewUrl,
        sessionKey: res.sessionKey,
        matchedProducts: finalMatchedProducts,
        bestMatches: res.bestMatches && res.bestMatches.length > 0 ? res.bestMatches : finalMatchedProducts.filter(m => m.matchTier === "best"),
        similarProducts: res.similarProducts && res.similarProducts.length > 0 ? res.similarProducts : finalMatchedProducts.filter(m => m.matchTier !== "best"),
        confidence,
        keyword: userText || res.primaryKeyword || "Visual Search",
        total: res.total !== undefined ? res.total : finalMatchedProducts.length,
        page: res.page || 1,
        hasMore: res.hasMore,
        aiAnalysis: res.aiAnalysis
      });

      const navigateAction = () => {
        setAnalyzing(false);
        onOpenChange(false);

        if (userText && onSelectKeyword) {
          onSelectKeyword(userText);
        }

        if (userText) {
          navigate(`/products?search=${encodeURIComponent(userText)}&visualSearch=true`);
        } else {
          navigate(`/products?visualSearch=true`);
        }
      };

      setVideoProgress(100);
      setVideoStatusText("Matching products found! Redirecting... 🎯");
      setTimeout(navigateAction, 350);

    } catch (err: any) {
      console.error("Failed to analyze image:", err);
      setTimeout(() => {
        setAnalyzing(false);
        onOpenChange(false);
        navigate(`/products?visualSearch=true`);
      }, 150);
    }
  };

  // Handle Paste Event on the text bar
  const handlePasteInput = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            onSelectFile(file);
            return;
          }
        }
      }
    }

    const files = e.clipboardData?.files;
    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      e.preventDefault();
      onSelectFile(files[0]);
      return;
    }

    const pastedText = e.clipboardData?.getData("text")?.trim();
    if (pastedText) {
      const isImageUrl = (
        pastedText.startsWith("data:image/") ||
        pastedText.startsWith("blob:") ||
        /\.(jpeg|jpg|png|webp|gif|avif|svg)(\?.*)?$/i.test(pastedText) ||
        pastedText.startsWith("http://") ||
        pastedText.startsWith("https://")
      );

      if (isImageUrl) {
        e.preventDefault();
        setCombinedTextQuery(pastedText);
        handleImageUrlDrop(pastedText);
        return;
      }
    }
  };

  // Dedicated Paste Button using Clipboard API
  const handleClipboardButton = async () => {
    setClipboardFeedback(true);
    setTimeout(() => setClipboardFeedback(false), 1500);

    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith("image/"));
          if (imgType) {
            const blob = await item.getType(imgType);
            const file = new File([blob], "clipboard-image.png", { type: imgType });
            onSelectFile(file);
            return;
          }
        }
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
          if (
            text.startsWith("data:image/") ||
            text.startsWith("blob:") ||
            /\.(jpeg|jpg|png|webp|gif|avif)(\?.*)?$/i.test(text) ||
            text.startsWith("http://") ||
            text.startsWith("https://")
          ) {
            setCombinedTextQuery(text);
            handleImageUrlDrop(text);
            return;
          } else {
            setCombinedTextQuery(text);
          }
        }
      }
    } catch (err) {
      console.warn("Clipboard access error:", err);
    }
  };

  const handleInputSubmit = () => {
    const trimmed = combinedTextQuery.trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:image/")
    ) {
      handleImageUrlDrop(trimmed);
    } else {
      onOpenChange(false);
      navigate(`/products?search=${encodeURIComponent(trimmed)}&visualSearch=true`);
    }
  };

  // Global window paste listener when modal is open
  useEffect(() => {
    if (!open || analyzing) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              onSelectFile(file);
              return;
            }
          }
        }
      }

      const files = e.clipboardData?.files;
      if (files && files.length > 0 && files[0].type.startsWith("image/")) {
        e.preventDefault();
        onSelectFile(files[0]);
        return;
      }

      const text = e.clipboardData?.getData("text")?.trim();
      if (text && (
        text.startsWith("data:image/") ||
        text.startsWith("blob:") ||
        /\.(jpeg|jpg|png|webp|gif|avif)(\?.*)?$/i.test(text)
      )) {
        e.preventDefault();
        setCombinedTextQuery(text);
        handleImageUrlDrop(text);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [open, analyzing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Luxury Backdrop with smooth blur */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300" />

        {/* Modal / Mobile Bottom Sheet Content Container */}
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 bg-card/95 backdrop-blur-2xl text-card-foreground shadow-2xl flex flex-col focus:outline-none transition-all duration-300",
            // Mobile layout: Bottom sheet docked perfectly at the bottom, 100% width, rounded top corners
            "inset-x-0 bottom-0 top-auto w-full max-h-[90vh] rounded-t-[32px] rounded-b-none border-t border-border/80 border-x-0 border-b-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-300 ease-out",
            // Desktop / Tablet (sm): Floating centered luxury dialog
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[94vw] sm:max-w-[490px] sm:max-h-[88vh] sm:rounded-3xl sm:border sm:border-border/80",
            "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-top-[48%] sm:data-[state=closed]:slide-out-to-top-[48%]"
          )}
        >
          {/* Mobile Sheet Grab Indicator (Drag handle pill) */}
          <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 active:bg-muted-foreground/50 transition-colors" />
          </div>

          {/* Luxury Gradient Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-orange-500 to-amber-500 shrink-0" />

          {/* Refined Glassmorphic Header */}
          <div className="relative px-5 py-3.5 sm:py-4 bg-gradient-to-b from-muted/50 via-background to-background border-b border-border/60 shrink-0 overflow-hidden">
            {/* Ambient Radial Glow */}
            <div className="absolute -top-12 -left-6 w-36 h-36 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-500 to-amber-500 p-[1.5px] shadow-lg shadow-sky-500/25 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-card/90 backdrop-blur-xs flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Scan className="h-5 w-5" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground leading-tight">
                      Visual Search
                    </DialogTitle>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-gradient-to-r from-sky-500/15 to-amber-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 uppercase shadow-xs">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                      AI LENS
                    </span>
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-muted-foreground font-medium leading-tight mt-0.5">
                    Snap or upload a photo to find matching products instantly
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-border/40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Body with native momentum scrolling and safe-area padding */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 max-h-[calc(90vh-76px)] sm:max-h-[calc(88vh-80px)] pb-6 sm:pb-5">
            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            />

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-destructive/70 hover:text-destructive cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Live Camera Stream Mode (Pro Viewfinder) */}
            {showCameraStream && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-video border-2 border-orange-500/80 shadow-2xl ring-4 ring-orange-500/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Corner HUD Brackets */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-orange-400 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-orange-400 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-orange-400 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-orange-400 rounded-br-sm pointer-events-none" />

                  {/* Laser Scanning Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_15px_#f97316] animate-laser-scan pointer-events-none" />

                  {/* Center Crosshair Target */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full border border-white/25 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500/80 animate-ping" />
                    </div>
                  </div>

                  {/* Live Camera Status Badge */}
                  <div className="absolute top-3 left-8 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] font-extrabold text-white flex items-center gap-1.5 border border-white/10 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    LIVE CAMERA
                  </div>

                  {/* Flip Camera Button */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-3 right-8 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-md transition-all hover:scale-110 active:rotate-180 cursor-pointer"
                    title="Switch Camera"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Camera Actions */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCameraStream}
                    className="h-10 rounded-xl font-bold border-border text-xs px-4 cursor-pointer hover:bg-muted"
                  >
                    Cancel
                  </Button>

                  {/* Center Shutter Button */}
                  <button
                    type="button"
                    onClick={capturePhotoFromStream}
                    className="w-14 h-14 rounded-full border-4 border-white/90 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-90 transition-all flex items-center justify-center cursor-pointer text-white"
                    title="Capture Photo"
                  >
                    <Camera className="h-6 w-6" />
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 rounded-xl font-bold border-border text-xs px-4 cursor-pointer hover:bg-muted"
                  >
                    Upload File
                  </Button>
                </div>
              </div>
            )}

            {/* Doraemon Full Cinematic MP4 Video Search Experience */}
            {analyzing && (
              <div className="py-2 px-1 text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
                {/* Studio Video Player Container */}
                <div 
                  onClick={() => {
                    setAnalyzing(false);
                    onOpenChange(false);
                    navigate("/products?visualSearch=true");
                  }}
                  className="relative mx-auto w-full max-w-[260px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-sky-400 shadow-2xl shadow-sky-500/25 bg-black ring-4 ring-sky-500/10 cursor-pointer group"
                  title="Click to view matching products immediately"
                >
                  {/* Doraemon Searching His Pocket Video Element */}
                  <video
                    ref={doraemonVideoRef}
                    src="/doraemon_searching_pocket.mp4"
                    autoPlay
                    loop
                    playsInline
                    muted
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />

                  {/* Target User Product Badge In Corner of Video */}
                  {selectedFilePreview && (
                    <div className="absolute bottom-2.5 right-2.5 z-30 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-black/90 shadow-2xl border-2 border-orange-500 ring-2 ring-white/30 backdrop-blur-md animate-in fade-in duration-300">
                      <img
                        src={selectedFilePreview}
                        alt="Target Item"
                        className="w-full h-full object-cover"
                      />
                      {videoProgress >= 85 ? (
                        <div className="absolute inset-x-0 bottom-0 bg-emerald-600 text-[8px] font-black text-white text-center py-0.5 flex items-center justify-center gap-0.5">
                          <Check className="h-2.5 w-2.5" /> Matched!
                        </div>
                      ) : (
                        <>
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-laser-scan pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/85 text-[8px] font-black text-orange-400 uppercase tracking-wider text-center py-0.5">
                            Scanning
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Minimal Clean Video Progress Bar */}
                <div className="w-full max-w-[340px] mx-auto h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-border/60">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300 shadow-sm",
                      videoProgress < 40 && "bg-sky-500",
                      videoProgress >= 40 && videoProgress < 75 && "bg-gradient-to-r from-sky-500 to-amber-500",
                      videoProgress >= 75 && "bg-gradient-to-r from-sky-500 via-amber-500 to-emerald-500"
                    )}
                    style={{ width: `${Math.max(8, videoProgress)}%` }}
                  />
                </div>

              </div>
            )}

            {/* Initial State: Unified Studio Dropzone + Quick Samples + URL Bar */}
            {!analyzing && !showCameraStream && (
              <div className="space-y-3.5">
                {/* Ultra-Premium AI Lens Hero Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      onSelectFile(e.dataTransfer.files[0]);
                    } else {
                      const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
                      if (uri && (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:image/"))) {
                        handleImageUrlDrop(uri);
                      }
                    }
                  }}
                  className={cn(
                    "relative group rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer p-4 sm:p-5 text-center overflow-hidden flex flex-col items-center justify-center border",
                    isDragging
                      ? "border-orange-500 bg-orange-500/10 scale-[1.01] shadow-xl shadow-orange-500/15"
                      : "border-border/80 bg-gradient-to-b from-muted/30 via-background to-muted/20 hover:border-orange-500/50 shadow-sm hover:shadow-md"
                  )}
                >
                  {/* Subtle Ambient Radial Flare */}
                  <div className="absolute inset-0 bg-radial from-orange-500/10 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Modern AI Camera Aperture Icon */}
                  <div className="relative mb-2.5 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-500/20 via-amber-500/15 to-sky-500/10 border border-orange-500/30 flex items-center justify-center shadow-md shadow-orange-500/10">
                      <Camera className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-xs">
                      <Sparkles className="h-2.5 w-2.5" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                    <span className="sm:hidden">Take a photo or upload an image</span>
                    <span className="hidden sm:inline">Drag and drop product image here</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 max-w-[320px]">
                    <span className="sm:hidden">Use your camera or select a photo from your gallery</span>
                    <span className="hidden sm:inline">or choose an option below to browse files</span>
                  </p>

                  {/* Prominent Mobile-First Touch Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mt-3.5 w-full max-w-[320px]">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startCamera();
                      }}
                      className="h-10 sm:h-9.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Take Photo</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="h-10 sm:h-9.5 rounded-xl text-xs sm:text-sm font-bold border-border/80 bg-background hover:bg-muted/80 text-foreground shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ImageIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>Upload Photo</span>
                    </Button>
                  </div>

                  {/* Formats Info */}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground font-medium">
                    <span>JPG</span> • <span>PNG</span> • <span>WEBP</span> • 
                    <span className="bg-muted/80 border border-border/60 px-1.5 py-0.5 rounded text-[9px] font-semibold text-muted-foreground">
                      Max 15MB
                    </span>
                  </div>
                </div>

                {/* Paste URL or Clipboard Bar */}
                <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/70 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-foreground px-0.5">
                    <span className="flex items-center gap-1.5 text-foreground/85">
                      <Link2 className="h-3.5 w-3.5 text-sky-500" />
                      Paste image URL or clipboard
                    </span>
                    <span className="hidden sm:inline-block text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                      Ctrl+V / ⌘V
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <Input
                      type="text"
                      placeholder="Paste image link or click Paste..."
                      value={combinedTextQuery}
                      onChange={(e) => setCombinedTextQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleInputSubmit();
                        }
                      }}
                      onPaste={handlePasteInput}
                      className="h-8.5 text-xs rounded-xl pr-20 pl-3 bg-background border-border/80 focus-visible:ring-orange-500/40 shadow-xs"
                    />
                    <div className="absolute right-1 flex items-center gap-1">
                      {combinedTextQuery && (
                        <button
                          type="button"
                          onClick={() => setCombinedTextQuery("")}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
                          title="Clear"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={combinedTextQuery ? handleInputSubmit : handleClipboardButton}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[10px] border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                        title={combinedTextQuery ? "Search URL" : "Paste from clipboard"}
                      >
                        {clipboardFeedback ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>Pasted</span>
                          </>
                        ) : combinedTextQuery ? (
                          <>
                            <span>Search</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-3 w-3" />
                            <span>Paste</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center font-medium bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
