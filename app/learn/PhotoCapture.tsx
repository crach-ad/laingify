"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// One-time portfolio photo card, shown until the learner takes a photo or
// opts out (both remembered server-side). Camera preview via getUserMedia
// with a file-upload fallback for devices that block the camera.
export default function PhotoCapture({ learnerName }: { learnerName: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraFailed(true);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext("2d")!;
    // Center-crop to a square, mirrored to match the preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setShot(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }

  function onFile(file: File) {
    setError("");
    const r = new FileReader();
    r.onload = () => setShot(String(r.result));
    r.readAsDataURL(file);
  }

  async function save(payload: { dataUrl?: string; skip?: true }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save. Please try again.");
      }
      stopCamera();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="card animate-fade-up mt-10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="overline mb-2">Finish your profile</div>
          <h2 className="text-lg font-semibold">Take a selfie, {learnerName}!</h2>
          <p className="muted mt-1.5 max-w-md text-sm">
            It goes on your profile and the cover of the portfolio you&apos;ll build this camp.
            (You can skip it — that&apos;s okay too.)
          </p>
        </div>

        {/* Preview / camera area */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border)", background: "var(--tile)" }}
          >
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)", display: cameraOn ? "block" : "none" }}
              />
            )}
            {!shot && !cameraOn && <span className="text-4xl">📷</span>}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {shot ? (
              <>
                <button onClick={() => save({ dataUrl: shot })} disabled={busy} className="btn-primary h-10 px-5 text-sm">
                  {busy ? "Saving…" : "Use this photo"}
                </button>
                <button
                  onClick={() => {
                    setShot(null);
                    startCamera();
                  }}
                  disabled={busy}
                  className="btn-ghost h-10 px-4 text-sm"
                >
                  Retake
                </button>
              </>
            ) : cameraOn ? (
              <button onClick={snap} className="btn-primary h-10 px-5 text-sm">
                Take photo
              </button>
            ) : (
              <>
                {!cameraFailed && (
                  <button onClick={startCamera} className="btn-primary h-10 px-5 text-sm">
                    Open camera
                  </button>
                )}
                <label className="btn-ghost flex h-10 cursor-pointer items-center px-4 text-sm">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {cameraFailed && !shot && (
        <p className="muted mt-3 text-sm">Camera isn&apos;t available — you can upload a picture instead.</p>
      )}
      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <button
        onClick={() => save({ skip: true })}
        disabled={busy}
        className="muted mt-4 text-sm font-medium transition-colors hover:text-[var(--text)]"
      >
        No thanks, skip this
      </button>
    </div>
  );
}
