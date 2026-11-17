"use client";
import { useEffect, useRef, useState } from "react";
// Minimal Web Speech API surface (not in TS's DOM lib on all targets). Used
// for a live transcript while recording, so voice notes are readable even
// when no server-side transcription key is configured.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
      }) => void)
    | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function newSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function AudioCheckpoint({
  done,
  savedUrl,
  busy,
  onRecorded,
}: {
  done: boolean;
  savedUrl: string | null;
  busy: boolean;
  onRecorded: (blob: Blob, mimeType: string, transcript: string) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const listeningRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    mime: string;
    transcript: string;
  } | null>(null);
  const [micFailed, setMicFailed] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/mp4", "audio/webm", "audio/ogg"].find((m) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setPreview({
          url: URL.createObjectURL(blob),
          blob,
          mime: type,
          transcript: transcriptRef.current.trim(),
        });
        stream.getTracks().forEach((tr) => tr.stop());
      };
      recorderRef.current = rec;
      startTranscription();
      rec.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setMicFailed(true);
    }
  }

  // Live transcript while recording. Best-effort: where the Web Speech API is
  // missing (some tablets), the server-side transcription still covers it.
  function startTranscription() {
    transcriptRef.current = "";
    const recog = newSpeechRecognition();
    if (!recog) return;
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcriptRef.current += e.results[i][0].transcript + " ";
      }
    };
    // Chrome ends recognition after silence — restart while still recording.
    recog.onend = () => {
      if (!listeningRef.current) return;
      try {
        recog.start();
      } catch {
        listeningRef.current = false;
      }
    };
    listeningRef.current = true;
    try {
      recog.start();
      recognizerRef.current = recog;
    } catch {
      listeningRef.current = false;
    }
  }

  function stop() {
    listeningRef.current = false;
    recognizerRef.current?.stop();
    recorderRef.current?.stop();
    setRecording(false);
  }

  if (done) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3">
        {savedUrl && <audio controls src={savedUrl} className="w-full max-w-sm" />}
        <span className="pill pill-done">Voice note saved ✓</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {preview ? (
        <>
          <audio controls src={preview.url} className="w-full max-w-sm" />
          <div className="flex gap-2">
            <button
              onClick={() => onRecorded(preview.blob, preview.mime, preview.transcript)}
              disabled={busy}
              className="btn-primary h-11 px-5 text-sm"
            >
              {busy ? "Saving…" : "Use this recording"}
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={busy}
              className="btn-ghost h-11 px-4 text-sm"
            >
              Record again
            </button>
          </div>
        </>
      ) : recording ? (
        <button type="button" onClick={stop} className="btn-primary h-12 px-6 text-sm" style={{ background: "var(--danger)" }}>
          ⏹ Stop ({seconds}s)
        </button>
      ) : (
        <button type="button" onClick={start} disabled={micFailed} className="btn-primary h-12 px-6 text-sm">
          🎙️ Record your answer
        </button>
      )}
      {micFailed && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          Microphone isn&apos;t available on this device — ask your instructor for help.
        </p>
      )}
    </div>
  );
}

