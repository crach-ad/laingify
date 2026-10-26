'use strict';
// Phaser 4 renderer for Letter Leaper: layered environments, camera, Milo,
// the target sign, particles, and sound. It follows core.js through view
// events and read-only state — it never changes rules, timers, or tracking.
//
// Resolution: the canvas backing store is CSS size × view scale (device pixel
// ratio, capped at 2, dropped to 1 if frames run slow) and the main camera
// zooms by the same factor, so world coordinates stay in CSS px and text and
// art stay crisp. Screen-fixed layers live in `screen` containers offset to
// cancel the camera zoom.
(() => {
  const host = $('scene');
  const GAP = 132;
  const TEX_SCALE = Math.min(window.devicePixelRatio || 1, 2); // crisp parts
  const BG_SCALE = Math.min(TEX_SCALE, 1.25); // soft backgrounds
  const calm = () => reducedMotion();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const num = (hex) => parseInt(hex.slice(1), 16);
  const envFor = (leap) => terrains.indexOf(terrainFor(leap));
  const ENDS = [...Art.envs.slice(1).map((e) => e.at), TOTAL];
  const stats = { textureBytes: 0, textures: 0, quality: 'full', particlesMax: 0 };
  window.__leaperScene = stats;

  class LeaperScene extends Phaser.Scene {
    constructor() { super('leaper'); }

    // ---- textures ---------------------------------------------------------------
    tex(key, scale = TEX_SCALE) {
      const id = `${key}@${scale}`;
      if (!this.textures.exists(id)) {
        const c = Art.canvasFor(key, scale);
        this.textures.addCanvas(id, c);
        stats.textureBytes += c.width * c.height * 4; stats.textures++;
      }
      return id;
    }
    dropTex(key, scale) {
      const id = `${key}@${scale}`;
      if (!this.textures.exists(id)) return;
      const src = this.textures.get(id).getSourceImage();
      stats.textureBytes -= src.width * src.height * 4; stats.textures--;
      this.textures.remove(id);
    }

    create() {
      this.R = TEX_SCALE;
      this.W = host.clientWidth; this.H = host.clientHeight;
      this.view = 1;
      this.camLevel = 0;
      this.envObjects = new Map();
      this.platforms = new Map();
      this.sky = this.add.graphics().setDepth(0);
      this.skyKey = '';
      this.bodies = this.add.container(0, 0).setDepth(1);
      this.bodyImgs = {
        sun: this.add.image(0, 0, this.tex('sun', BG_SCALE)).setAlpha(0),
        earth: this.add.image(0, 0, this.tex('earth', TEX_SCALE)).setAlpha(0),
        moon: this.add.image(0, 0, this.tex('moon', BG_SCALE)).setAlpha(0),
        star: this.add.image(0, 0, this.tex('star', BG_SCALE)).setAlpha(0),
      };
      this.bodies.add(Object.values(this.bodyImgs));
      for (const [k, img] of Object.entries(this.bodyImgs)) { img.baseScale = 1 / (k === 'earth' ? TEX_SCALE : BG_SCALE); img.key = k; }
      this.screens = [this.sky, this.bodies];
      this.world = this.add.container(0, 0).setDepth(10);
      this.milo = new Milo(this, (k) => this.tex(k), calm);
      this.milo.root.setDepth(15);
      this.card = this.buildCard();
      this.flag = this.add.image(0, 0, this.tex('flag')).setOrigin(0.1, 1).setScale(0).setDepth(14);
      this.dust = this.add.particles(0, 0, this.tex('puff'), {
        lifespan: 420, speed: { min: 20, max: 60 }, angle: { min: 200, max: 340 }, scale: { start: 0.55 / this.R, end: 0 },
        alpha: { start: 0.7, end: 0 }, gravityY: 60, emitting: false,
      }).setDepth(16);
      this.sparkles = this.add.particles(0, 0, this.tex('sparkle'), {
        lifespan: 1300, speed: { min: 60, max: 150 }, scale: { start: 0.9 / this.R, end: 0 }, alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 180 }, tint: [0xfff3c4, 0xffd36b, 0xc9e7ff], emitting: false, maxAliveParticles: 30,
      }).setDepth(25);
      this.ambient = null;
      this.sounds();
      this.applyView(this.view = this.pickView());
      this.layout(true);
      views.push((type, d) => this.onGame(type, d));
      new ResizeObserver(() => this.onResize()).observe(host);
      prefs.on(() => { this.applyAmbient(true); this.milo.setSpace(steps >= 80, true); this.refreshCard(); });
      this.frameTimes = [];
      document.fonts?.ready.then(() => this.refreshCard());
      stats.ready = true;
    }

    // ---- view scale / resize -------------------------------------------------------
    pickView() { return stats.quality === 'low' ? 1 : this.R; }
    applyView(v) {
      this.view = v;
      this.scale.setZoom(1 / v);
      this.scale.resize(Math.round(this.W * v), Math.round(this.H * v));
      this.cameras.main.setSize(Math.round(this.W * v), Math.round(this.H * v)).setZoom(v);
      const ox = this.W * (v - 1) / 2, oy = this.H * (v - 1) / 2;
      for (const s of this.screens) s.setPosition(ox, oy).setScrollFactor(0);
      for (const objs of this.envObjects.values()) objs.root.setPosition(ox, oy);
      if (this.ambient) this.ambient.root.setPosition(ox, oy);
    }
    onResize() {
      const W = host.clientWidth, H = host.clientHeight;
      if (!W || !H || (W === this.W && H === this.H)) return;
      this.W = W; this.H = H;
      for (const k of [...this.envObjects.keys()]) this.dropEnv(k, false);
      this.applyView(this.view);
      this.layout(true);
    }
    get sizeScale() { return clamp(this.W / 900, 0.78, 1); }
    xFor(n) {
      if (n === MOON || n === TOTAL) return this.W / 2;
      // Strictly alternate sides so the next platform is never overhead, with a
      // little fixed variety so the climb doesn't look mechanical.
      const jitter = (((n * 37) % 7) - 3) * 0.014;
      return clamp(((n % 2 === 0) ? 0.63 : 0.37) * this.W + jitter * this.W, 92, this.W - 104);
    }
    yFor(n) { return -n * GAP; }

    // ---- platforms -------------------------------------------------------------------
    platformKey(n) {
      if (n === MOON) return 'moon-surface';
      if (n === TOTAL) return 'final-star';
      return Art.envs[envFor(Math.max(0, n - 1))].platform;
    }
    surfaceOffset(key) { return key === 'moon-surface' ? 14 : key === 'final-star' ? 62 : 11; }
    syncPlatforms(animate) {
      const lo = Math.max(0, steps - 2), hi = Math.min(TOTAL, steps + 4);
      for (const [n, p] of this.platforms) if (n < lo || n > hi) { p.destroy(); this.platforms.delete(n); }
      for (let n = lo; n <= hi; n++) {
        const key = this.platformKey(n);
        let p = this.platforms.get(n);
        if (!p || p.key !== key) {
          p?.destroy();
          p = this.add.image(0, 0, this.tex(key)).setOrigin(0.5, this.surfaceOffset(key) / Art.sizeOf(key)[1]);
          p.key = key;
          this.world.add(p);
          this.platforms.set(n, p);
          if (animate && !calm()) { p.setAlpha(0); this.tweens.add({ targets: p, alpha: 1, duration: 300 }); }
        }
        p.setPosition(this.xFor(n), this.yFor(n)).setScale(this.sizeScale / this.R);
        p.setAlpha(this.narrowIntro() && n > 0 ? 0 : n > steps + 1 ? 0.45 : 1);
      }
    }
    // Where Milo stands on platform n.
    standAt(n) { return { x: this.xFor(n), y: this.yFor(n) + 1 }; }

    // ---- the target sign ---------------------------------------------------------------
    buildCard() {
      const c = this.add.container(0, 0).setDepth(20).setAlpha(0);
      c.bg = this.add.image(0, 0, this.cardTex(1));
      c.letters = [];
      c.underline = this.add.rectangle(0, 0, 26, 4, 0xf2c14e).setOrigin(0.5);
      c.caption = this.add.text(0, 44, 'TYPE TO LEAP', { fontFamily: '"DM Sans", sans-serif', fontSize: '11px', fontStyle: '600', color: '#ffffff' }).setOrigin(0.5).setResolution(this.R);
      c.caption.setStroke('#0f2320', 3);
      c.timerBack = this.add.rectangle(0, 58, 70, 5, 0x0f2320, 0.55).setOrigin(0.5);
      c.timer = this.add.rectangle(-35, 58, 70, 5, 0xf2c14e).setOrigin(0, 0.5);
      c.add([c.bg, c.underline, c.caption, c.timerBack, c.timer]);
      return c;
    }
    cardTex(len) {
      const id = `card-${len}@${this.R}`;
      if (this.textures.exists(id)) return id;
      const w = 34 + len * 40, h = 66, R = this.R, cv = document.createElement('canvas');
      cv.width = Math.ceil((w + 12) * R); cv.height = Math.ceil((h + 14) * R);
      const g = cv.getContext('2d'); g.scale(R, R);
      g.shadowColor = 'rgba(10,20,18,0.35)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
      g.beginPath(); g.roundRect(6, 4, w, h, 16); g.fillStyle = '#fff8e6'; g.fill();
      g.shadowColor = 'transparent'; g.lineWidth = 3; g.strokeStyle = '#1d2b26'; g.stroke();
      g.beginPath(); g.moveTo(6 + w / 2 - 9, 4 + h - 1); g.lineTo(6 + w / 2, 4 + h + 9); g.lineTo(6 + w / 2 + 9, 4 + h - 1); g.fillStyle = '#fff8e6'; g.fill();
      g.beginPath(); g.moveTo(6 + w / 2 - 9, 4 + h + 1.5); g.lineTo(6 + w / 2, 4 + h + 9); g.lineTo(6 + w / 2 + 9, 4 + h + 1.5); g.strokeStyle = '#1d2b26'; g.stroke();
      this.textures.addCanvas(id, cv);
      stats.textureBytes += cv.width * cv.height * 4; stats.textures++;
      return id;
    }
    refreshCard(pop = false) {
      const c = this.card;
      if (state === 'intro' || state === 'finished' || state === 'moon' || steps >= TOTAL) { c.setAlpha(0); return; }
      const word = letterCase(target);
      if (c.word !== word) {
        for (const l of c.letters) l.destroy();
        c.letters = [...word].map(() => this.add.text(0, -6, '', { fontFamily: '"Space Grotesk", sans-serif', fontSize: '40px', fontStyle: '700', color: '#1d2b26' }).setOrigin(0.5).setResolution(this.R));
        c.add(c.letters);
        c.bg.setTexture(this.cardTex(word.length)).setScale(1 / this.R);
        c.word = word;
      }
      const spacing = 40, start = -((word.length - 1) * spacing) / 2;
      c.letters.forEach((l, i) => {
        l.setText(word[i]).setX(start + i * spacing);
        // Completed letters turn green, the current letter is ink-dark and
        // underlined, remaining letters are muted (all ≥ 4.5:1 on the cream sign).
        l.setColor(i < typed ? '#1f6b43' : i === typed ? '#1d2b26' : '#56655f');
        l.setScale(i === typed ? 1.08 : 1);
      });
      c.underline.setPosition(start + typed * spacing, 20).setVisible(typed < word.length).setSize(26, 4);
      const timed = pace !== 'relaxed';
      c.caption.setText(timed ? `${Math.max(0, Math.ceil(remaining / 1000))} SECONDS` : word.length > 1 ? 'TYPE THE WORD' : 'TYPE TO LEAP');
      c.timerBack.setVisible(timed); c.timer.setVisible(timed);
      const n = steps + 1, s = this.sizeScale;
      c.setPosition(this.xFor(n), this.yFor(n) - 96 * s).setScale(s);
      if (pop && !calm()) { c.setScale(s * 0.7).setAlpha(0); this.tweens.add({ targets: c, scale: s, alpha: 1, duration: 260, ease: 'Back.easeOut' }); }
      else if (!jumping) c.setAlpha(1);
    }

    // ---- environments ------------------------------------------------------------------
    envWeight(k, a) {
      const start = Art.envs[k].at, end = ENDS[k];
      const fadeIn = k === 0 ? 1 : smooth((a - (start - 2.5)) / 3);
      const fadeOut = k === Art.envs.length - 1 ? 1 : 1 - smooth((a - (end - 0.5)) / 3);
      return fadeIn * fadeOut;
    }
    buildEnv(k) {
      const env = Art.envs[k], W = this.W, H = this.H;
      const root = this.add.container(this.W * (this.view - 1) / 2, this.H * (this.view - 1) / 2).setScrollFactor(0).setDepth(2 + k * 0.1);
      const layers = env.layers.map((layer) => {
        const key = this.tex(layer.key, BG_SCALE), ts = 1 / BG_SCALE;
        if (layer.kind === 'sides') {
          const l = this.add.tileSprite(0, 0, layer.w, H, key).setOrigin(0, 0).setTileScale(ts, ts);
          const r = this.add.tileSprite(W, 0, layer.w, H, key).setOrigin(0, 0).setTileScale(ts, ts).setFlipX(true);
          r.x = W - layer.w;
          root.add([l, r]);
          return { layer, objs: [l, r] };
        }
        const h = layer.kind === 'horizon' ? layer.h : H;
        const o = this.add.tileSprite(0, 0, W, h, key).setOrigin(0, 0).setTileScale(ts, ts);
        root.add(o);
        return { layer, objs: [o] };
      });
      const objs = { root, layers, drift: 0 };
      this.envObjects.set(k, objs);
      return objs;
    }
    dropEnv(k, freeTextures = true) {
      const objs = this.envObjects.get(k);
      if (!objs) return;
      objs.root.destroy();
      this.envObjects.delete(k);
      if (!freeTextures) return;
      const keep = new Set([...this.envObjects.keys()].flatMap((j) => Art.envs[j].layers.map((l) => l.key)));
      for (const l of Art.envs[k].layers) if (!keep.has(l.key)) this.dropTex(l.key, BG_SCALE);
    }
    updateEnvironments(a, delta) {
      // Sky: a gradient that changes gradually with altitude.
      const [top, bottom] = Art.skyAt(a);
      if (top + bottom !== this.skyKey) {
        this.skyKey = top + bottom;
        this.sky.clear().fillGradientStyle(num(top), num(top), num(bottom), num(bottom), 1).fillRect(0, 0, this.W, this.H);
      }
      const still = calm();
      for (let k = 0; k < Art.envs.length; k++) {
        const w = this.envWeight(k, a);
        if (w <= 0.001) {
          // Keep the next environment ready; free ones far behind.
          if (this.envObjects.has(k) && (a > ENDS[k] + 4 || a < Art.envs[k].at - 6)) this.dropEnv(k);
          continue;
        }
        const objs = this.envObjects.get(k) ?? this.buildEnv(k);
        objs.root.setAlpha(w);
        if (!still) objs.drift += delta / 1000;
        const rise = Math.max(0, a - Art.envs[k].at) * GAP;
        for (const { layer, objs: os } of objs.layers) {
          const f = still ? layer.f * 0.5 : layer.f;
          if (layer.kind === 'horizon') { os[0].y = this.H - layer.h + rise * f; os[0].tilePositionX = (layer.drift || 0) * objs.drift * BG_SCALE; }
          else for (const o of os) {
            o.tilePositionY = -a * GAP * f * BG_SCALE;
            if (layer.kind === 'field') o.tilePositionX = (layer.drift || 0) * objs.drift * BG_SCALE;
          }
          if (layer.alpha !== undefined) for (const o of os) o.setAlpha(layer.alpha);
        }
      }
      // Pre-build the environment ahead so crossing a boundary never stalls.
      const ahead = envFor(Math.floor(a)) + 1;
      if (ahead < Art.envs.length && a > Art.envs[ahead].at - 5 && !this.envObjects.has(ahead)) this.buildEnv(ahead).root.setAlpha(0);
      this.updateBodies(a);
    }
    // Sun, a receding Earth, the moon (above, then below), and the destination star.
    updateBodies(a) {
      const { sun, earth, moon, star } = this.bodyImgs, W = this.W, H = this.H;
      const place = (img, x, y, s, alpha) => img.setPosition(x, y).setScale(s * img.baseScale).setAlpha(clamp(alpha, 0, 1));
      place(sun, W * 0.8, H * 0.2 + Math.max(0, a - 40) * 3, 1, this.envWeight(2, a));
      // Earth: a gentle curved horizon at 60 leaps, a planet by 80, a small blue world among the stars.
      // Keyframes: [altitude, scale, top of the planet (fraction of height), x (fraction of width)].
      const keys = [[60, 1.7, 0.86, 0.5], [80, 0.95, 0.62, 0.4], [100, 0.5, 0.64, 0.3], [150, 0.16, 0.76, 0.24]];
      let i = 0; while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
      const [a0, s0, t0, x0] = keys[i], [a1, s1, t1, x1] = keys[i + 1], u = smooth((a - a0) / (a1 - a0));
      const es = s0 + (s1 - s0) * u, radius = 218 * es;
      place(earth, W * (x0 + (x1 - x0) * u), H * (t0 + (t1 - t0) * u) + radius, es, smooth((a - 56) / 6) * 0.92);
      // Moon: grows overhead through near space, then drops away beneath.
      const approach = smooth((a - 78) / 22);
      const below = smooth((a - 99) / 2);
      if (a < 100) place(moon, W * 0.62, H * (0.26 - approach * 0.2), 0.25 + approach * 1.1, smooth((a - 76) / 6) * (1 - below));
      else place(moon, W * 0.66, H + 60 + (a - 100) * 5, Math.max(0.3, 1.4 - (a - 100) * 0.03), below);
      // The stars' destination: brightens as the final leaps approach.
      place(star, W * 0.5, H * 0.13, 0.3 + smooth((a - 120) / 30) * 0.6, smooth((a - 112) / 10) * 0.85 * (1 - smooth((a - 147) / 3)));
    }
    applyAmbient(force = false) {
      const k = envFor(Math.min(steps, TOTAL - 1)), spec = Art.envs[k].ambient, want = calm() || stats.quality === 'low' ? null : spec;
      const id = want ? want.kind : null;
      if (!force && this.ambient?.id === id) return;
      this.ambient?.root.destroy();
      this.ambient = null;
      if (!want) return;
      const root = this.add.container(this.W * (this.view - 1) / 2, this.H * (this.view - 1) / 2).setScrollFactor(0).setDepth(9);
      const zone = new Phaser.Geom.Rectangle(0, 0, this.W, this.H);
      const cfg = {
        firefly: { art: 'dot', lifespan: 4200, speed: { min: 6, max: 18 }, scale: { start: 0.9 / this.R, end: 0.5 / this.R }, alpha: { start: 0.85, end: 0 }, frequency: 650 },
        snow: { art: 'dot', lifespan: 6000, speedY: { min: 18, max: 36 }, speedX: { min: -8, max: 8 }, scale: { start: 0.55 / this.R, end: 0.4 / this.R }, alpha: { start: 0.9, end: 0 }, frequency: 480 },
        twinkle: { art: 'sparkle', lifespan: 1800, speed: 0, scale: { start: 0, end: 0.5 / this.R, ease: 'Sine.easeInOut', yoyo: true }, alpha: { start: 0.9, end: 0 }, frequency: 420 },
      }[want.kind];
      const { art, ...emitter } = cfg; // `texture` would be read by Phaser as a texture override
      const e = this.add.particles(0, 0, this.tex(art), { ...emitter, tint: want.tint, emitZone: { type: 'random', source: zone }, maxAliveParticles: want.count });
      root.add(e);
      this.ambient = { id, root, emitter: e };
    }

    // ---- sound ------------------------------------------------------------------------------
    sounds() {
      this.soundReady = new Set();
      try {
        const list = Object.entries(Art.sounds).map(([key, r]) => ({ key: 'sfx-' + key, data: Art.synth(r) }));
        this.sound.on('decodedall', () => list.forEach((s) => this.soundReady.add(s.key)));
        this.sound.on('decoded', (key) => this.soundReady.add(key));
        this.sound.decodeAudio(list);
      } catch (err) { console.warn('Letter Leaper sound unavailable', err); }
    }
    play(key, opts) {
      if (!prefs.sound || this.sound.locked || !this.soundReady.has('sfx-' + key)) return;
      this.sound.play('sfx-' + key, { volume: 0.7, ...opts });
    }

    // ---- game events -------------------------------------------------------------------------
    layout(snap) {
      this.syncPlatforms(false);
      this.camLevel = snap ? steps : this.camLevel;
      const p = this.standAt(steps);
      this.milo.root.setPosition(p.x, p.y).setScale(this.sizeScale);
      this.milo.setFacing(this.xFor(steps + 1) < p.x ? -1 : 1);
      this.milo.setSpace(steps >= 80 && steps < TOTAL + 1, true);
      this.flag.setScale(0);
      this.refreshCard();
      this.applyAmbient();
      this.updateEnvironments(this.camLevel, 0);
    }
    onGame(type, d) {
      switch (type) {
        case 'start': this.milo.reset(); this.layout(true); break;
        case 'home': this.milo.reset(); this.tweens.killTweensOf(this.cameras.main); this.cameras.main.setZoom(this.view); this.layout(true); break;
        case 'target': this.refreshCard(true); break;
        case 'typed':
          this.play(['correct', 'correct2', 'correct3'][Math.min(d.pos, 2)]);
          this.milo.nod();
          this.refreshCard();
          if (!calm()) { const l = this.card.letters[d.pos]; if (l) this.tweens.add({ targets: l, scale: 1.25, duration: 90, yoyo: true }); }
          break;
        case 'miss':
          this.play('mistake');
          this.milo.oops();
          this.milo.lookAt(Math.sign(this.card.x - this.milo.root.x), -0.8);
          this.refreshCard();
          if (!calm()) this.tweens.add({ targets: this.card, angle: { from: -4, to: 4 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => this.card.setAngle(0) });
          break;
        case 'timeout': this.play('timeout'); this.milo.shrug(); break;
        case 'jump': {
          this.play('takeoff');
          this.milo.setFacing(this.xFor(d.to) < this.xFor(d.from) ? -1 : 1);
          this.tweens.add({ targets: this.card, alpha: 0, duration: calm() ? 1 : 140 });
          const p = this.standAt(d.from);
          if (!calm()) this.dust.explode(3, p.x, p.y);
          break;
        }
        case 'land': {
          this.play('land');
          this.milo.landed();
          const p = this.standAt(d.leap);
          this.milo.root.setPosition(p.x, p.y);
          if (!calm()) {
            this.dust.explode(5, p.x, p.y);
            const plat = this.platforms.get(d.leap);
            if (plat) this.tweens.add({ targets: plat, y: plat.y + 5, duration: 90, yoyo: true, ease: 'Sine.easeOut' });
          }
          this.syncPlatforms(true);
          if (d.leap === 80) this.milo.setSpace(true);
          this.milo.setFacing(this.xFor(d.leap + 1) < p.x ? -1 : 1);
          this.applyAmbient();
          break;
        }
        case 'moon': this.tweens.killTweensOf(this.card); this.card.setAlpha(0); this.celebrate('moon'); break;
        case 'continue': this.milo.reset(); this.tweens.add({ targets: this.flag, scale: 0, duration: 200 }); this.refreshCard(true); break;
        case 'finish': this.card.setAlpha(0); this.celebrate(steps >= TOTAL ? 'stars' : 'moon'); break;
        case 'countdown': this.refreshCard(); break;
      }
    }
    // Short celebrations that never block input (the moon milestone is a
    // pause in the rules; the stars come after the session ends). The HTML
    // dialog's button skips straight on; calm mode keeps them small.
    celebrate(kind) {
      const p = this.standAt(steps), still = calm();
      if (kind === 'moon') {
        this.play('moon');
        this.milo.celebrateMoon();
        this.flag.setPosition(p.x + 34 * this.sizeScale, p.y).setScale(0);
        this.tweens.add({ targets: this.flag, scale: this.sizeScale / this.R, duration: still ? 1 : 420, delay: still ? 0 : 300, ease: 'Back.easeOut' });
      } else {
        this.play('stars');
        this.milo.celebrateStars();
      }
      if (still) return;
      this.sparkles.explode(kind === 'moon' ? 18 : 28, p.x, p.y - 50 * this.sizeScale);
      const cam = this.cameras.main;
      this.tweens.add({ targets: cam, zoom: this.view * 1.06, duration: 700, yoyo: true, hold: 900, ease: 'Sine.easeInOut' });
    }

    // Where the current platform sits on screen (fraction below centre). On
    // narrow screens the intro form fills the top, so Milo waits in the strip
    // reserved for him at the bottom.
    narrowIntro() { return state === 'intro' && this.W < 740; }
    frame() {
      if (this.narrowIntro()) return (this.H - 84) / this.H - 0.5;
      // Milestones: lift Milo into the open upper scene, clear of the milestone card.
      if (state === 'moon' || (state === 'finished' && steps >= MOON)) return -0.08;
      return 0.17;
    }

    // ---- per frame -----------------------------------------------------------------------------
    update(time, delta) {
      // Camera: follow the leap smoothly (calm: hold, then move at landing).
      const p = jumpProgress();
      const goal = steps + (jumping && !calm() ? smooth((p - 0.1) / 0.85) : 0);
      this.camLevel = calm() ? goal : this.camLevel + (goal - this.camLevel) * (1 - Math.exp(-delta / 140));
      if (Math.abs(goal - this.camLevel) < 0.001) this.camLevel = goal;
      this.cameras.main.centerOn(this.W / 2, this.yFor(this.camLevel) - this.H * this.frame());
      this.updateEnvironments(this.camLevel, delta);
      // Milo: anticipation, an arc, and the landing — all inside the rules' jump time.
      if (jumping) {
        const from = this.standAt(steps), to = this.standAt(steps + 1);
        const u = calm() ? p : smooth((p - 0.16) / 0.74);
        const arc = calm() ? 0 : Math.sin(clamp((p - 0.16) / 0.74, 0, 1) * Math.PI) * 70 * this.sizeScale;
        this.milo.root.setPosition(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u - arc);
      }
      this.milo.update(time, delta, jumping ? { p } : null);
      if (this.card.timer.visible && Number.isFinite(remaining)) {
        const total = (pace === 'steady' ? 8000 : 4000) * target.length;
        const f = clamp(remaining / total, 0, 1);
        this.card.timer.setSize(70 * f, 5);
        this.card.timer.fillColor = f < 0.3 ? 0xff9e6b : 0xf2c14e;
      }
      this.watchFrames(delta);
    }
    // Drop to 1× rendering and no ambient particles if frames are slow.
    watchFrames(delta) {
      if (stats.quality === 'low' || document.hidden) return;
      this.frameTimes.push(delta);
      if (this.frameTimes.length < 180) return;
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.frameTimes.length = 0;
      if (avg > 26 && this.view > 1) {
        stats.quality = 'low';
        this.applyView(1);
        this.applyAmbient(true);
      }
    }
  }

  const W = host.clientWidth, H = host.clientHeight, v = TEX_SCALE;
  const game = new Phaser.Game({
    type: Phaser.WEBGL, parent: host, width: Math.round(W * v), height: Math.round(H * v), backgroundColor: '#0b211f',
    banner: false, antialias: true, scale: { mode: Phaser.Scale.NONE, zoom: 1 / v }, scene: LeaperScene,
    render: { powerPreference: 'low-power' }, fps: { target: 60 },
  });
  game.events.once('ready', () => {
    host.prepend(game.canvas);
    game.canvas.setAttribute('aria-hidden', 'true');
    game.canvas.classList.add('leaper-canvas');
  });
  window.__leaperGame = game;
})();
