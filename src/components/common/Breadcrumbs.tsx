import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemData {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
  className?: string;
  showHomeIcon?: boolean;
}

/**
 * Enterprise semantic breadcrumbs navigation component.
 * Renders an accessible, responsive breadcrumb trail with full Schema microdata compatibility.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  showHomeIcon = true,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-xs sm:text-sm text-muted-foreground py-2 overflow-x-auto scrollbar-none select-none",
        className
      )}
    >
      <ol className="flex items-center gap-1.5 flex-nowrap shrink-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={`${item.url}-${index}`}
              className="inline-flex items-center gap-1.5 shrink-0"
            >
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
              )}

              {isLast ? (
                <span
                  className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px]"
                  aria-current="page"
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors text-muted-foreground hover:underline"
                >
                  {isFirst && showHomeIcon && <Home className="h-3.5 w-3.5 shrink-0" />}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
