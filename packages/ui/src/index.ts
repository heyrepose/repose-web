import tokens from "./tokens.json";

export { tokens };

/**
 * The Repose palette — exactly these, nothing else.
 * Never introduce purple, blue, or red as an accent.
 */
export const colors = tokens.color;

export type ListingConditionKey =
  | "NEW_WITH_TAGS"
  | "NEW_WITHOUT_TAGS"
  | "VERY_GOOD"
  | "GOOD"
  | "SATISFACTORY";

export interface BadgeStyle {
  /** Background color (hex from the palette). */
  bg: string;
  /** Foreground/text color (hex from the palette). */
  fg: string;
  /** Optional border color (hex from the palette). */
  border?: string;
  /** Human label shown on the badge. */
  label: string;
}

/**
 * Within-palette condition badge mapping (DRAFT — for design sign-off).
 *
 * The original design guide specified non-palette hues (sage green, warm olive,
 * muted brown). Per the locked brand rule, badges are re-mapped onto the strict
 * six-color palette using background/foreground/border combinations to stay
 * visually distinct without introducing new colors.
 */
export const CONDITION_BADGE: Record<ListingConditionKey, BadgeStyle> = {
  NEW_WITH_TAGS: {
    bg: colors.primary,
    fg: colors.surface,
    label: "New with Tags",
  },
  NEW_WITHOUT_TAGS: {
    bg: colors.accentSoft,
    fg: colors.primary,
    label: "New without Tags",
  },
  VERY_GOOD: {
    bg: colors.surface,
    fg: colors.primary,
    border: colors.primary,
    label: "Very Good",
  },
  GOOD: {
    bg: colors.surface,
    fg: colors.muted,
    border: colors.cardBorder,
    label: "Good",
  },
  SATISFACTORY: {
    bg: colors.muted,
    fg: colors.surface,
    label: "Satisfactory",
  },
};

/** CSS custom-property block mirroring ARCHITECTURE.md §8.2, generated from tokens. */
export function cssVariables(): string {
  return [
    `--color-primary: ${colors.primary};`,
    `--color-bg: ${colors.background};`,
    `--color-surface: ${colors.surface};`,
    `--color-text: ${colors.text};`,
    `--color-accent-soft: ${colors.accentSoft};`,
    `--color-muted: ${colors.muted};`,
    `--radius-card: ${tokens.radius.card};`,
    `--radius-pill: ${tokens.radius.pill};`,
  ].join("\n");
}
