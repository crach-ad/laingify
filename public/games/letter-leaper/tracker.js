'use strict';
// Classroom play (loaded only when the page carries a #cfg= from
// /play/letter-leaper). Every classroom player gets the teacher's practice
// settings (cfg.settings; null = players choose). Only verified sign-ins also
// get tracking credentials (cfg.ticket/k). For them, this turns game hooks
// into the event contract in docs/letter-leaper-progress.md, queues events in
// localStorage, and uploads small batches. Queues are keyed per learner and
// class, so on a shared device one learner's unsent practice is only ever
// uploaded with that learner's own ticket — and the server also checks it
// against the sign-in.
(() => {
  const MV = 1, BATCH = 100, FLUSH_MS = 4000, KEEP_MS = 14 * 864e5, RESUME_MS = 864e5;
  let cfg;
  try {
    const b64 = location.hash.slice(5).replace(/-/g, '+').replace(/_/g, '/');
    cfg = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
  } catch { return; }
  if (!cfg || !window.leaper) return;
  // Teacher-set practice applies to every player, tracked or not.
  const fixed = cfg.settings || null;
  if (fixed) leaper.configure(fixed);
  if (!cfg.ticket || !cfg.k) {
    // Name-only sign-in: follow the practice; nothing is queued, uploaded, or read.
    const note = document.createElement('p');
    note.className = 'track-note'; note.setAttribute('role', 'status');
    note.textContent = 'Your teacher set this practice. Sign in with your PIN to save your progress.';
    $('player-form').append(note);
    return;
  }
  const KEY = 'leaper-progress:v1:' + cfg.k;
  // The practice a new climb records: the teacher's, else what the player chose.
  const practice = () => (fixed ? { ...fixed, pace: paceOf(fixed.pace) } : leaper.choice());
  const hintsFor = (pace) => pace === 'easy';
  let mem = { sessions: {} }, cur = null, candidate = null, timer = 0, flushing = false, backoff = 0, lostAt = 0, halted = '', hiddenSince = 0;

  // ---- storage (per learner key; in-memory fallback if storage is blocked)
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || mem; } catch { return mem; } }
  function save(st) { mem = st; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }
  function entry(st, id) { return st.sessions[id]; }
  (function purge() {
    const now = Date.now();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('leaper-progress:v1:')) continue;
        const st = JSON.parse(localStorage.getItem(k) || '{}');
        for (const [id, e] of Object.entries(st.sessions || {})) {
          // Unsent practice waits (up to KEEP_MS) for its own learner; anything
          // already uploaded and no longer resumable is cleared, whoever it belongs to.
          const stale = now - (e.updatedAt || 0) > KEEP_MS;
          const done = !e.pending.length && (e.ended || now - e.updatedAt > RESUME_MS);
          if (stale || done) delete st.sessions[id];
        }
        if (Object.keys(st.sessions || {}).length) localStorage.setItem(k, JSON.stringify(st)); else localStorage.removeItem(k);
      }
    } catch {}
  })();

  // ---- status line
  const note = document.createElement('p');
  note.className = 'track-note'; note.setAttribute('role', 'status');
  $('player-form').append(note);
  const pill = document.createElement('span');
  pill.className = 'save-status'; pill.setAttribute('role', 'status');
  document.querySelector('.header-actions').prepend(pill);
  function status(text, tone = '') { note.textContent = pill.textContent = text; pill.dataset.tone = tone; }
  status('Your practice saves to your learning record.');

  // ---- game setup
  document.body.classList.add('tracked');
  $('username').required = false;
  document.querySelector('.username-label').textContent = 'Leaderboard nickname (optional)';
  const startLabel = $('start').innerHTML;

  function clocks(e) {
    const c = leaper.clocks();
    const hidden = (e.hiddenMs || 0) + (hiddenSince && e === cur ? performance.now() - hiddenSince : 0);
    return { activeMs: c.activeMs, pauseMs: c.pauseMs, animationMs: c.animationMs, hiddenMs: Math.round(hidden) };
  }
  function push(e, type, data, now = performance.now()) {
    const t = Math.max(e.lastT, Math.round(now - e.t0));
    e.pending.push({ id: crypto.randomUUID(), seq: e.nextSeq++, type, t, at: Date.now(), ...data });
    e.lastT = t;
    if (e === cur) { e.snap = leaper.snapshot(); e.clocks = clocks(e); }
    e.updatedAt = Date.now();
    const st = load(); st.sessions[e.meta.id] = strip(e); save(st);
    schedule(type === 'end' ? 0 : FLUSH_MS);
  }
  // t0 is a performance.now() origin: meaningless after a reload, so never stored.
  const strip = e => Object.fromEntries(Object.entries(e).filter(([k]) => k !== 't0'));

  leaper.on((type, data, now) => {
    if (type === 'ignored') { if (cur && !cur.ended) { cur.ignored[data.kind]++; persist(cur); } return; }
    if (type === 'start') begin(data, now);
    if (!cur || cur.ended) return;
    push(cur, type === 'start' ? 'session_start' : type, data, now);
    if (type === 'end') finish(cur, data.reason);
  });

  function persist(e) { e.updatedAt = Date.now(); const st = load(); st.sessions[e.meta.id] = strip(e); save(st); }

  function begin(data, now) {
    if (data.resumed && candidate) {
      cur = candidate; candidate = null;
      cur.t0 = now - cur.lastT - 1;
    } else {
      if (candidate) abandon(candidate);
      const s = practice();
      cur = {
        meta: { id: crypto.randomUUID(), letterSet: s.letterSet, pace: s.pace, scope: s.scope, hints: hintsFor(s.pace), gameVersion: leaper.version, measurementVersion: MV, startedAt: Date.now() },
        nextSeq: 0, lastT: 0, t0: now, pending: [], hiddenMs: 0, ended: false,
        ignored: { repeat: 0, modifier: 0, composition: 0, paste: 0, nonletter: 0, busy: 0 },
      };
    }
    hiddenSince = 0;
    $('start').innerHTML = startLabel;
    const other = document.getElementById('start-fresh'); if (other) other.remove();
  }

  // Starting a new climb instead of resuming closes the old one as ended early.
  function abandon(e) {
    e.t0 = performance.now() - e.lastT;
    e.pending.push({ id: crypto.randomUUID(), seq: e.nextSeq++, type: 'end', t: e.lastT, at: Date.now(), reason: 'exited', leap: (e.snap && e.snap.leap) || 0 });
    e.ended = true; persist(e); schedule(0);
  }

  // ---- uploads
  // Never postpone an upload that's already due sooner, so steady typing
  // still uploads every few seconds.
  let timerAt = 0;
  function schedule(ms) {
    const at = Date.now() + ms;
    if (timer && timerAt <= at) return;
    clearTimeout(timer);
    timerAt = at;
    timer = setTimeout(() => { timer = 0; flush(); }, ms);
  }
  async function flush(keepalive = false) {
    if (flushing || halted) return;
    const st = load();
    const e = Object.values(st.sessions).find(x => x.pending.length);
    if (!e) return;
    const events = e.pending.slice(0, BATCH);
    const live = cur && cur.meta.id === e.meta.id ? cur : null;
    const body = JSON.stringify({ ticket: cfg.ticket, session: e.meta, clocks: live ? clocks(live) : (e.clocks || { activeMs: 0, pauseMs: 0, animationMs: 0, hiddenMs: 0 }), ignored: e.ignored, events });
    flushing = true;
    let retry = false;
    try {
      const res = await fetch('/api/typing/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: keepalive && body.length < 60000, credentials: 'same-origin' });
      const out = await res.json().catch(() => ({}));
      if (res.ok || out.code === 'rejected') {
        acknowledge(e.meta.id, events[events.length - 1].seq);
        if (out.code === 'rejected') console.warn('Letter Leaper upload rejected:', out.error);
        backoff = 0;
        if (lostAt) { lostAt = 0; if (cur && !cur.ended) push(cur, 'connection', { state: 'restored' }); }
        status(out.code === 'rejected' ? 'Some practice couldn’t be saved: ' + out.error : 'Practice saved.', out.code === 'rejected' ? 'warn' : 'ok');
        retry = true; backoff = 0;
      } else if (out.code === 'other-learner' || out.code === 'signed-out') {
        // Never re-attribute: hold it until this learner signs in here again.
        halted = out.code;
        status('Your practice is kept on this device. Sign in to your class again to save it.', 'warn');
      } else throw new Error(out.error || 'retry');
    } catch {
      if (!lostAt) { lostAt = Date.now(); if (cur && !cur.ended) push(cur, 'connection', { state: 'lost' }); }
      backoff = Math.min(30000, backoff ? backoff * 2 : 2000);
      status('Offline — your practice is kept on this device and will save when you reconnect.', 'warn');
      schedule(backoff);
    } finally { flushing = false; }
    if (retry) schedule(0);
  }
  function acknowledge(id, upTo) {
    const st = load(); const e = entry(st, id);
    if (!e) return;
    e.pending = e.pending.filter(x => x.seq > upTo);
    if (cur && cur.meta.id === id) cur.pending = cur.pending.filter(x => x.seq > upTo);
    if (!e.pending.length && e.ended && (!cur || cur.meta.id !== id)) delete st.sessions[id]; else st.sessions[id] = e;
    save(st);
    if (cur && cur.meta.id === id && cur.ended && !cur.pending.length) showFeedback(cur);
  }
  window.addEventListener('online', () => { backoff = 0; schedule(0); });
  window.addEventListener('pagehide', () => { if (cur && !cur.ended) persist(Object.assign(cur, { clocks: clocks(cur), snap: leaper.snapshot() })); flush(true); });
  document.addEventListener('visibilitychange', () => {
    if (!cur || cur.ended) return;
    if (document.hidden) { hiddenSince = performance.now(); persist(Object.assign(cur, { clocks: clocks(cur) })); flush(true); }
    else if (hiddenSince) { cur.hiddenMs += performance.now() - hiddenSince; hiddenSince = 0; }
  });

  // ---- session end + feedback
  let shownFor = '';
  function finish(e, reason) {
    // The game resets its counters right after 'end' (back to base camp), so
    // keep this session's final numbers for its own feedback.
    e.final = { ...e.snap };
    e.ended = true; e.endReason = reason; persist(e);
    if (!fixed) leaper.unlock(); // a resumed free-choice climb was locked to its settings
    if (!e.pending.length) showFeedback(e);
    else setTimeout(() => { if (cur === e && e.pending.length) showFeedback(e, true); }, 6000);
  }
  async function showFeedback(e, offline = false) {
    if (shownFor === e.meta.id) return;
    shownFor = e.meta.id;
    let fb = null;
    if (!offline) {
      try { const r = await fetch('/api/typing/session/' + e.meta.id, { credentials: 'same-origin' }); if (r.ok) fb = (await r.json()).feedback; } catch {}
    }
    // A new climb started while we waited: don't cover it with old feedback.
    if (cur !== e) return;
    const s = e.final || e.snap || {};
    const box = document.createElement('div');
    box.className = 'practice-feedback';
    const add = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; el.textContent = text; box.append(el); return el; };
    add('div', 'eyebrow', 'YOUR PRACTICE');
    if (fb) {
      add('p', 'pf-summary', fb.summary);
      add('strong', '', 'Something that improved'); add('p', '', fb.improved);
      add('strong', '', 'Try next'); add('p', '', fb.next);
    } else {
      add('p', 'pf-summary', 'Reached leap ' + (s.leap || 0) + ' · ' + (s.attempts ? Math.round(s.correct / s.attempts * 100) + '% accuracy (' + s.correct + ' of ' + s.attempts + ' answers right)' : 'no answers yet'));
      add('p', '', e.pending.length
        ? 'Your practice is kept on this device and will be added to your learning record when you’re back online.'
        : 'Your practice is saved to your learning record.');
    }
    if (e.endReason === 'completed' && !$('finish').hidden) {
      $('finish').querySelector('.modal').insertBefore(box, $('again'));
    } else {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay'; overlay.id = 'practice-overlay';
      const modal = document.createElement('div'); modal.className = 'modal';
      const done = document.createElement('button'); done.className = 'primary'; done.textContent = 'Done';
      done.onclick = () => { overlay.remove(); $('start').focus(); };
      modal.append(box, done); overlay.append(modal); $('scene').append(overlay); done.focus();
    }
    $('again').addEventListener('click', () => box.remove(), { once: true });
  }

  // ---- resume: the wrapper's server session, or this device's unsent climb
  async function serverSession(id) {
    try {
      const r = await fetch('/api/typing/session/' + id, { credentials: 'same-origin' });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
  // Only climbs under the current difficulty names resume (relaxed/steady/speedy/falls climbs had other rules).
  const sameSettings = m => m.pace in PACE_RULES && (!fixed || (m.letterSet === fixed.letterSet && m.pace === paceOf(fixed.pace) && m.scope === fixed.scope));
  async function prepareResume() {
    await flush();
    const st = load();
    const locals = Object.values(st.sessions).filter(e => !e.ended && sameSettings(e.meta) && e.nextSeq > 0 && Date.now() - e.updatedAt < RESUME_MS)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    let pick = locals[0] || null;
    if (cfg.resume && (!pick || pick.meta.id !== cfg.resume)) {
      const srv = await serverSession(cfg.resume);
      const local = entry(st, cfg.resume);
      if (srv && (srv.state === 'in progress' || srv.state === 'interrupted') && sameSettings(srv.settings) && !(local && local.ended)) {
        pick = local && local.nextSeq > srv.lastSeq + 1 ? local : {
          meta: { id: srv.id, ...srv.settings, hints: hintsFor(srv.settings.pace), gameVersion: leaper.version, measurementVersion: MV, startedAt: srv.startedAt },
          nextSeq: srv.lastSeq + 1, lastT: srv.lastT, pending: (local && local.pending) || [], hiddenMs: srv.resume.clocks.hiddenMs, ended: false,
          ignored: (local && local.ignored) || { repeat: 0, modifier: 0, composition: 0, paste: 0, nonletter: 0, busy: 0 },
          snap: { leap: srv.resume.leap, correct: srv.resume.correct, attempts: srv.resume.attempts, streak: srv.resume.streak, bestStreak: srv.resume.bestStreak },
          clocks: srv.resume.clocks, updatedAt: Date.now(),
        };
      }
    }
    // The student may have pressed Start while we were checking; once a climb
    // has begun, don't offer (or later resume) a stale copy of any session.
    if (cur) return;
    const snap = pick && pick.snap;
    if (!snap || snap.leap >= (pick.meta.scope === 'letters' ? 100 : 150)) return;
    candidate = pick;
    // Free choice: lock the game to the climb being resumed until it ends.
    if (!fixed) leaper.configure({ letterSet: pick.meta.letterSet, pace: pick.meta.pace, scope: pick.meta.scope });
    const c = pick.clocks || { activeMs: 0, pauseMs: 0, animationMs: 0 };
    leaper.resumeFrom({ leap: snap.leap, correct: snap.correct, attempts: snap.attempts, streak: snap.streak, bestStreak: snap.bestStreak, elapsed: c.activeMs + c.animationMs, clocks: { active: c.activeMs, anim: c.animationMs, pause: c.pauseMs } });
    $('start').innerHTML = 'Resume at leap ' + snap.leap + ' <span>↟</span>';
    const fresh = document.createElement('button');
    fresh.type = 'button'; fresh.id = 'start-fresh'; fresh.className = 'text-button'; fresh.textContent = 'Start a new climb instead';
    fresh.onclick = () => { leaper.resumeFrom(null); abandon(candidate); candidate = null; if (!fixed) leaper.unlock(); $('start').innerHTML = startLabel; fresh.remove(); };
    $('start').after(fresh);
  }
  prepareResume();
})();
