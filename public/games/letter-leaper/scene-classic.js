'use strict';
// The original DOM scene (platform divs and the emoji Milo), kept for
// side-by-side comparison (?renderer=classic) and as the fallback when WebGL
// or Phaser isn't available. It only draws what core.js decides.
(() => {
  const positions = [.65, .39, .66, .32, .60, .37, .67];
  const GAP = 118;
  let audio;
  const xFor = n => positions[n % positions.length] * $('scene').clientWidth;
  const yFor = (n, cam) => $('scene').clientHeight - 105 - n * GAP + cam;
  function tone(ok) {
    if (!prefs.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const o = audio.createOscillator(), g = audio.createGain();
      o.connect(g); g.connect(audio.destination); o.type = 'sine';
      o.frequency.setValueAtTime(ok ? 540 : 160, audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(ok ? 880 : 110, audio.currentTime + .13);
      g.gain.setValueAtTime(.06, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .2);
      o.start(); o.stop(audio.currentTime + .21);
    } catch {}
  }
  function targetMarkup() {
    return [...target].map((c, i) => `<span class="${i < typed ? 'typed' : i === typed ? 'next-letter' : ''}">${letterCase(c)}</span>`).join('');
  }
  function draw() {
    // Only a leap moves Milo; a fall (medium and hard) isn't drawn here.
    const leaping = jumping && !fallKind;
    const e = leaping ? (t => t * t * (3 - 2 * t))(jumpProgress()) : 0;
    const cam = (steps + e) * GAP;
    const world = $('world');
    world.replaceChildren();
    let first = Math.max(0, steps - 2), last = Math.min(TOTAL, steps + 3);
    if (state === 'intro') { first = 0; last = 2; }
    for (let n = first; n <= last; n++) {
      const p = document.createElement('div');
      p.className = 'platform' + (n === steps + 1 ? ' target' : '');
      p.style.left = xFor(n) + 'px'; p.style.top = yFor(n, cam) + 'px'; p.style.opacity = n > steps + 1 ? '.35' : '1';
      if (n === steps + 1 && steps < TOTAL) {
        const l = document.createElement('div');
        l.className = 'letter';
        l.classList.toggle('word', target.length > 1 && state !== 'intro');
        l.innerHTML = state === 'intro' ? 'a' : targetMarkup();
        if (state === 'playing' && !jumping) {
          const s = document.createElement('small');
          s.textContent = falls ? Math.ceil(deadlineLeft() / 1000) + ' SECONDS' : 'TYPE TO LEAP';
          l.append(s);
        }
        p.append(l);
      }
      world.append(p);
    }
    const t = leaping ? jumpProgress() : 0;
    const x = leaping ? xFor(steps) + (xFor(steps + 1) - xFor(steps)) * e : xFor(steps);
    const y = leaping ? yFor(steps, cam) + (yFor(steps + 1, cam) - yFor(steps, cam)) * e - Math.sin(t * Math.PI) * 110 : yFor(steps, cam);
    $('monkey').style.left = x + 'px'; $('monkey').style.top = y + 'px';
  }
  views.push((type) => {
    if (type === 'typed') tone(true);
    if (type === 'miss' || type === 'fall') tone(false);
    if (type === 'miss' || type === 'fall') { $('monkey').classList.remove('shake'); void $('monkey').offsetWidth; $('monkey').classList.add('shake'); }
    draw();
  });
  (function loop() { if (jumping) draw(); requestAnimationFrame(loop); })();
  window.addEventListener('resize', draw);
  prefs.on(draw);
  draw();
})();
