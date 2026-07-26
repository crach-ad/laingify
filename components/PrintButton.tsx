"use client";

// "Download" = the browser's print-to-PDF, which keeps the portfolio fully
// self-contained (images inline as data URLs) with zero server work.
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary h-11 px-5 text-sm">
      ⬇️ Download (PDF)
    </button>
  );
}
