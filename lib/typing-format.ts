// Display helpers shared by the Letter Leaper learner and instructor pages.

export const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export const pct = (x: number | null | undefined, digits = 0) => (x === null || x === undefined ? "—" : `${(x * 100).toFixed(digits)}%`);
export const num = (x: number | null | undefined, digits = 0) => (x === null || x === undefined ? "—" : x.toFixed(digits));
export const minutes = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${(ms / 60_000).toFixed(ms < 600_000 ? 1 : 0)} min`);
export const seconds = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`);
export const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

// Signed change, e.g. "+4.2 pts" / "−1.0 CPM".
export const delta = (x: number | null, unit: string, digits = 1) =>
  x === null ? "—" : `${x > 0 ? "+" : x < 0 ? "−" : "±"}${Math.abs(x).toFixed(digits)} ${unit}`;

// Encodes the game config for the iframe's #cfg= fragment (never sent to servers).
export const encodeCfg = (cfg: object) => Buffer.from(JSON.stringify(cfg)).toString("base64url");
