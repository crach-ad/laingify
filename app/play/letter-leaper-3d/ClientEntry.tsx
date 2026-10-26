"use client";

import dynamic from "next/dynamic";

// The whole preview (WebGL scene + its HTML controls) runs only in the browser.
const Leaper3D = dynamic(() => import("./Leaper3D"), {
  ssr: false,
  loading: () => <p className="muted p-8 text-sm" role="status">Preparing the 3D preview…</p>,
});

export default function ClientEntry() {
  return <Leaper3D />;
}
