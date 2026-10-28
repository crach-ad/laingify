'use strict';
// The HTML around the game: stats bar, prompt, on-screen keyboard, intro
// form, pause/moon/finish dialogs, keyboard capture, preferences, and loading
// a scene renderer. Everything a student or teacher operates is ordinary,
// accessible HTML; the canvas only illustrates. Rules live in core.js.
const $ = id => document.getElementById(id);
readSettings = () => ({ set: $('letter-set').value, pace: $('pace').value });
// What each difficulty means, shown under the settings and in the help.
const PACE_TEXT = {
  easy: 'Easy: no rush, and the next key lights up. Platforms never fall.',
  medium: 'Medium: 8 seconds for each letter. The platform wobbles near the end and falls at 8 seconds, or on your third wrong letter — and a fall sends Milo 10 leaps back down.',
  hard: 'Hard: words from the very first leap, growing from 2 to 5 letters. 4 seconds for each letter, and one wrong letter or running out of time sends Milo 10 leaps back down.',
};

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
// Letter case is display-only: typing is case-insensitive either way, so it
// never changes what is measured. Used by the scenes too (shared scope).
prefs.letterCase = prefStore.get('leaper-case') === 'lower' ? 'lower' : 'upper';
function letterCase(s) { return prefs.letterCase === 'lower' ? s.toLowerCase() : s.toUpperCase(); }
// Lowercase targets use a font whose l has a tail, so it can't be read as I (style.css does the same for the HTML).
function letterFont() { return prefs.letterCase === 'lower' ? '"Atkinson Hyperlegible", sans-serif' : '"Space Grotesk", sans-serif'; }
function paintCase() {
  $('letter-case').value = prefs.letterCase;
  document.body.dataset.case = prefs.letterCase;
  for (const k of document.querySelectorAll('.key')) { k.textContent = letterCase(k.dataset.key); k.setAttribute('aria-label', 'Type ' + letterCase(k.dataset.key)); }
  const rows = { all: 'All letters', home: 'Home row · ' + letterCase('asdfghjkl'), top: 'Top row · ' + letterCase('qwerty'), bottom: 'Bottom row · ' + letterCase('zxcvbnm') };
  for (const o of $('letter-set').options) o.textContent = rows[o.value];
  document.querySelector('.word-examples').textContent = ['go', 'up', 'cat', 'sun'].map(letterCase).join(' · ');
}
$('letter-case').onchange = () => {
  prefs.letterCase = $('letter-case').value === 'lower' ? 'lower' : 'upper';
  prefStore.set('leaper-case', prefs.letterCase);
  paintCase(); stats(); prefs.changed();
};
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
  return [...target].map((c, i) => `<span class="${i < typed ? 'typed' : i === typed ? 'next-letter' : ''}">${esc(letterCase(c))}</span>`).join('');
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
    k.classList.toggle('active', state === 'playing' && !jumping && pace === 'easy' && k.dataset.key === target[typed]);
    k.disabled = state !== 'playing' || jumping;
  });
  $('prompt').innerHTML = state === 'playing' ? `Type <b>${targetMarkup()}</b> to leap.`
    : state === 'paused' ? 'Take your time.'
    : state === 'moon' ? 'One hundred leaps. You did it!'
    : state === 'finished' ? (scope === 'letters' ? 'You reached the moon!' : 'You reached the stars!')
    : 'Ready when you are.';
  $('tip').textContent = state === 'playing'
    ? (target.length > 1 ? 'Type each letter in order. One word, one leap.' : pace === 'easy' ? 'No rush. Every leap is progress.' : 'Stay focused. You’ve got this.')
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
      message('Almost! Next is ' + letterCase(d.expected) + '.' + (d.left === 1 ? ' One more miss and the platform falls!' : ''));
      const btn = document.querySelector(`[data-key="${d.key}"]`);
      if (btn) { btn.classList.add('wrong'); clearTimeout(keyFlash); keyFlash = setTimeout(() => btn.classList.remove('wrong'), 250); }
      break;
    }
    case 'jump': if (d.streak % 5 === 0) message(d.streak + ' leaps in a row!'); break;
    case 'moon':
      $('moon-overlay').hidden = false;
      $('pause').disabled = true;
      $('continue-stars').focus();
      break;
    case 'stage': if (d.leap !== MOON) message(d.terrain.message); break;
    case 'fall': {
      message(d.kind === 'miss' ? 'Whoops — so close!' : 'The platform gave way!');
      const btn = d.key && document.querySelector(`[data-key="${d.key}"]`);
      if (btn) { btn.classList.add('wrong'); clearTimeout(keyFlash); keyFlash = setTimeout(() => btn.classList.remove('wrong'), 250); }
      break;
    }
    case 'recover': {
      const again = d.kind === 'miss' ? 'try again!' : 'a little quicker this time!';
      const down = d.from - d.leap;
      message(down > 0 ? `Down ${down} leap${down === 1 ? '' : 's'} — ${again}` : again[0].toUpperCase() + again.slice(1));
      break;
    }
    case 'countdown': if (falls && d.seconds === 2) message('Quick — the platform is wobbling!'); break;
    case 'land': {
      const n = wordLength(d.leap);
      if (n >= 3 && n !== wordLength(d.leap - 1)) message(`Ready for ${['three', 'four', 'five'][n - 3]}-letter words!`);
      break;
    }
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
    btn.className = 'key'; btn.dataset.key = key;
    btn.addEventListener('click', () => { input(key, 'screen'); btn.blur(); });
    el.append(btn);
  }
  $('keyboard').append(el);
}
paintCase();
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

