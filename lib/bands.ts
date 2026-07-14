// Age band is a first-class config axis (PRD §3). It drives UI density,
// reading level, copy tone, and which auth/consent flows are required.

export type Band = "EARLY" | "YOUTH" | "TEEN" | "ADULT";

export type BandConfig = {
  key: Band;
  label: string;
  ageRange: string;
  // Tailwind base text size for body copy — bigger for younger learners.
  textScale: string;
  // Touch-target sizing for primary buttons.
  touch: string;
  tone: string;
  isMinor: boolean;
};

export const BANDS: Record<Band, BandConfig> = {
  EARLY: {
    key: "EARLY",
    label: "Early",
    ageRange: "≈5–8",
    textScale: "text-xl",
    touch: "min-h-16 text-xl",
    tone: "playful, very simple words",
    isMinor: true,
  },
  YOUTH: {
    key: "YOUTH",
    label: "Youth",
    ageRange: "≈9–12",
    textScale: "text-lg",
    touch: "min-h-14 text-lg",
    tone: "encouraging, plain language",
    isMinor: true,
  },
  TEEN: {
    key: "TEEN",
    label: "Teen",
    ageRange: "≈13–17",
    textScale: "text-base",
    touch: "min-h-12 text-base",
    tone: "respectful, some domain terms",
    isMinor: true,
  },
  ADULT: {
    key: "ADULT",
    label: "Adult",
    ageRange: "18+",
    textScale: "text-base",
    touch: "min-h-11 text-base",
    tone: "concise, professional",
    isMinor: false,
  },
};

export function bandConfig(band: string): BandConfig {
  return BANDS[(band as Band)] ?? BANDS.YOUTH;
}
