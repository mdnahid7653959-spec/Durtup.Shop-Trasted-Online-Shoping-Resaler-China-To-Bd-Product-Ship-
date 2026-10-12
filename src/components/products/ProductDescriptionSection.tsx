import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductDescriptionSectionProps {
  description: string;
  isHtml?: boolean;
}

export const ProductDescriptionSection: React.FC<ProductDescriptionSectionProps> = ({
  description,
  isHtml = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Clean unescaped text if needed
  const unescapedDesc = (description || "")
    .replace(/\\x3C/gi, "<")
    .replace(/\\x3E/gi, ">")
    .replace(/\\x22/gi, '"')
    .replace(/\\x27/gi, "'")
    .replace(/\\x2F/gi, "/")
    .replace(/\\x26/gi, "&")
    .replace(/\\x0A/gi, "\n")
    .replace(/\\x0D/gi, "\r")
    .replace(/\\"/g, '"');

  // Check if content is considered long enough to warrant a collapsible toggle
  const isContentLong = unescapedDesc.length > 550 || unescapedDesc.split("\n").length > 9;

  // Extract opening headline / quote hook if available
  let openingHook: string | null = null;
  let remainingPlainDesc = unescapedDesc;

  if (!isHtml) {
    const quoteMatch = unescapedDesc.match(/^\s*["“]([^"”]+)["”]/);
    if (quoteMatch && quoteMatch[1] && quoteMatch[1].length > 10) {
      openingHook = quoteMatch[1].trim();
      remainingPlainDesc = unescapedDesc.replace(/^\s*["“][^"”]+["”]\s*/, "").trim();
    }
  }

  // Format plain text lines with clean typographic styling and no emojis/icons
  const renderFormattedPlainText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check if line is a bullet or highlighted feature
      const isBullet = /^[👉⭐✔✅•\-\*]/.test(trimmed);
      const isHeading = trimmed.endsWith(":") || trimmed.includes("–") || trimmed.includes("ক্যাটাগরি:") || /^(কেন |ব্যবহার |বৈশিষ্ট্য|উপকারিতা)/i.test(trimmed);

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 py-1 group">
            <span className="text-muted-foreground font-bold shrink-0 select-none mt-0.5">•</span>
            <span className="text-foreground/90 font-normal leading-relaxed text-sm sm:text-[15px]">
              {trimmed.replace(/^[👉⭐✔✅•\-\*]\s*/, "")}
            </span>
          </div>
        );
      }

      if (isHeading) {
        return (
          <div key={idx} className="pt-3 pb-1">
            <span className="inline-block font-semibold text-foreground text-sm sm:text-base border-b border-border/70 pb-0.5">
              {trimmed.replace(/^[👉⭐✔✅•\-\*]\s*/, "")}
            </span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-foreground/80 text-sm sm:text-[15px] leading-relaxed font-normal">
          {trimmed.replace(/^[👉⭐✔✅]\s*/, "")}
        </p>
      );
    });
  };

  // Sanitize HTML description by removing redundant emojis and circular warranty/guarantee notes
  const sanitizeHtmlDescription = (rawHtml: string) => {
    return rawHtml
      .replace(/&nbsp;/gi, " ")
      .replace(/width\s*:\s*\d{3,}px/gi, "width: 100%")
      .replace(/min-width\s*:\s*\d{3,}px/gi, "min-width: 0px")
      .replace(/width="[0-9]{3,}"/gi, 'width="100%"')
      // Remove circled warranty / 7-day guarantee lines
      .replace(/<div>\s*<strong>Warranty:<\/strong>\s*7\s*Days[^<]*<\/div>/gi, "")
      .replace(/<div>\s*<strong>Return Policy:<\/strong>\s*7\s*Days[^<]*<\/div>/gi, "")
      // Remove emojis/icons
      .replace(/⭐\s*/g, "")
      .replace(/🚚\s*/g, "")
      .replace(/👉\s*/g, "")
      .replace(/✔\s*/g, "")
      .replace(/✅\s*/g, "");
  };

  return (
    <section 
      aria-label="Product Description"
      className="mt-6 rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs overflow-hidden transition-all duration-200 w-full max-w-full"
    >
      {/* Clean, Professional Header - No Icons, No Clutter */}
      <div className="pb-3.5 mb-4 border-b border-border/60">
        <h3 className="font-semibold text-base sm:text-lg text-foreground tracking-tight">
          Description / পণ্যের বিবরণ
        </h3>
      </div>

      {/* Featured Headline / Hook Card if available */}
      {openingHook && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-lg bg-muted/30 border-l-3 border-foreground/40">
          <p className="text-foreground font-medium text-sm sm:text-base leading-snug">
            "{openingHook}"
          </p>
        </div>
      )}

      {/* Description Content Container */}
      <div 
        className={cn(
          "relative transition-all duration-300 rounded-lg",
          isContentLong && !isExpanded ? "max-h-[420px] overflow-hidden" : "max-h-none"
        )}
      >
        {isHtml ? (
          <div
            className="product-description-content text-foreground/90 text-sm sm:text-[15px] leading-relaxed font-normal prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden w-full
              [&_h1]:text-foreground [&_h1]:font-semibold [&_h1]:text-base [&_h1]:sm:text-lg [&_h1]:mb-2
              [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:sm:text-base [&_h2]:mb-2
              [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mb-1.5
              [&_h4]:text-foreground [&_h4]:font-semibold [&_h4]:text-sm [&_h4]:mb-1.5
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3
              [&_table]:w-full [&_table]:max-w-full [&_table]:table-auto [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto [&_table]:my-3
              [&_td]:border [&_td]:border-border [&_td]:p-2.5 [&_td]:break-words [&_td]:text-xs [&_td]:sm:text-sm
              [&_th]:border [&_th]:border-border [&_th]:p-2.5 [&_th]:break-words [&_th]:bg-muted/40 [&_th]:text-foreground [&_th]:font-semibold [&_th]:text-xs [&_th]:sm:text-sm
              [&_a]:text-primary [&_a]:underline [&_a]:font-medium [&_a]:break-all
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
              [&_p]:break-words [&_p]:max-w-full [&_p]:mb-2.5 [&_div]:max-w-full [&_span]:max-w-full"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlDescription(unescapedDesc),
            }}
          />
        ) : (
          <div className="space-y-1">
            {renderFormattedPlainText(remainingPlainDesc.replace(/&nbsp;/gi, " "))}
          </div>
        )}

        {/* Gradient fade overlay when collapsed */}
        {isContentLong && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/85 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Professional Pure-Text Expand / Collapse Toggle - No Icons */}
      {isContentLong && (
        <div className="mt-4 flex justify-center border-t border-border/40 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full px-6 py-1.5 text-xs sm:text-sm font-medium border-border/80 text-foreground hover:bg-muted transition-all"
          >
            {isExpanded ? "সংক্ষেপে দেখুন (Show Less)" : "সম্পূর্ণ বিবরণ পড়ুন (Read More)"}
          </Button>
        </div>
      )}
    </section>
  );
};
