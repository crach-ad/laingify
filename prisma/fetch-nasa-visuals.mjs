// Fetch-and-cache real NASA imagery for Module 4 (VR & AR) from the NASA
// Image & Video Library (images-api.nasa.gov — free, no API key).
// Images land in public/tutorial/space/ with attribution.json alongside, so
// camp runs fully offline. Safe to re-run; it overwrites in place.
//   node prisma/fetch-nasa-visuals.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "tutorial", "space");

// Curated set: either a direct nasa_id, or a search query whose top hit we take.
const IMAGES = [
  {
    file: "bahamas-from-iss.jpg",
    nasaId: "iss071e449837",
    caption: "The Bahamas, photographed from the International Space Station. Astronauts say it's the most beautiful sight in orbit — find Abaco!",
  },
  {
    file: "perseverance-selfie.jpg",
    nasaId: "PIA24542",
    caption: "A real photo: the Perseverance rover's selfie with the Ingenuity helicopter, taken on Mars. This is the rover you'll find in NASA Eyes.",
  },
  {
    file: "cosmic-cliffs-webb.jpg",
    query: "cosmic cliffs carina nebula webb",
    caption: "The 'Cosmic Cliffs' of the Carina Nebula, captured by the James Webb Space Telescope — baby stars being born, 7,600 light-years away.",
  },
  {
    file: "earthrise.jpg",
    nasaId: "as08-14-2383",
    caption: "'Earthrise' — taken by Apollo 8 astronauts in 1968, the first time humans saw Earth rise over another world.",
  },
];

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function resolve(entry) {
  let nasaId = entry.nasaId;
  let meta = null;
  if (!nasaId) {
    const d = await json(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(entry.query)}&media_type=image`,
    );
    const item = d.collection.items[0];
    if (!item) throw new Error(`No results for query "${entry.query}"`);
    meta = item.data[0];
    nasaId = meta.nasa_id;
  } else {
    const d = await json(
      `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(nasaId)}`,
    );
    meta = d.collection.items[0]?.data?.[0] ?? { title: nasaId };
  }

  // Asset manifest lists every rendition; prefer ~large, fall back to orig.
  const assets = await json(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`);
  const urls = assets.collection.items.map((i) => i.href);
  const pick =
    urls.find((u) => u.endsWith("~large.jpg")) ??
    urls.find((u) => u.endsWith("~medium.jpg")) ??
    urls.find((u) => u.endsWith("~orig.jpg")) ??
    urls.find((u) => u.endsWith(".jpg"));
  if (!pick) throw new Error(`No jpg rendition for ${nasaId}`);
  return { nasaId, title: meta.title, url: pick };
}

await mkdir(OUT_DIR, { recursive: true });
const attribution = [];

for (const entry of IMAGES) {
  const { nasaId, title, url } = await resolve(entry);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${nasaId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT_DIR, entry.file), buf);
  attribution.push({
    file: entry.file,
    nasa_id: nasaId,
    title,
    source: `https://images.nasa.gov/details/${nasaId}`,
    credit: "NASA (public domain)",
    caption: entry.caption,
  });
  console.log(`✓ ${entry.file}  (${Math.round(buf.length / 1024)} KB)  ${title}`);
}

await writeFile(path.join(OUT_DIR, "attribution.json"), JSON.stringify(attribution, null, 2));
console.log(`Done — ${attribution.length} images + attribution.json in public/tutorial/space/`);