// ---- renderer: the three.js scene by default; the Phaser scene, then the
// classic DOM scene, if it can't start (no WebGL, a failed download, or no
// ready signal in time). ?renderer=phaser|classic picks one for comparison.
const query = new URLSearchParams(location.search);
function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
function loadScripts(srcs) {
  return srcs.reduce((p, src) => p.then(() => new Promise((ok, fail) => {
    const s = Object.assign(document.createElement('script'), { src, async: false });
    s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src));
    document.body.append(s);
  })), Promise.resolve());
}
function loadModule(src) {
  return new Promise((ok, fail) => {
    const s = Object.assign(document.createElement('script'), { src, type: 'module' });
    s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src));
    document.body.append(s);
  });
}
// A canvas scene must report ready (it sets __leaperScene.ready) or failure, or we move on.
const sceneReady = (ms) => new Promise((ok, fail) => {
  const t0 = performance.now();
  (function check() {
    const s = window.__leaperScene;
    if (s?.ready) ok();
    else if (s?.failed || performance.now() - t0 > ms) fail(new Error(s?.failed ? 'scene failed: ' + s.failed.message : 'scene did not start'));
    else setTimeout(check, 100);
  })();
});
const RENDERERS = {
  '3d': () => loadScripts(['art.js']).then(() => loadModule('scene-3d.js')).then(() => sceneReady(20000)),
  phaser: () => loadScripts(['vendor/phaser.min.js', 'art.js', 'milo.js', 'scene-phaser.js']).then(() => sceneReady(6000)),
};
function dropScene() {
  try { window.__leaperScene?.destroy?.(); } catch {}
  window.__leaperGame?.destroy(true);
  document.querySelectorAll('.leaper-canvas').forEach((c) => c.remove());
  delete window.__leaperScene;
}
let renderer = !webglOk() ? 'classic' : ['phaser', 'classic'].includes(query.get('renderer')) ? query.get('renderer') : '3d';
function startRenderer(name) {
  document.body.classList.remove('renderer-' + renderer, 'renderer-canvas');
  renderer = name;
  document.body.classList.add('renderer-' + name);
  if (name !== 'classic') document.body.classList.add('renderer-canvas');
  if (name === 'classic') return loadScripts(['scene-classic.js']);
  return RENDERERS[name]().catch((err) => {
    console.warn(`Letter Leaper: the ${name} scene could not start —`, err.message);
    dropScene();
    return startRenderer(name === '3d' ? 'phaser' : 'classic');
  });
}
startRenderer(renderer);
function paintPace() {
  const p = paceOf($('pace').value);
  $('pace-rule').textContent = PACE_TEXT[p];
  document.body.dataset.pace = p;
  // Words-only practice and hard climbs don't use the letter rows.
  $('letter-set').closest('label').hidden = scope === 'words' || p === 'hard';
}
$('pace').addEventListener('change', paintPace);
paintPace();

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
    $('letter-set').value = c.letterSet; $('pace').value = paceOf(c.pace); scope = c.scope;
    for (const id of ['letter-set', 'pace']) $(id).disabled = true;
    paintPace();
  },
  unlock() {
    scope = 'full';
    for (const id of ['letter-set', 'pace']) $(id).disabled = false;
    paintPace();
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
