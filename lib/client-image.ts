// Client-side photo shrinking for evidence uploads. Phone cameras produce
// 3–12 MB images; as base64 those blow past the ~4.5 MB serverless request
// cap and would bloat the database. Downscaling to ~1280px JPEG lands around
// 200–400 KB with no visible loss for portfolio purposes.

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function compressImage(file: Blob, maxDim = 1280, quality = 0.82): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Decode failed (exotic format) — fall back to the original bytes and let
    // the server's size guard produce a friendly error if it's too big.
    return readDataUrl(file);
  }
}
