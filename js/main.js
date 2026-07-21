document.getElementById('year').textContent = new Date().getFullYear();

// ---------- scroll reveal ----------
const revealTargets = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealTargets.forEach((el) => observer.observe(el));

// ---------- persistent background: clouds + birds ----------
// Fixed to the viewport (see .nature-bg, z-index:-1) so this scenery is
// always present behind whatever section you're reading, never on top of it.
const natureBg = document.getElementById('natureBg');

const CLOUD_COUNT = 7;
for (let i = 0; i < CLOUD_COUNT; i++) {
  const cloud = document.createElement('div');
  cloud.className = 'cloud';
  const w = 70 + Math.random() * 90;
  const h = w * 0.36;
  cloud.style.width = `${w}px`;
  cloud.style.height = `${h}px`;
  cloud.style.top = `${5 + Math.random() * 70}%`;
  const duration = 50 + Math.random() * 50;
  cloud.style.animationDuration = `${duration}s`;
  cloud.style.animationDelay = `${-Math.random() * duration}s`;
  natureBg.appendChild(cloud);
}

// side profile, facing right (direction of flight): body + head + beak + tail,
// with a separate wing shape that rotates independently for the flap.
const birdSvg = `<svg width="34" height="22" viewBox="0 0 34 22">
  <path d="M4 15 L9 12.5 L4.5 11.5 Z" fill="#7d7189" opacity="0.8"/>
  <ellipse cx="16" cy="13" rx="10" ry="4.6" fill="#7d7189" opacity="0.8"/>
  <circle cx="26" cy="9.5" r="3" fill="#7d7189" opacity="0.8"/>
  <path d="M28.6 9 L33 8.3 L28.8 10.4 Z" fill="#7d7189" opacity="0.8"/>
  <path class="wing" d="M18 11 Q13 -1 5 3 Q13 6 20 13 Z" fill="#7d7189" opacity="0.85"/>
</svg>`;
const BIRD_COUNT = 4;
for (let i = 0; i < BIRD_COUNT; i++) {
  const bird = document.createElement('div');
  bird.className = 'bird';
  bird.innerHTML = birdSvg;
  bird.style.top = `${8 + Math.random() * 35}%`;
  const duration = 15 + Math.random() * 8;
  bird.style.animationDuration = `${duration}s`;
  // stagger so the first bird crosses within a few seconds, not up to 40s later
  bird.style.animationDelay = `${i * 4 + Math.random() * 3}s`;
  natureBg.appendChild(bird);
}

// ---------- generative old-soul instrumental ----------
// Not a real recording (no rights-clear way to embed one here) — a small
// self-composed Rhodes-style chord loop with soft bass and vinyl crackle,
// synthesized entirely in the browser.
let audioCtx = null;
let ambientNodes = null;
let loopTimer = null;
let playing = false;

const toggleBtn = document.getElementById('musicToggle');
const icon = document.getElementById('musicIcon');

// ii - V - I - vi, voiced low and warm
const CHORDS = [
  { root: 73.42, tones: [220.00, 261.63, 329.63, 392.00] },  // Dm7  (D2 bass)
  { root: 98.00, tones: [246.94, 293.66, 349.23, 440.00] },  // G7   (G2 bass)
  { root: 65.41, tones: [196.00, 246.94, 293.66, 369.99] },  // Cmaj7 (C2 bass)
  { root: 55.00, tones: [164.81, 196.00, 246.94, 329.63] },  // Am7  (A1 bass)
];
const CHORD_SECONDS = 3.6;

function buildNoiseBuffer(ctx, seconds) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function rhodesTone(ctx, dest, freq, start, dur, level) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.detune.value = 6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + 0.25);
  gain.gain.exponentialRampToValueAtTime(Math.max(level * 0.25, 0.0005), start + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.frequency.value = freq;
  osc2.frequency.value = freq;
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);
  osc.start(start); osc.stop(start + dur + 0.05);
  osc2.start(start); osc2.stop(start + dur + 0.05);
}

function startAmbient() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const ctx = audioCtx;

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 2);

  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 2200;
  warmth.connect(master);

  // vinyl crackle bed: filtered hiss + occasional soft pops
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.05;
  crackleGain.connect(master);
  const hiss = ctx.createBufferSource();
  hiss.buffer = buildNoiseBuffer(ctx, 3);
  hiss.loop = true;
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 3500;
  hiss.connect(hissFilter);
  hissFilter.connect(crackleGain);
  hiss.start();

  let popTimer;
  function pop() {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buildNoiseBuffer(ctx, 0.03);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(g);
    g.connect(master);
    src.start(t);
    popTimer = setTimeout(pop, 300 + Math.random() * 900);
  }
  popTimer = setTimeout(pop, 200);

  ambientNodes = { master, hiss, popTimer: () => popTimer };

  let chordIndex = 0;
  function playChord() {
    const t = ctx.currentTime;
    const chord = CHORDS[chordIndex % CHORDS.length];
    // soft plucked bass root
    rhodesTone(ctx, warmth, chord.root, t, CHORD_SECONDS * 0.9, 0.09);
    // warm upper voicing
    chord.tones.forEach((freq, i) => {
      rhodesTone(ctx, warmth, freq, t + 0.02 * i, CHORD_SECONDS, 0.045);
    });
    chordIndex++;
    loopTimer = setTimeout(playChord, CHORD_SECONDS * 1000);
  }
  playChord();
}

function stopAmbient() {
  if (!audioCtx || !ambientNodes) return;
  const ctx = audioCtx;
  const { master, hiss } = ambientNodes;
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
  clearTimeout(loopTimer);
  clearTimeout(ambientNodes.popTimer());
  setTimeout(() => { hiss.stop(); }, 1100);
  ambientNodes = null;
}

toggleBtn.addEventListener('click', () => {
  playing = !playing;
  if (playing) {
    startAmbient();
    icon.textContent = '⏸';
    toggleBtn.classList.add('playing');
    toggleBtn.setAttribute('aria-label', 'Pause instrumental');
    toggleBtn.title = 'Pause instrumental';
  } else {
    stopAmbient();
    icon.textContent = '🎵';
    toggleBtn.classList.remove('playing');
    toggleBtn.setAttribute('aria-label', 'Play instrumental');
    toggleBtn.title = 'Play instrumental';
  }
});
