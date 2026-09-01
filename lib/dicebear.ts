// Shared DiceBear wiring for the Sprite avatar system. Used by the real
// "Design your Sprite" customizer, the SpriteAvatar render component, the
// /api/sprite/customize validation, and the /dev/sprite-lab prototype — one
// place owns the style registry and option-building so they can't drift.

import { Avatar, Style } from "@dicebear/core";

import adventurerJson from "@dicebear/styles/adventurer.json";
import notionistsJson from "@dicebear/styles/notionists.json";
import botttsJson from "@dicebear/styles/bottts.json";
import bigSmileJson from "@dicebear/styles/big-smile.json";
import croodlesJson from "@dicebear/styles/croodles.json";
import funEmojiJson from "@dicebear/styles/fun-emoji.json";
import pixelArtJson from "@dicebear/styles/pixel-art.json";
import micahJson from "@dicebear/styles/micah.json";

export type SpriteStyleDef = { key: string; label: string; json: unknown };

export const SPRITE_STYLES: SpriteStyleDef[] = [
  { key: "adventurer", label: "Adventurer", json: adventurerJson },
  { key: "notionists", label: "Notionists", json: notionistsJson },
  { key: "bottts", label: "Bottts (robot)", json: botttsJson },
  { key: "big-smile", label: "Big Smile", json: bigSmileJson },
  { key: "croodles", label: "Croodles", json: croodlesJson },
  { key: "fun-emoji", label: "Fun Emoji", json: funEmojiJson },
  { key: "pixel-art", label: "Pixel Art", json: pixelArtJson },
  { key: "micah", label: "Micah", json: micahJson },
];

export const DEFAULT_SPRITE_STYLE = SPRITE_STYLES[0].key;

export function isSpriteStyleKey(key: unknown): key is string {
  return typeof key === "string" && SPRITE_STYLES.some((s) => s.key === key);
}

export function getSpriteStyleDef(key: string): SpriteStyleDef | undefined {
  return SPRITE_STYLES.find((s) => s.key === key);
}

export function getSpriteStyle(key: string): Style<unknown> | null {
  const def = getSpriteStyleDef(key);
  return def ? new Style(def.json) : null;
}

export type TraitSelections = Record<string, string | null>;
export type ColorSelections = Record<string, string>;

// Deterministic, fully-specified defaults for a style: first variant for
// every component, first value for every color. Never leaves a trait to
// DiceBear's own randomization, so the same style always opens the same way.
export function defaultSelections(style: Style<unknown>): { variants: TraitSelections; colors: ColorSelections } {
  const variants: TraitSelections = {};
  for (const [name, comp] of style.components()) {
    variants[name] = [...comp.variants().keys()][0] ?? null;
  }
  const colors: ColorSelections = {};
  for (const [name, color] of style.colors()) {
    const vals = color.values();
    if (vals.length) colors[name] = vals[0];
  }
  return { variants, colors };
}

export function buildAvatarOptions(
  style: Style<unknown>,
  seed: string,
  variants: TraitSelections,
  colors: ColorSelections,
  size: number,
  overrideName?: string,
  overrideVariant?: string | null,
): Record<string, unknown> {
  const options: Record<string, unknown> = { seed, size };
  for (const name of style.components().keys()) {
    const v = name === overrideName ? overrideVariant : (variants[name] ?? undefined);
    if (v === null) {
      options[`${name}Probability`] = 0;
    } else if (v) {
      options[`${name}Variant`] = v;
      options[`${name}Probability`] = 100;
    }
  }
  for (const [name, val] of Object.entries(colors)) {
    if (val) options[`${name}Color`] = val;
  }
  return options;
}

export function renderAvatarDataUri(
  style: Style<unknown>,
  seed: string,
  variants: TraitSelections,
  colors: ColorSelections,
  size = 128,
  overrideName?: string,
  overrideVariant?: string | null,
): string {
  const options = buildAvatarOptions(style, seed, variants, colors, size, overrideName, overrideVariant);
  return new Avatar(style, options).toDataUri();
}

// Colors with only one possible value aren't a real choice — most DiceBear
// style color slots (eyes, teeth, ink, ...) are fixed. Hide those.
export function meaningfulColorEntries(style: Style<unknown>) {
  return [...style.colors().entries()].filter(([, c]) => c.values().length > 1);
}

const COLOR_PRIORITY = ["skin", "skinColor", "hair", "hairColor"];
function colorPriority(name: string) {
  const i = COLOR_PRIORITY.indexOf(name);
  return i === -1 ? COLOR_PRIORITY.length : i;
}

export function sortedMeaningfulColorEntries(style: Style<unknown>) {
  return meaningfulColorEntries(style).sort(
    ([a], [b]) => colorPriority(a) - colorPriority(b) || a.localeCompare(b),
  );
}

export function prettifyTraitName(name: string) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function colorLabel(name: string) {
  if (/^skin/i.test(name)) return "Skin tone";
  if (/^hair/i.test(name)) return "Hair color";
  return `${prettifyTraitName(name)} color`;
}
