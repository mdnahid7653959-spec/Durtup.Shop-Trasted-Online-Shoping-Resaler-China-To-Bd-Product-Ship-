import { Product } from "@/components/products/ProductCard";

export interface CompareSpecRow {
  key: string;
  label: string;
  category?: string;
  values: Record<string, string | number | boolean | null>;
  isDifferent: boolean;
  highlightDifference?: boolean;
}

export interface CompareSpecGroup {
  id: string;
  title: string;
  icon?: string;
  rows: CompareSpecRow[];
}

export interface ProductComparisonSummary {
  lowestPriceId?: string;
  highestRatedId?: string;
  bestValueId?: string;
  totalProducts: number;
}
