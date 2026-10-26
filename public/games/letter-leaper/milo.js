'use strict';
// Milo: a layered character rig (Phaser containers + images drawn in art.js).
// The scene tells Milo what is happening in the game; Milo only animates.
//
//   root (position on the platform, overall size)
//   └ rig (pivot at the feet: squash, stretch, facing)
//     ├ tail ×7 (behind)   ├ legs   ├ body   ├ arms
//     └ head (ears, face, eyes + pupils + lids, mouth) + helmet
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by scene-phaser.js (shared script scope)
class Milo {
  constructor(scene, tex, calm) {
    this.scene = scene;
    this.calm = calm; // () => boolean
    const img = (part, x, y, ox = 0.5, oy = 0.5) => scene.add.image(x, y, tex('milo-' + part)).setOrigin(ox, oy).setScale(1 / scene.R);
    this.root = scene.add.container(0, 0);
    this.rig = scene.add.container(0, 0);
    this.tail = Array.from({ length: 7 }, (_, i) => img('tail', 0, 0).setScale((1 - i * 0.06) / scene.R));
    this.legL = img('leg', -9, -25, 0.5, 0.05);
    this.legR = img('leg', 9, -25, 0.5, 0.05);
    this.body = img('body', 0, -42);
    this.armL = img('arm', -18, -57, 0.5, 0.07);
    this.armR = img('arm', 18, -57, 0.5, 0.07);
    this.earL = img('ear', -27, -10); this.earR = img('ear', 27, -10);
    this.headImg = img('head', 0, 0);
    this.eyeL = img('eye', -9, -3); this.eyeR = img('eye', 9, -3);
    this.pupilL = img('pupil', -9, -2); this.pupilR = img('pupil', 9, -2);
    this.lidL = img('lid', -9, -11, 0.5, 0).setScale(1 / scene.R, 0); this.lidR = img('lid', 9, -11, 0.5, 0).setScale(1 / scene.R, 0);
    this.mouth = img('mouth-smile', 0, 17);
    this.head = scene.add.container(0, -78, [this.earL, this.earR, this.headImg, this.eyeL, this.eyeR, this.pupilL, this.pupilR, this.lidL, this.lidR, this.mouth]);
    this.helmet = img('helmet', 0, -76).setAlpha(0);
    this.rig.add([...this.tail.slice().reverse(), this.legL, this.legR, this.body, this.armL, this.armR, this.head, this.helmet]);
    this.root.add(this.rig);
    this.tex = tex;
    this.facing = 1;
    this.squash = { x: 1, y: 1 };
    this.pose = 'idle';
    this.look = { x: 0, y: 0 };
    this.blinkAt = 1200;
    this.glanceAt = 4000;
    this.reaction = null;
  }
  setFace(mouth) { this.mouth.setTexture(this.tex('milo-mouth-' + mouth)); }
  setFacing(dir) { this.facing = dir < 0 ? -1 : 1; }
  setSpace(on, instant = false) {
    const alpha = on ? 1 : 0;
    if (instant || this.calm()) { this.helmet.setAlpha(alpha); return; }
    this.scene.tweens.add({ targets: this.helmet, alpha, duration: 900, ease: 'Sine.easeInOut' });
  }
  // Called every frame by the scene. `jump` = { p } while leaping, else null.
  update(time, delta, jump) {
    const t = time / 1000, calm = this.calm();
    let sx = 1, sy = 1, armL = 0.18, armR = -0.18, legTuck = 1, tailLift = 0, bob = 0;
    if (jump) {
      const p = jump.p;
      if (p < 0.16) { const k = p / 0.16; sx = 1 + 0.12 * k; sy = 1 - 0.16 * k; armL = 0.6; armR = -0.6; }
      else if (p < 0.32) { const k = (p - 0.16) / 0.16; sx = 1.12 - 0.22 * k; sy = 0.84 + 0.3 * k; armL = 0.6 - 3.4 * k; armR = -0.6 + 3.4 * k; tailLift = -0.6; }
      else if (p < 0.84) { sx = 0.95; sy = 1.06; armL = -2.4; armR = 2.4; legTuck = 0.78; tailLift = -0.9; }
      else { const k = (p - 0.84) / 0.16; sx = 0.95 + 0.05 * k; sy = 1.06 - 0.06 * k; armL = -2.4 + 1.9 * k; armR = 2.4 - 1.9 * k; legTuck = 0.78 + 0.22 * k; }
      if (calm) { sx = 1; sy = 1; }
    } else {
      bob = Math.sin(t * Math.PI * 2 / 2.6) * (calm ? 0.6 : 1.2);
      sy = 1 + Math.sin(t * Math.PI * 2 / 2.6) * 0.018;
      armL = 0.18 + Math.sin(t * 1.3) * 0.05; armR = -0.18 - Math.sin(t * 1.3 + 0.6) * 0.05;
    }
    if (this.reaction) ({ armL, armR } = this.reaction.arms?.(armL, armR) ?? { armL, armR });
    this.rig.scaleX = sx * this.squash.x * this.facing;
    this.rig.scaleY = sy * this.squash.y;
    this.body.y = -42 + bob * 0.4;
    this.head.y = -78 + bob;
    this.armL.rotation = armL; this.armR.rotation = armR;
    this.legL.scaleY = this.legR.scaleY = legTuck / this.scene.R;
    // Tail: a curl that sways, trails behind during a leap, and lags a little.
    const sway = calm ? 0.12 : 0.28;
    let x = -14, y = -32, a = 2.5 + tailLift;
    for (let i = 0; i < this.tail.length; i++) {
      a -= 0.42 + Math.sin(t * 1.9 - i * 0.55) * sway * (i / this.tail.length);
      x += Math.cos(a) * 6.2; y += Math.sin(a) * 6.2;
      this.tail[i].setPosition(x, y);
    }
    // Blinks and curious glances.
    if (time > this.blinkAt) { this.blink(); this.blinkAt = time + 2200 + Math.random() * 2800; }
    if (!jump && !this.reaction && time > this.glanceAt) { this.glance(); this.glanceAt = time + 5000 + Math.random() * 4000; }
    this.pupilL.setPosition(-9 + this.look.x * 2.4, -2 + this.look.y * 2.4);
    this.pupilR.setPosition(9 + this.look.x * 2.4, -2 + this.look.y * 2.4);
  }
  blink() {
    const lids = [this.lidL, this.lidR], R = this.scene.R;
    this.scene.tweens.add({ targets: lids, scaleY: 1 / R, duration: 70, yoyo: true, hold: 40, ease: 'Sine.easeInOut',
      onComplete: () => { if (Math.random() < 0.2) this.scene.time.delayedCall(140, () => this.scene.tweens.add({ targets: lids, scaleY: 1 / R, duration: 60, yoyo: true })); } });
  }
  glance() {
    const look = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0.6, y: -1 }, { x: -0.6, y: -0.6 }][Math.floor(Math.random() * 4)];
    this.scene.tweens.add({ targets: this.look, ...look, duration: 260, yoyo: true, hold: 900, ease: 'Sine.easeInOut' });
    if (!this.calm()) this.scene.tweens.add({ targets: this.head, rotation: look.x * 0.09, duration: 300, yoyo: true, hold: 850, ease: 'Sine.easeInOut' });
  }
  lookAt(dx, dy) { this.scene.tweens.add({ targets: this.look, x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)), duration: 160 }); }
  react(kind, ms) {
    this.reaction = kind;
    this.scene.time.delayedCall(ms, () => { if (this.reaction === kind) { this.reaction = null; this.setFace('smile'); this.head.rotation = 0; } });
  }
  // A correct letter: a quick, happy nod.
  nod() {
    this.setFace('smile');
    if (!this.calm()) this.scene.tweens.add({ targets: this.head, y: '+=3', duration: 70, yoyo: true, ease: 'Sine.easeOut' });
  }
  // A wrong key: a curious "hmm, let's try that again" — never a flinch.
  oops() {
    this.setFace('oh');
    this.scene.time.delayedCall(260, () => { if (this.reaction?.name === 'oops') this.setFace('hmm'); });
    const reaction = { name: 'oops', arms: (l) => ({ armL: l, armR: 2.2 }) }; // a thinking scratch of the head
    this.react(reaction, 700);
    this.scene.tweens.add({ targets: this.head, rotation: -0.16, duration: 160, yoyo: true, hold: 360, ease: 'Sine.easeInOut' });
  }
  // A timeout: a friendly shrug, then on to a fresh target.
  shrug() {
    this.setFace('hmm');
    this.react({ name: 'shrug', arms: () => ({ armL: 1.2, armR: -1.2 }) }, 600);
    if (!this.calm()) this.scene.tweens.add({ targets: this.rig, y: -3, duration: 150, yoyo: true, hold: 200 });
  }
  landed() {
    this.setFace('smile');
    if (this.calm()) return;
    this.squash.x = 1.16; this.squash.y = 0.82;
    this.scene.tweens.add({ targets: this.squash, x: 1, y: 1, duration: 280, ease: 'Back.easeOut' });
  }
  cheer(times = 2) {
    this.setFace('open');
    this.react({ name: 'cheer', arms: () => ({ armL: -2.6, armR: 2.6 }) }, 380 * times + 200);
    if (!this.calm()) this.scene.tweens.add({ targets: this.rig, y: -18, duration: 190, yoyo: true, repeat: times - 1, ease: 'Sine.easeOut' });
  }
  // Moon: a big double hop with arms up. Stars: arms wide, floating gently.
  celebrateMoon() { this.cheer(this.calm() ? 1 : 3); }
  celebrateStars() {
    this.setFace('open');
    this.react({ name: 'stars', arms: () => ({ armL: -1.9, armR: 1.9 }) }, 100000);
    if (!this.calm()) this.scene.tweens.add({ targets: this.rig, y: -10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  reset() {
    this.scene.tweens.killTweensOf([this.rig, this.head]);
    this.rig.y = 0; this.head.rotation = 0; this.reaction = null; this.squash.x = this.squash.y = 1; this.setFace('smile');
  }
}
