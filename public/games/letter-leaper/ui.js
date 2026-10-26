'use strict';
// The HTML around the game: stats bar, prompt, on-screen keyboard, intro
// form, pause/moon/finish dialogs, keyboard capture, preferences, and loading
// a scene renderer. Everything a student or teacher operates is ordinary,
// accessible HTML; the canvas only illustrates. Rules live in core.js.
const $ = id => document.getElementById(id);
readSettings = () => ({ set: $('letter-set').value, pace: $('pace').value });

// ---- preferences (remembered per device) --------------------------------------
const prefStore = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const prefs = {
  sound: prefStore.get('leaper-sound') === 'on',
  calm: prefStore.get('leaper-calm') === 'on',
  listeners: [],
  on(f) { this.listeners.push(f); },
  changed() { for (const f of this.listeners) try { f(this); } catch (err) { console.error(err); } },
};
calmChoice = prefs.calm;
function paintToggles() {
  $('sound').setAttribute('aria-pressed', String(prefs.sound));
  $('sound').setAttribute('aria-label', prefs.sound ? 'Turn sound off' : 'Turn sound on');
  $('sound').textContent = prefs.sound ? '♫' : '♪';
  $('calm').setAttribute('aria-pressed', String(reducedMotion()));
  $('calm').setAttribute('aria-label', reducedMotion() ? 'Calm motion is on' : 'Turn on calm motion');
  $('calm').disabled = motionQuery.matches; // the device setting always wins
  document.body.classList.toggle('calm', reducedMotion());
}
$('sound').onclick = () => {
  prefs.sound = !prefs.sound;
  prefStore.set('leaper-sound', prefs.sound ? 'on' : 'off');
  paintToggles(); prefs.changed(); $('sound').blur();
};
$('calm').onclick = () => {
  prefs.calm = !prefs.calm;
  calmChoice = prefs.calm;
  prefStore.set('leaper-calm', prefs.calm ? 'on' : 'off');
  paintToggles(); prefs.changed(); $('calm').blur();
};
motionQuery.addEventListener?.('change', () => { paintToggles(); prefs.changed(); });
paintToggles();

