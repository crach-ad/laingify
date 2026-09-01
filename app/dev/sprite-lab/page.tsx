"use client";

// Local-only prototype (not linked from anywhere) for evaluating DiceBear as
// a replacement for the current 12-emoji Sprite avatar. Kept after the real
// customizer shipped as a scratch space for trying new styles/traits —
// shares lib/dicebear.ts with the real thing so nothing drifts.

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@dicebear/core";
import {
  SPRITE_STYLES,
  getSpriteStyle,
  defaultSelections,
  buildAvatarOptions,
  sortedMeaningfulColorEntries,
  prettifyTraitName,
  colorLabel,
  type TraitSelections,
  type ColorSelections,
} from "@/lib/dicebear";

export default function SpriteLabPage() {
  const [styleKey, setStyleKey] = useState(SPRITE_STYLES[0].key);
  const style = useMemo(() => getSpriteStyle(styleKey)!, [styleKey]);

  const componentNames = useMemo(() => [...style.components().keys()], [style]);
  const meaningfulColors = useMemo(() => sortedMeaningfulColorEntries(style), [style]);

  const [seed, setSeed] = useState("laingify-sprite");
  const [variants, setVariants] = useState<TraitSelections>({});
  const [colors, setColors] = useState<ColorSelections>({});
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Re-derive deterministic defaults whenever the style changes.
  useEffect(() => {
    const defaults = defaultSelections(style);
    setVariants(defaults.variants);
    setColors(defaults.colors);
    setActiveComponent(componentNames[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  const mainDataUri = useMemo(() => {
    const options = buildAvatarOptions(style, seed, variants, colors, 320);
    return new Avatar(style, options).toDataUri();
  }, [style, seed, variants, colors]);

  const activeComp = activeComponent ? style.components().get(activeComponent) : undefined;
  const activeVariantNames = activeComp ? [...activeComp.variants().keys()] : [];
  const activeIsOptional = activeComp ? activeComp.probability() < 100 : false;
  const inlineColor = activeComponent
    ? meaningfulColors.find(([name]) => name === activeComponent)
    : undefined;
  const otherColors = meaningfulColors.filter(([name]) => name !== inlineColor?.[0]);

  function pickVariant(name: string, variant: string | null) {
    setVariants((v) => ({ ...v, [name]: variant }));
  }

  function pickColor(name: string, value: string) {
    setColors((c) => ({ ...c, [name]: value }));
  }

  function randomize() {
    const nextVariants: TraitSelections = {};
    for (const [name, comp] of style.components()) {
      const opts = [...comp.variants().keys()];
      const chance = comp.probability();
      if (chance < 100 && Math.random() * 100 > chance) {
        nextVariants[name] = null;
      } else {
        nextVariants[name] = opts[Math.floor(Math.random() * opts.length)] ?? null;
      }
    }
    const nextColors: ColorSelections = {};
    for (const [name, color] of style.colors()) {
      const vals = color.values();
      if (vals.length) nextColors[name] = vals[Math.floor(Math.random() * vals.length)];
    }
    setVariants(nextVariants);
    setColors(nextColors);
    setSeed(Math.random().toString(36).slice(2, 10));
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="overline mb-1.5">Prototype — not linked, not saved</div>
      <h1 className="text-3xl font-semibold tracking-tight">Sprite Lab</h1>
      <p className="muted mt-1.5 max-w-2xl text-sm">
        Scratch space for trying DiceBear styles/traits. The real customizer (the &quot;Design your
        Sprite&quot; modal in the app) uses the same lib/dicebear.ts helpers as this page.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SPRITE_STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStyleKey(s.key)}
            className={s.key === styleKey ? "btn-primary px-4 py-2 text-sm" : "btn-ghost px-4 py-2 text-sm"}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="card flex h-64 w-64 items-center justify-center overflow-hidden rounded-[18px]"
            style={{ background: "#0f1712" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainDataUri} alt="Sprite preview" className="h-full w-full object-contain" />
          </div>
          <button onClick={randomize} className="btn-primary w-full px-4 py-2.5 text-sm">
            🎲 Surprise me
          </button>
          <p className="mono-label text-center text-[10px]">seed: {seed}</p>
        </div>

        {/* Trait pickers */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="mono-label mb-2">Trait</p>
            <div className="flex flex-wrap gap-2">
              {componentNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveComponent(name)}
                  className={`tile px-3 py-1.5 text-xs ${
                    name === activeComponent ? "border-[var(--accent-border)]" : ""
                  }`}
                  style={name === activeComponent ? { background: "var(--accent-soft)" } : undefined}
                >
                  {prettifyTraitName(name)}
                </button>
              ))}
            </div>
          </div>

          {activeComp && (
            <div>
              <p className="mono-label mb-2">
                {prettifyTraitName(activeComponent!)} — {activeVariantNames.length} option
                {activeVariantNames.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeIsOptional && (
                  <button
                    onClick={() => pickVariant(activeComponent!, null)}
                    className={`tile flex h-16 w-16 items-center justify-center text-[10px] ${
                      variants[activeComponent!] === null ? "border-[var(--accent-border)]" : ""
                    }`}
                    style={variants[activeComponent!] === null ? { background: "var(--accent-soft)" } : undefined}
                  >
                    None
                  </button>
                )}
                {activeVariantNames.map((variantName) => {
                  const thumbUri = new Avatar(
                    style,
                    buildAvatarOptions(style, seed, variants, colors, 96, activeComponent!, variantName),
                  ).toDataUri();
                  const selected = variants[activeComponent!] === variantName;
                  return (
                    <button
                      key={variantName}
                      onClick={() => pickVariant(activeComponent!, variantName)}
                      title={variantName}
                      className={`tile flex h-16 w-16 items-center justify-center overflow-hidden ${
                        selected ? "border-[var(--accent-border)]" : ""
                      }`}
                      style={selected ? { background: "var(--accent-soft)" } : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUri} alt={variantName} className="h-full w-full object-contain" />
                    </button>
                  );
                })}
              </div>

              {inlineColor && (
                <div className="mt-4">
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
            <div>
              <p className="mono-label mb-2">Colors</p>
              <div className="flex flex-col gap-3">
                {otherColors.map(([name, color]) => (
                  <div key={name}>
                    <p className="muted mb-1.5 text-xs">{colorLabel(name)}</p>
                    <div className="flex flex-wrap gap-2">
                      {color.values().map((hex) => (
                        <button
                          key={hex}
                          onClick={() => pickColor(name, hex)}
                          title={hex}
                          style={{
                            background: hex.startsWith("#") ? hex : `#${hex}`,
                            outline: colors[name] === hex ? "2px solid var(--accent)" : undefined,
                            outlineOffset: 2,
                          }}
                          className="h-8 w-8 rounded-full transition-transform hover:scale-105"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <details className="mt-8">
        <summary className="mono-label cursor-pointer">Raw trait selection</summary>
        <pre className="card mt-2 overflow-x-auto p-4 text-xs">
          {JSON.stringify({ style: styleKey, seed, variants, colors }, null, 2)}
        </pre>
      </details>
    </main>
  );
}
