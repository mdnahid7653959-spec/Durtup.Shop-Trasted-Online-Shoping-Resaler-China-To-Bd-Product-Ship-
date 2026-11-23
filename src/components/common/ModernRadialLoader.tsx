import React from "react";
import "./ModernRadialLoader.css";
import { cn } from "@/lib/utils";

export interface ModernRadialLoaderProps {
  /**
   * Size presets or direct pixel value for the radial diameter
   * xs: ~65px, sm: ~90px, md: ~130px, lg: ~180px, xl: ~230px
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  label?: string;
  showBrand?: boolean;
}

export const ModernRadialLoader: React.FC<ModernRadialLoaderProps> = ({
  size = "md",
  className,
  label,
  showBrand = false,
}) => {
  const getFontSize = (): string => {
    if (typeof size === "number") {
      return `${Math.max(4, size / 13)}px`;
    }
    switch (size) {
      case "xs":
        return "5px";
      case "sm":
        return "7px";
      case "md":
        return "10px";
      case "lg":
        return "14px";
      case "xl":
        return "18px";
      default:
        return "10px";
    }
  };

  return (
    <div
      className={cn("modern-radial-loader-wrapper relative", className)}
      style={{ ["--loader-font-size" as any]: getFontSize() }}
    >
      <div className="main">
        <div className="up">
          <div className="loaders">
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
            <div className="loader" />
          </div>
          <div className="loadersB">
            <div className="loaderA">
              <div className="ball0" />
            </div>
            <div className="loaderA">
              <div className="ball1" />
            </div>
            <div className="loaderA">
              <div className="ball2" />
            </div>
            <div className="loaderA">
              <div className="ball3" />
            </div>
            <div className="loaderA">
              <div className="ball4" />
            </div>
            <div className="loaderA">
              <div className="ball5" />
            </div>
            <div className="loaderA">
              <div className="ball6" />
            </div>
            <div className="loaderA">
              <div className="ball7" />
            </div>
            <div className="loaderA">
              <div className="ball8" />
            </div>
          </div>
        </div>
      </div>

      {showBrand && (
        <div className="mt-2 text-center select-none pointer-events-none">
          <span className="text-xs font-black tracking-tight text-orange-500">
            Durtup<span className="text-foreground">.shop</span>
          </span>
        </div>
      )}

      {label && (
        <div className="mt-2 text-center select-none pointer-events-none">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

export default ModernRadialLoader;
