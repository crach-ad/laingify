"use client";
import { useRef, useState } from "react";
export type AssemblyVisualProps = { text?: string; materials?: string[]; urls: string[]; sourcePages?: number[]; sourceUrl?: string };
// Assembly diagrams never auto-advance: the builder controls their pace.
export default function AssemblyStep({ text, materials = [], urls, sourcePages = [], sourceUrl }: AssemblyVisualProps) {
  const [index,setIndex] = useState(0);
  const [zoom,setZoom] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = Math.min(index,Math.max(0,urls.length-1));
  const page = sourcePages[current];
  const label = `Assembly diagram ${current+1} of ${urls.length}${page ? `, manual page ${page}` : ""}`;
  function open() { setZoom(false); dialog.current?.showModal(); }
  const navigation = <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
    <button type="button" className="btn-ghost h-10 px-4 text-sm" disabled={current===0} onClick={() => setIndex(current-1)} aria-label="Previous diagram">← Previous</button>
    <span className="muted text-xs" aria-live="polite">Diagram {current+1}/{urls.length}{page ? ` · Manual p. ${page}` : ""}</span>
    <button type="button" className="btn-ghost h-10 px-4 text-sm" disabled={current===urls.length-1} onClick={() => setIndex(current+1)} aria-label="Next diagram">Next →</button>
  </div>;
  return <div>
    {text && <p className="mb-5 whitespace-pre-wrap leading-relaxed" style={{color:"var(--body)"}}>{text}</p>}
    {materials.length>0 && <section className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--tile)] p-4" aria-label="Parts for this step"><h3 className="mono-label mb-3">What you need</h3><ul className="grid gap-2 text-sm sm:grid-cols-2">{materials.map((item,i) => <li key={i} className="flex gap-2"><span aria-hidden="true" style={{color:"var(--accent)"}}>•</span>{item}</li>)}</ul></section>}
    {urls.length>0 && <figure>
      <button type="button" className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 focus-visible:outline-2 focus-visible:outline-[var(--accent)]" onClick={open} aria-label={`Enlarge ${label.toLowerCase()}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- exact source diagram */}
        <img src={urls[current]} alt={label} className="mx-auto max-h-[620px] w-full object-contain" />
        <span className="block py-2 text-center text-xs font-medium text-slate-600">Tap to enlarge and inspect the hardware ↗</span>
      </button>
      {urls.length>1 && navigation}
      {sourceUrl && <figcaption className="muted mt-3 text-xs">Adeept PiCar-Pro assembly guide · <a href={`${sourceUrl}#page=${page ?? 1}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">Open original{page ? ` page ${page}` : " manual"}</a></figcaption>}
    </figure>}
    <dialog ref={dialog} className="m-auto h-[94vh] w-[96vw] max-w-6xl rounded-xl border border-slate-300 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/70" onClose={() => setZoom(false)} aria-label="Enlarged assembly diagram">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3"><span className="text-sm">{label}</span><div className="flex gap-2"><button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => setZoom(!zoom)}>{zoom ? "Fit diagram" : "Zoom in"}</button><button type="button" autoFocus className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => dialog.current?.close()}>Close</button></div></div>
      <div className="h-[calc(94vh-76px)] overflow-auto bg-slate-100 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- preserve the source diagram at inspection size */}
        <img src={urls[current]} alt={label} style={{ width:zoom?"180%":"100%",maxWidth:"none",minWidth:zoom?1100:undefined }} />
      </div>
    </dialog>
  </div>;
}
