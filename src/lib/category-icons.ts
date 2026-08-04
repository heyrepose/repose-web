import type { LucideIcon } from "lucide-react";
import {
  Shirt,
  UserRound,
  Footprints,
  ShoppingBag,
  Watch,
  Sparkles,
  Baby,
} from "lucide-react";

/** UI icons by category slug — no remote banner/icon images required. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  women: UserRound,
  men: Shirt,
  shoes: Footprints,
  bags: ShoppingBag,
  accessories: Watch,
  kids: Baby,
};

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Sparkles;
}
