"use client";

// Local-only prototype (not linked from anywhere) for evaluating DiceBear as
// a replacement for the current 12-emoji Sprite avatar. Generic over any
// DiceBear style: it introspects the style's own component/color schema
// rather than hardcoding trait names, so switching styles just works.
//
// Delete this route (or leave it — it's unauthenticated and unlinked) once
// we've picked a direction.

import { useEffect, useMemo, useState } from "react";
import { Avatar, Style } from "@dicebear/core";

import adventurerJson from "@dicebear/styles/adventurer.json";
import notionistsJson from "@dicebear/styles/notionists.json";
import botttsJson from "@dicebear/styles/bottts.json";
import bigSmileJson from "@dicebear/styles/big-smile.json";
import croodlesJson from "@dicebear/styles/croodles.json";
import funEmojiJson from "@dicebear/styles/fun-emoji.json";
import pixelArtJson from "@dicebear/styles/pixel-art.json";
import micahJson from "@dicebear/styles/micah.json";

const STYLE_DEFS: { key: string; label: string; json: unknown }[] = [
  { key: "adventurer", label: "Adventurer", json: adventurerJson },
  { key: "notionists", label: "Notionists", json: notionistsJson },
  { key: "bottts", label: "Bottts (robot)", json: botttsJson },
  { key: "big-smile", label: "Big Smile", json: bigSmileJson },
  { key: "croodles", label: "Croodles", json: croodlesJson },
  { key: "fun-emoji", label: "Fun Emoji", json: funEmojiJson },
  { key: "pixel-art", label: "Pixel Art", json: pixelArtJson },
  { key: "micah", label: "Micah", json: micahJson },
];

function prettify(name: string) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Skin tone and hair color are what people actually come looking for —
// surface them first. Everything else (eye color, glasses color, ...) is
// still sorted, just after these.
const COLOR_PRIORITY = ["skin", "skinColor", "hair", "hairColor"];
function colorPriority(name: string) {
  const i = COLOR_PRIORITY.indexOf(name);
  return i === -1 ? COLOR_PRIORITY.length : i;
}
function colorLabel(name: string) {
  if (/^skin/i.test(name)) return "Skin tone";
  if (/^hair/i.test(name)) return "Hair color";
  return `${prettify(name)} color`;
}

type ComponentsMap = ReturnType<Style<unknown>["components"]>;
type ColorsMap = ReturnType<Style<unknown>["colors"]>;

function buildOptions(
  components: ComponentsMap,
  seed: string,
  variants: Record<string, string | null>,
  colors: Record<string, string>,
  overrideName?: string,
  overrideVariant?: string | null,
): Record<string, unknown> {
  const options: Record<string, unknown> = { seed, size: 320 };
  for (const name of components.keys()) {
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

export default function SpriteLabPage() {
  const [styleKey, setStyleKey] = useState(STYLE_DEFS[0].key);
  const styleDef = STYLE_DEFS.find((s) => s.key === styleKey)!;
  const style = useMemo(() => new Style(styleDef.json), [styleDef]);

  const components = useMemo(() => style.components(), [style]);
  const colorDefs = useMemo(() => style.colors(), [style]);
  const componentNames = useMemo(() => [...components.keys()], [components]);

  const [seed, setSeed] = useState("laingify-sprite");
  const [variants, setVariants] = useState<Record<string, string | null>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Re-derive deterministic defaults whenever the style changes — every
  // component starts on its first variant (never a silent random pick), so
  // switching styles always lands on a stable, reproducible look.
  useEffect(() => {
    const nextVariants: Record<string, string | null> = {};
    for (const [name, comp] of components) {
      nextVariants[name] = [...comp.variants().keys()][0] ?? null;
    }
    const nextColors: Record<string, string> = {};
    for (const [name, color] of colorDefs) {
      const vals = color.values();
      if (vals.length) nextColors[name] = vals[0];
    }
    setVariants(nextVariants);
    setColors(nextColors);
    setActiveComponent(componentNames[0] ?? null);
  }, [components, colorDefs, componentNames]);

  const mainOptions = useMemo(
    () => buildOptions(components, seed, variants, colors),
    [components, seed, variants, colors],
  );
  const mainDataUri = useMemo(() => new Avatar(style, mainOptions).toDataUri(), [style, mainOptions]);

  const activeComp = activeComponent ? components.get(activeComponent) : undefined;
  const activeVariantNames = activeComp ? [...activeComp.variants().keys()] : [];
  const activeIsOptional = activeComp ? activeComp.probability() < 100 : false;

  // Colors with only one possible value aren't a real choice (DiceBear still
  // defines a slot for them, e.g. teeth/sclera/ink are usually fixed) — hide
  // those instead of listing ten dead swatches ahead of the two that matter.
  const meaningfulColors = useMemo(
    () =>
      [...colorDefs.entries()]
        .filter(([, c]) => c.values().length > 1)
        .sort(([a], [b]) => colorPriority(a) - colorPriority(b) || a.localeCompare(b)),
    [colorDefs],
  );
  // When the active trait has its own color (hair variant + hair color),
  // show that picker right under the thumbnails instead of making people
  // scroll to a separate "Colors" section to find it.
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
    const nextVariants: Record<string, string | null> = {};
    for (const [name, comp] of components) {
      const opts = [...comp.variants().keys()];
      const chance = comp.probability();
      if (chance < 100 && Math.random() * 100 > chance) {
        nextVariants[name] = null;
      } else {
        nextVariants[name] = opts[Math.floor(Math.random() * opts.length)] ?? null;
      }
    }
    const nextColors: Record<string, string> = {};
    for (const [name, color] of colorDefs) {
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
        Evaluating DiceBear as a more robust replacement for the emoji-picker Sprite. Every trait
        below comes straight from the style&apos;s own schema — nothing is hardcoded per style.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STYLE_DEFS.map((s) => (
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
                  {prettify(name)}
                </button>
              ))}
            </div>
          </div>

          {activeComp && (
            <div>
              <p className="mono-label mb-2">
                {prettify(activeComponent!)} — {activeVariantNames.length} option
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
                  const thumbOptions = buildOptions(
                    components,
                    seed,
                    variants,
                    colors,
                    activeComponent!,
                    variantName,
                  );
                  const thumbUri = new Avatar(style, { ...thumbOptions, size: 96 }).toDataUri();
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
        <summary className="mono-label cursor-pointer">Raw trait selection (what we&apos;d store)</summary>
        <pre className="card mt-2 overflow-x-auto p-4 text-xs">
          {JSON.stringify({ style: styleKey, seed, variants, colors }, null, 2)}
        </pre>
      </details>
    </main>
  );
}
