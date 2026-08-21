"use client";

// Fire-and-forget learner event tracking (ANALYTICS.md Phase A).
// Events queue locally and flush as a batch — on a timer, when the tab is
// hidden, and on pagehide — via sendBeacon so navigation is never blocked.
// Failures are silently dropped: analytics must never break the tutorial.

type EventItem = { type: string; moduleId?: string; meta?: Record<string, unknown> };

let queue: EventItem[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function send(items: EventItem[]) {
  if (items.length === 0) return;
  const payload = JSON.stringify(items);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/event", new Blob([payload], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function flushEvents() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const items = queue;
  queue = [];
  send(items);
}

export function track(type: string, moduleId?: string, meta?: Record<string, unknown>) {
  queue.push({ type, moduleId, meta });
  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener("pagehide", flushEvents);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushEvents();
    });
  }
  if (queue.length >= 20) flushEvents();
  else if (!timer) timer = setTimeout(flushEvents, 5000);
}