// ---- HUD -------------------------------------------------------------------------
let best = 0;
try { best = Number(prefStore.get('moonbound-stars-best-v2')) || 0; } catch {}
let flashTimer = 0;
function message(text) {
  $('feedback').textContent = text;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { $('feedback').textContent = ''; }, 1450);
}
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
function targetMarkup() {
  return [...target].map((c, i) => `<span class="${i < typed ? 'typed' : i === typed ? 'next-letter' : ''}">${esc(c.toUpperCase())}</span>`).join('');
}
function stats() {
  $('accuracy').textContent = attempts ? accuracy() + '%' : '—';
  $('streak').innerHTML = streak + ' <span class="gold">✦</span>';
  $('altitude').textContent = steps;
  $('journey-fill').style.height = steps / TOTAL * 100 + '%';
  $('journey-marker').style.bottom = steps / TOTAL * 100 + '%';
  const terrain = terrainFor(steps);
  $('scene').dataset.biome = terrain.id;
  $('biome').textContent = String(terrains.indexOf(terrain) + 1).padStart(2, '0') + ' / ' + terrain.name;
  document.querySelectorAll('.key').forEach(k => {
    k.classList.toggle('active', state === 'playing' && !jumping && pace === 'relaxed' && k.dataset.key === target[typed]);
    k.disabled = state !== 'playing' || jumping;
  });
  $('prompt').innerHTML = state === 'playing' ? `Type <b>${targetMarkup()}</b> to leap.`
    : state === 'paused' ? 'Take your time.'
    : state === 'moon' ? 'One hundred leaps. You did it!'
    : state === 'finished' ? (scope === 'letters' ? 'You reached the moon!' : 'You reached the stars!')
    : 'Ready when you are.';
  $('tip').textContent = state === 'playing'
    ? (steps >= MOON ? 'Type each letter in order. One word, one leap.' : pace === 'relaxed' ? 'No rush. Every leap is progress.' : 'Stay focused. You’ve got this.')
    : 'Find your rhythm. Reach new heights.';
  if (state !== 'intro')
    $('stage-label').textContent = steps < MOON ? `${MOON - steps} LEAPS TO THE MOON · ${steps} / ${TOTAL} TOTAL` : `${TOTAL - steps} WORD LEAPS TO THE STARS · ${steps} / ${TOTAL} TOTAL`;
  document.body.dataset.state = state;
}
function showOnly(id) {
  for (const o of ['intro', 'moon-overlay', 'finish', 'pause-overlay']) $(o).hidden = o !== id;
}
let keyFlash = 0;
views.push((type, d) => {
  switch (type) {
    case 'start':
      showOnly(null);
      $('pause').disabled = false;
      message($('username').value.trim() ? 'Let’s go, ' + $('username').value.trim() + '!' : 'Let’s go, Milo!');
      $('start').blur();
      break;
    case 'miss': {
      message('Almost! Next is ' + d.expected.toUpperCase() + '.');
      const btn = document.querySelector(`[data-key="${d.key}"]`);
      if (btn) { btn.classList.add('wrong'); clearTimeout(keyFlash); keyFlash = setTimeout(() => btn.classList.remove('wrong'), 250); }
      break;
    }
    case 'timeout': message(steps >= MOON ? 'Fresh word. You’ve got this.' : 'Fresh letter. You’ve got this.'); break;
    case 'jump': if (d.streak % 5 === 0) message(d.streak + ' leaps in a row!'); break;
    case 'moon':
      $('moon-overlay').hidden = false;
      $('pause').disabled = true;
      $('continue-stars').focus();
      break;
    case 'stage': if (d.leap !== MOON) message(d.terrain.message); break;
    case 'land': if (d.leap === WORDS3_FROM) message('Ready for three-letter words!'); break;
    case 'continue':
      $('moon-overlay').hidden = true;
      $('pause').disabled = false;
      $('continue-stars').blur();
      message('Type the whole word to leap!');
      break;
    case 'pause': $('pause-overlay').hidden = false; $('resume').focus(); break;
    case 'resume': $('pause-overlay').hidden = true; $('resume').blur(); break;
    case 'finish': showFinish(d); break;
    case 'home':
      showOnly('intro');
      $('pause').disabled = true;
      $('feedback').textContent = '';
      $('stage-label').textContent = 'EVERY GREAT ADVENTURE STARTS WITH A LITTLE LEAP.';
      $('start').focus();
      break;
  }
  stats();
});
function showFinish(d) {
  if (d.scope !== 'full') {
    $('finish').querySelector('h2').textContent = d.scope === 'letters' ? 'You made it to the moon!' : 'You reached the stars!';
    $('finish').querySelector('h2+p').textContent = d.scope === 'letters' ? '100 letter leaps. One giant step.' : '50 word leaps from the moon to the stars.';
  }
  $('finish').hidden = false;
  $('pause').disabled = true;
  const score = d.accuracy;
  $('final-accuracy').textContent = score + '%';
  $('final-streak').textContent = d.bestStreak;
  const seconds = Math.floor(d.elapsed / 1000);
  $('final-time').textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  $('best-note').textContent = score > best ? 'A new personal best! Saved on this device.' : 'Personal best on this device: ' + best + '%';
  if (score > best) { best = score; prefStore.set('moonbound-stars-best-v2', String(best)); }
  $('again').focus();
}

// ---- input ------------------------------------------------------------------------
for (const row of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']) {
  const el = document.createElement('div');
  el.className = 'key-row';
  for (const key of row) {
    const btn = document.createElement('button');
    btn.className = 'key'; btn.textContent = key.toUpperCase(); btn.dataset.key = key;
    btn.setAttribute('aria-label', 'Type ' + key.toUpperCase());
    btn.addEventListener('click', () => { input(key, 'screen'); btn.blur(); });
    el.append(btn);
  }
  $('keyboard').append(el);
}
$('continue-stars').onclick = continueStars;
$('again').onclick = home;
$('pause').onclick = requestPause;
$('resume').onclick = resume;
$('restart').onclick = home;
$('help').onclick = () => { if (state === 'playing') requestPause('help'); $('help-dialog').showModal(); };
$('close-help').onclick = $('got-it').onclick = () => $('help-dialog').close();
// Only keys pressed on the game itself are read: forms and dialogs are never
// observed. Ignored input is counted by kind only (no key values).
window.addEventListener('keydown', e => {
  if ($('help-dialog').open || $('leaderboard-dialog').open || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const live = state === 'playing', char = e.key.length === 1;
  if (e.ctrlKey || e.metaKey || e.altKey) { if (live && char) ignore('modifier'); return; }
  if (e.isComposing || e.keyCode === 229) { if (live) ignore('composition'); return; }
  if (e.repeat) { if (live && char) ignore('repeat'); return; }
  if (e.key === 'Escape') { e.preventDefault(); requestPause(); return; }
  if (!live || !char) return;
  if (/^[a-z]$/i.test(e.key)) {
    e.preventDefault();
    if (jumping) ignore('busy'); else input(e.key.toLowerCase(), 'kbd');
  } else ignore('nonletter');
});
window.addEventListener('paste', e => {
  if (state === 'playing' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); ignore('paste'); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') requestPause('hidden'); });
stats();

if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'read_climb_progress', title: 'Read climb progress', description: 'Read current Letter Leaper progress and practice settings.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (args) => {
        if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length) throw new Error('Expected an empty object.');
        return { state, leaps: steps, totalLeaps: TOTAL, accuracy: attempts ? accuracy() : null, practice: steps < MOON ? set : 'words', pace, moonAt: MOON, terrain: terrainFor(steps).id, targetLength: target.length, typedLetters: typed };
      },
    })).catch(() => {});
  } catch {}
}

