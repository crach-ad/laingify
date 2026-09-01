"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

// A plain <input type="file" accept="image/*"> never opens a live webcam on
// desktop Safari/Chrome — it just opens the OS file picker, forcing learners
// on a Mac to shoot the photo in Photo Booth, save it, then hunt for it in
// Files. This button opens an in-page getUserMedia preview instead (same
// approach as the profile-selfie flow in PhotoCapture.tsx), with "choose a
// file" kept as a fallback for devices that block the camera.

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export default function CameraPhotoButton({
  triggerLabel,
  triggerBusyLabel = "Uploading…",
  triggerClassName,
  busy = false,
  onFile,
}: {
  triggerLabel: string;
  triggerBusyLabel?: string;
  triggerClassName: string;
  busy?: boolean;
  onFile: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [shot, setShot] = useState<string | null>(null);

  async function startCamera() {
    setCameraFailed(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } },
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

  function close() {
    stopCamera();
    setShot(null);
    setOpen(false);
  }

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 960;
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

  function useShot() {
    if (!shot) return;
    onFile(dataUrlToFile(shot, `photo-${Date.now()}.jpg`));
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          startCamera();
        }}
        disabled={busy}
        className={triggerClassName}
      >
        {busy ? triggerBusyLabel : triggerLabel}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <div className="card w-full max-w-sm rounded-[18px] p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">Take a photo</h2>

              <div
                className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--border)", background: "var(--tile)" }}
              >
                {shot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot} alt="Captured" className="h-full w-full object-cover" />
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

              {cameraFailed && !shot && (
                <p className="muted mt-3 text-sm">Camera isn&apos;t available — you can choose a file instead.</p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {shot ? (
                  <>
                    <button onClick={useShot} className="btn-primary h-10 px-5 text-sm">
                      Use this photo
                    </button>
                    <button
                      onClick={() => {
                        setShot(null);
                        startCamera();
                      }}
                      className="btn-ghost h-10 px-4 text-sm"
                    >
                      Retake
                    </button>
                  </>
                ) : cameraOn ? (
                  <button onClick={snap} className="btn-primary h-10 px-5 text-sm">
                    Take photo
                  </button>
                ) : null}
                <label className="btn-ghost flex h-10 cursor-pointer items-center px-4 text-sm">
                  Choose file
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        onFile(f);
                        close();
                      }
                    }}
                  />
                </label>
                <button onClick={close} className="muted h-10 px-4 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
