"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Avatar } from "@dicebear/core";
import {
  SPRITE_STYLES,
  DEFAULT_SPRITE_STYLE,
  getSpriteStyle,
  defaultSelections,
  buildAvatarOptions,
  sortedMeaningfulColorEntries,
  prettifyTraitName,
  colorLabel,
  type TraitSelections,
  type ColorSelections,
} from "@/lib/dicebear";
import SpriteAvatar, { type SpriteVisual } from "./SpriteAvatar";

const ACCENT_COLORS = ["#b6f24d", "#6ea8ff", "#22c55e", "#f97316", "#ec4899", "#eab308"];
const PERSONALITIES = ["friendly", "playful", "calm", "curious", "encouraging"];

type Sprite = SpriteVisual & { name: string; color: string; personality: string };

function parseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Learners name and design their Sprite; it persists across every class (PRD §8).
export default function SpriteCustomizer({ sprite }: { sprite: Sprite }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(sprite.name);
  const [personality, setPersonality] = useState(sprite.personality);
  const [accentColor, setAccentColor] = useState(sprite.color);
  const [styleKey, setStyleKey] = useState(sprite.avatarStyle ?? DEFAULT_SPRITE_STYLE);
  const [seed, setSeed] = useState(sprite.avatarSeed ?? sprite.name ?? "sprite");
  const [variants, setVariants] = useState<TraitSelections>(() =>
    sprite.avatarStyle
      ? parseJson(sprite.avatarTraits, {})
      : defaultSelections(getSpriteStyle(DEFAULT_SPRITE_STYLE)!).variants,
  );
  const [colors, setColors] = useState<ColorSelections>(() =>
    sprite.avatarStyle
      ? parseJson(sprite.avatarColors, {})
      : defaultSelections(getSpriteStyle(DEFAULT_SPRITE_STYLE)!).colors,
  );
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const style = useMemo(() => getSpriteStyle(styleKey)!, [styleKey]);
  const componentNames = useMemo(() => [...style.components().keys()], [style]);
  const meaningfulColors = useMemo(() => sortedMeaningfulColorEntries(style), [style]);

  function openModal() {
    setName(sprite.name);
    setPersonality(sprite.personality);
    setAccentColor(sprite.color);
    const initialStyleKey = sprite.avatarStyle ?? DEFAULT_SPRITE_STYLE;
    setStyleKey(initialStyleKey);
    setSeed(sprite.avatarSeed ?? sprite.name ?? "sprite");
    if (sprite.avatarStyle) {
      setVariants(parseJson(sprite.avatarTraits, {}));
      setColors(parseJson(sprite.avatarColors, {}));
    } else {
      const defaults = defaultSelections(getSpriteStyle(initialStyleKey)!);
      setVariants(defaults.variants);
      setColors(defaults.colors);
    }
    setActiveComponent(null);
    setError(null);
    setOpen(true);
  }

  function switchStyle(nextKey: string) {
    setStyleKey(nextKey);
    const defaults = defaultSelections(getSpriteStyle(nextKey)!);
    setVariants(defaults.variants);
    setColors(defaults.colors);
    setActiveComponent(null);
  }

  function pickVariant(componentName: string, variant: string | null) {
    setVariants((v) => ({ ...v, [componentName]: variant }));
  }

  function pickColor(colorName: string, value: string) {
    setColors((c) => ({ ...c, [colorName]: value }));
  }

  const mainDataUri = useMemo(() => {
    const options = buildAvatarOptions(style, seed, variants, colors, 200);
    return new Avatar(style, options).toDataUri();
  }, [style, seed, variants, colors]);

  const activeComp = activeComponent ? style.components().get(activeComponent) : undefined;
  const activeVariantNames = activeComp ? [...activeComp.variants().keys()] : [];
  const activeIsOptional = activeComp ? activeComp.probability() < 100 : false;
  const inlineColor = activeComponent
    ? meaningfulColors.find(([colorName]) => colorName === activeComponent)
    : undefined;
  const otherColors = meaningfulColors.filter(([colorName]) => colorName !== inlineColor?.[0]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sprite/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          personality,
          color: accentColor,
          avatar: sprite.avatar,
          avatarStyle: styleKey,
          avatarSeed: seed,
          avatarTraits: variants,
          avatarColors: colors,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not save your Sprite. Please try again.");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your Sprite. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card card-interactive flex w-full items-center gap-6 rounded-[18px] px-6 py-5">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border text-3xl"
          style={{ background: "#0f1712", borderColor: "var(--accent-border)" }}
        >
          <SpriteAvatar sprite={sprite} size={56} className="object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2.5">
            <span className="display text-lg font-semibold">{sprite.name}</span>
            <span
              className="rounded-md border px-2 py-0.5 text-[10px]"
              style={{
                fontFamily: "var(--font-jetbrains)",
                letterSpacing: "0.04em",
                color: "var(--accent)",
                background: "var(--accent-soft)",
                borderColor: "rgba(182,242,77,0.2)",
              }}
            >
              YOUR SPRITE
            </span>
          </span>
          <span className="muted mt-1.5 block text-sm">
            Give your companion a new look, voice, and color.
          </span>
        </span>
        <button onClick={openModal} className="btn-primary shrink-0 px-4.5 py-2.5 text-sm">
          Customize
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="card animate-fade-up flex w-full max-w-4xl flex-col rounded-[18px] p-6"
              style={{ maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="shrink-0 text-xl font-semibold">Design your Sprite</h2>

              <div className="mt-5 overflow-y-auto pr-1">
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border"
                    style={{ background: "#0f1712", borderColor: accentColor }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mainDataUri} alt="Sprite preview" className="h-full w-full object-contain" />
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    placeholder="Name your Sprite"
                    className="field flex-1 px-4 py-2.5 text-lg"
                  />
                </div>

                <p className="mono-label mt-6">Style</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SPRITE_STYLES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => switchStyle(s.key)}
                      className={s.key === styleKey ? "btn-primary px-3.5 py-1.5 text-sm" : "btn-ghost px-3.5 py-1.5 text-sm"}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className="mono-label mt-6">Trait</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {componentNames.map((n) => (
                    <button
                      key={n}
                      onClick={() => setActiveComponent(n)}
                      className="tile px-3 py-1.5 text-xs"
                      style={
                        n === activeComponent
                          ? { borderColor: "var(--accent-border)", background: "var(--accent-soft)" }
                          : undefined
                      }
                    >
                      {prettifyTraitName(n)}
                    </button>
                  ))}
                </div>

                {activeComp && (
                  <div className="mt-4">
                    <p className="muted mb-2 text-xs">
                      {prettifyTraitName(activeComponent!)} — {activeVariantNames.length} option
                      {activeVariantNames.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeIsOptional && (
                        <button
                          onClick={() => pickVariant(activeComponent!, null)}
                          className="tile flex h-14 w-14 items-center justify-center text-[10px]"
                          style={
                            variants[activeComponent!] === null
                              ? { borderColor: "var(--accent-border)", background: "var(--accent-soft)" }
                              : undefined
                          }
                        >
                          None
                        </button>
                      )}
                      {activeVariantNames.map((variantName) => {
                        const thumbUri = new Avatar(
                          style,
                          buildAvatarOptions(style, seed, variants, colors, 80, activeComponent!, variantName),
                        ).toDataUri();
                        const selected = variants[activeComponent!] === variantName;
                        return (
                          <button
                            key={variantName}
                            onClick={() => pickVariant(activeComponent!, variantName)}
                            title={variantName}
                            className="tile flex h-14 w-14 items-center justify-center overflow-hidden"
                            style={
                              selected
                                ? { borderColor: "var(--accent-border)", background: "var(--accent-soft)" }
                                : undefined
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbUri} alt={variantName} className="h-full w-full object-contain" />
                          </button>
                        );
                      })}
                    </div>

                    {inlineColor && (
                      <div className="mt-3">
                        <p className="muted mb-1.5 text-xs">{colorLabel(inlineColor[0])}</p>
                        <div className="flex flex-wrap gap-2">
                          {inlineColor[1].values().map((hex) => (
                            <button
                              key={hex}
                              onClick={() => pickColor(inlineColor[0], hex)}
                              title={hex}
                              style={{
                                background: hex.startsWith("#") ? hex : `#${hex}`,
                                outline: colors[inlineColor[0]] === hex ? "2px solid var(--accent)" : undefined,
                                outlineOffset: 2,
                              }}
                              className="h-8 w-8 rounded-full transition-transform hover:scale-105"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {otherColors.length > 0 && (
                  <>
                    <p className="mono-label mt-6">Colors</p>
                    <div className="mt-2 flex flex-col gap-3">
                      {otherColors.map(([colorName, colorDef]) => (
                        <div key={colorName}>
                          <p className="muted mb-1.5 text-xs">{colorLabel(colorName)}</p>
                          <div className="flex flex-wrap gap-2">
                            {colorDef.values().map((hex) => (
                              <button
                                key={hex}
                                onClick={() => pickColor(colorName, hex)}
                                title={hex}
                                style={{
                                  background: hex.startsWith("#") ? hex : `#${hex}`,
                                  outline: colors[colorName] === hex ? "2px solid var(--accent)" : undefined,
                                  outlineOffset: 2,
                                }}
                                className="h-8 w-8 rounded-full transition-transform hover:scale-105"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <p className="mono-label mt-6">Personality</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersonality(p)}
                      className={`rounded-lg px-4 py-2 text-sm capitalize ${
                        personality === p ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <p className="mono-label mt-6">Accent color</p>
                <div className="mt-2 flex gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccentColor(c)}
                      style={{ background: c }}
                      className={`h-9 w-9 rounded-full transition-transform hover:scale-105 ${
                        accentColor === c ? "ring-2 ring-white/80" : ""
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="mt-5 text-sm" style={{ color: "#f87171" }}>
                    {error}
                  </p>
                )}
              </div>

              <div className="mt-6 flex shrink-0 justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="muted rounded-lg px-4 py-2 font-medium transition-colors hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button onClick={save} disabled={busy || !name.trim()} className="btn-primary px-5 py-2 text-sm">
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
