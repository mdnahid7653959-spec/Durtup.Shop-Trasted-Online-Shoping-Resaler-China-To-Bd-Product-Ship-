import React from "react";
import { Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoraemonSearchAnimationProps {
  previewUrl?: string | null;
  stepText?: string;
  className?: string;
}

export const DoraemonSearchAnimation: React.FC<DoraemonSearchAnimationProps> = ({
  previewUrl,
  stepText = "ডোরেমন আপনার প্রোডাক্ট খুঁজছে...",
  className,
}) => {
  return (
    <div className={cn("relative py-4 px-2 flex flex-col items-center justify-center text-center select-none overflow-hidden", className)}>
      <style>{`
        @keyframes d-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(-1deg); }
        }
        @keyframes d-eyes {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(3px, 2px); }
          50% { transform: translate(-3px, 2px); }
          75% { transform: translate(2px, -1px); }
        }
        @keyframes d-glass {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(-8px, -4px) rotate(-14deg); }
          70% { transform: translate(8px, 4px) rotate(12deg); }
        }
        @keyframes d-beam {
          0%, 100% { opacity: 0.35; transform: scale(0.95); }
          50% { opacity: 0.85; transform: scale(1.1); }
        }
        @keyframes d-scanline {
          0% { top: 0%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes d-bell {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes d-stars {
          0%, 100% { opacity: 0.4; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(180deg); }
        }
      `}</style>

      {/* Ambient Radial Glowing Aura */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/15 via-orange-500/10 to-transparent rounded-3xl blur-xl pointer-events-none" />

      {/* Main Animation Stage */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 my-2">
        {/* Floating Sparkles around Stage */}
        <div 
          className="absolute -top-2 left-6 text-amber-400 text-lg pointer-events-none"
          style={{ animation: "d-stars 2s ease-in-out infinite" }}
        >
          ✨
        </div>
        <div 
          className="absolute -bottom-1 right-8 text-sky-400 text-sm pointer-events-none"
          style={{ animation: "d-stars 2.5s ease-in-out infinite 0.7s" }}
        >
          💫
        </div>
        <div 
          className="absolute top-1/2 -left-3 text-orange-400 text-xs pointer-events-none"
          style={{ animation: "d-stars 1.8s ease-in-out infinite 1.2s" }}
        >
          ✦
        </div>

        {/* --- DORAEMON CHARACTER SVG --- */}
        <div 
          className="relative w-28 h-32 sm:w-32 sm:h-36 drop-shadow-xl shrink-0"
          style={{ animation: "d-float 3s ease-in-out infinite" }}
        >
          <svg
            viewBox="0 0 200 230"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Shading Gradients */}
              <linearGradient id="doraemonBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="doraemonBell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="lensGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0.2)" />
              </linearGradient>
              <radialGradient id="beamGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.8)" />
                <stop offset="60%" stopColor="rgba(14, 165, 233, 0.3)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
              </radialGradient>
            </defs>

            {/* Feet */}
            <ellipse cx="76" cy="208" rx="19" ry="9" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
            <ellipse cx="124" cy="208" rx="19" ry="9" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Main Body */}
            <path
              d="M 62 135 C 50 160 52 195 68 205 C 78 210 88 210 100 210 C 112 210 122 210 132 205 C 148 195 150 160 138 135 Z"
              fill="url(#doraemonBody)"
              stroke="#0369a1"
              strokeWidth="3"
            />

            {/* Left Arm & White Paw */}
            <path d="M 64 140 Q 40 150 36 165" stroke="url(#doraemonBody)" strokeWidth="18" strokeLinecap="round" />
            <circle cx="34" cy="168" r="13" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />

            {/* White Tummy */}
            <ellipse cx="100" cy="168" rx="34" ry="29" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />

            {/* 4D Pocket (四次元ポケット) */}
            <path
              d="M 78 165 C 78 188 122 188 122 165 Z"
              fill="#f8fafc"
              stroke="#64748b"
              strokeWidth="2.5"
            />

            {/* Head (Big Round Blue Sphere) */}
            <circle cx="100" cy="78" r="62" fill="url(#doraemonBody)" stroke="#0369a1" strokeWidth="3" />

            {/* White Face Area */}
            <ellipse cx="100" cy="88" rx="51" ry="43" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Red Collar */}
            <path
              d="M 62 130 Q 100 138 138 130"
              stroke="#ef4444"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Golden Jingle Bell with Animation */}
            <g style={{ transformOrigin: "100px 138px", animation: "d-bell 2s ease-in-out infinite" }}>
              <circle cx="100" cy="140" r="10" fill="url(#doraemonBell)" stroke="#b45309" strokeWidth="2" />
              <line x1="93" y1="138" x2="107" y2="138" stroke="#78350f" strokeWidth="1.5" />
              <circle cx="100" cy="143" r="2.5" fill="#78350f" />
            </g>

            {/* Eyes (Big White Ovals) */}
            <ellipse cx="86" cy="50" rx="14" ry="18" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
            <ellipse cx="114" cy="50" rx="14" ry="18" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />

            {/* Pupils with Looking Animation */}
            <g style={{ animation: "d-eyes 2.5s ease-in-out infinite" }}>
              {/* Left Pupil & Glisten */}
              <ellipse cx="89" cy="52" rx="5.5" ry="7.5" fill="#0f172a" />
              <circle cx="91" cy="49" r="2" fill="#ffffff" />
              {/* Right Pupil & Glisten */}
              <ellipse cx="111" cy="52" rx="5.5" ry="7.5" fill="#0f172a" />
              <circle cx="113" cy="49" r="2" fill="#ffffff" />
            </g>

            {/* Red Nose */}
            <circle cx="100" cy="68" r="9" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            <circle cx="97" cy="65" r="2.5" fill="#ffffff" />

            {/* Philtrum line */}
            <line x1="100" y1="77" x2="100" y2="99" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cute Cheerful Smile */}
            <path
              d="M 68 96 Q 100 126 132 96"
              stroke="#0f172a"
              strokeWidth="2.5"
              fill="#be123c"
              strokeLinecap="round"
            />
            {/* Cute Pink Tongue */}
            <path
              d="M 84 109 Q 100 98 116 109 Q 100 123 84 109 Z"
              fill="#fb7185"
            />

            {/* Whiskers (3 on Left, 3 on Right) */}
            <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
              {/* Left */}
              <line x1="53" y1="76" x2="82" y2="81" />
              <line x1="51" y1="88" x2="81" y2="89" />
              <line x1="54" y1="100" x2="82" y2="97" />
              {/* Right */}
              <line x1="147" y1="76" x2="118" y2="81" />
              <line x1="149" y1="88" x2="119" y2="89" />
              <line x1="146" y1="100" x2="118" y2="97" />
            </g>

            {/* Right Arm Holding Magnifying Glass (Animated) */}
            <g style={{ transformOrigin: "135px 145px", animation: "d-glass 2s ease-in-out infinite" }}>
              {/* Arm */}
              <path d="M 136 140 Q 158 145 168 132" stroke="url(#doraemonBody)" strokeWidth="18" strokeLinecap="round" />
              {/* Round White Paw */}
              <circle cx="168" cy="130" r="13" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Magnifying Glass Handle */}
              <line x1="172" y1="124" x2="192" y2="94" stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="172" y1="124" x2="192" y2="94" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />

              {/* Glass Frame & Lens */}
              <circle cx="200" cy="80" r="23" fill="url(#lensGlass)" stroke="#f59e0b" strokeWidth="4.5" />
              <circle cx="200" cy="80" r="21" stroke="#fbbf24" strokeWidth="1.5" />
              {/* Lens Glint Reflection */}
              <path d="M 188 70 A 16 16 0 0 1 206 66" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

              {/* Holographic Radar Beam radiating from Lens */}
              <ellipse 
                cx="200" 
                cy="80" 
                rx="35" 
                ry="35" 
                fill="url(#beamGrad)" 
                style={{ animation: "d-beam 1.4s ease-in-out infinite" }}
              />
            </g>
          </svg>
        </div>

        {/* --- PRODUCT TARGET SCANNER BADGE --- */}
        <div className="relative flex flex-col items-center">
          {/* Floating High-Tech Inspection Badge */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] bg-slate-950 flex items-center justify-center backdrop-blur-md">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Target Product"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                <Search className="w-8 h-8 text-sky-400 animate-pulse" />
              </div>
            )}

            {/* Glowing Laser Scanline across user's product image */}
            <div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 shadow-[0_0_12px_#38bdf8] pointer-events-none"
              style={{ animation: "d-scanline 1.6s ease-in-out infinite" }}
            />

            {/* Corner Targeting Brackets */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 rounded-br-sm pointer-events-none" />
          </div>

          {/* Holographic Radar Waves connecting Doraemon to the Product */}
          <div className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-[10px] font-bold text-sky-500 dark:text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            AI Scanner
          </div>
        </div>
      </div>

      {/* --- STATUS & MESSAGING --- */}
      <div className="mt-3.5 space-y-1 z-10 max-w-xs">
        {/* Animated Friendly Title */}
        <div className="flex items-center justify-center gap-1.5 text-slate-900 dark:text-slate-100 font-extrabold text-sm sm:text-base tracking-tight">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
          <span>{stepText || "ডোরেমন প্রোডাক্ট খুঁজছে..."}</span>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-muted-foreground font-medium">
          Doraemon is matching your product across Durtup catalog
        </p>

        {/* Shimmering Progress Bar */}
        <div className="pt-2 w-44 mx-auto">
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-sky-400 via-orange-400 to-sky-400 rounded-full animate-durtup-sweep" />
          </div>
        </div>
      </div>
    </div>
  );
};