// ---- renderer: Phaser scene by default; the classic DOM scene for comparison
// (?renderer=classic) or when WebGL / Phaser isn't available.
const query = new URLSearchParams(location.search);
function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
function loadScripts(srcs) {
  return srcs.reduce((p, src) => p.then(() => new Promise((ok, fail) => {
    const s = Object.assign(document.createElement('script'), { src, async: false });
    s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src));
    document.body.append(s);
  })), Promise.resolve());
}
let renderer = query.get('renderer') === 'classic' || !webglOk() ? 'classic' : 'phaser';
document.body.classList.add('renderer-' + renderer);
// The Phaser scene must report ready (scene-phaser.js sets __leaperScene.ready) or we fall back.
const phaserReady = () => new Promise((ok, fail) => {
  const t0 = performance.now();
  (function check() {
    if (window.__leaperScene?.ready) ok();
    else if (performance.now() - t0 > 6000) { window.__leaperGame?.destroy(true); document.querySelector('.leaper-canvas')?.remove(); fail(new Error('scene did not start')); }
    else setTimeout(check, 100);
  })();
});
(renderer === 'phaser' ? loadScripts(['vendor/phaser.min.js', 'art.js', 'milo.js', 'scene-phaser.js']).then(phaserReady) : Promise.reject(new Error('classic requested')))
  .catch(err => {
    if (renderer === 'phaser') console.warn('Letter Leaper: using the classic scene —', err.message);
    document.body.classList.replace('renderer-phaser', 'renderer-classic');
    renderer = 'classic';
    return loadScripts(['scene-classic.js']);
  });

// ---- classroom integration (unchanged contract) -----------------------------------
// Public play (?mode=public) never contacts the class APIs: no username, no leaderboard, no score saving.
const publicPlay = query.get('mode') === 'public';
document.querySelector('.brand').href = './' + location.search;
window.leaper = {
  get version() { return GAME_VERSION + '-' + renderer; },
  on: f => hooks.push(f),
  clocks: () => ({ activeMs: Math.round(activeNow()), pauseMs: Math.round(clock.pause + pausedFor()), animationMs: Math.round(clock.anim) }),
  snapshot: () => ({ state, leap: steps, correct, attempts, streak, bestStreak, elapsed: Math.round(elapsed) }),
  configure(c) {
    $('letter-set').value = c.letterSet; $('pace').value = c.pace; scope = c.scope;
    for (const id of ['letter-set', 'pace']) $(id).disabled = true;
    $('letter-set').closest('label').hidden = scope === 'words';
  },
  unlock() {
    scope = 'full';
    for (const id of ['letter-set', 'pace']) $(id).disabled = false;
    $('letter-set').closest('label').hidden = false;
  },
  choice: () => ({ letterSet: $('letter-set').value, pace: $('pace').value, scope }),
  resumeFrom(r) { pendingResume = r; },
  start,
  home,
};
if (publicPlay) {
  document.body.classList.add('public-play');
  $('username').required = false;
  $('player-form').addEventListener('submit', event => { event.preventDefault(); start(); });
} else {
  document.body.append(Object.assign(document.createElement('script'), { src: 'leaderboard.js' }));
  if (location.hash.startsWith('#cfg=')) document.body.append(Object.assign(document.createElement('script'), { src: 'tracker.js' }));
}
