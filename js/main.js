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

// ---------- falling petals ----------
const petalLayer = document.getElementById('petals');
const PETAL_COUNT = 14;
for (let i = 0; i < PETAL_COUNT; i++) {
  const petal = document.createElement('div');
  petal.className = 'petal';
  const size = 8 + Math.random() * 10;
  petal.style.width = `${size}px`;
  petal.style.height = `${size}px`;
  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.background = ['#f4c6d0', '#bfe3cc', '#d9cdf0', '#fbe3ad'][i % 4];
  const duration = 14 + Math.random() * 16;
  petal.style.animationDuration = `${duration}s`;
  petal.style.animationDelay = `${-Math.random() * duration}s`;
  petalLayer.appendChild(petal);
}

// ---------- ambient generative soundscape ----------
let audioCtx = null;
let ambientNodes = null;
let chimeTimer = null;
let playing = false;

const toggleBtn = document.getElementById('musicToggle');
const icon = document.getElementById('musicIcon');

function buildReverbImpulse(ctx, seconds = 3, decay = 3) {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function startAmbient() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const ctx = audioCtx;

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);

  const reverb = ctx.createConvolver();
  reverb.buffer = buildReverbImpulse(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.5;
  reverb.connect(reverbGain);
  reverbGain.connect(master);

  const dry = ctx.createGain();
  dry.gain.value = 0.5;
  dry.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(dry);
  filter.connect(reverb);

  // soft detuned pad, pentatonic-ish stack
  const freqs = [196.0, 246.94, 293.66, 392.0];
  const oscillators = freqs.map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.02;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = f * 0.003;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(filter);
    osc.start();
    lfo.start();
    return { osc, lfo, gain };
  });

  ambientNodes = { master, oscillators, reverb, filter };

  // occasional soft chime plinks, pentatonic scale
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  function chime() {
    const now = ctx.currentTime;
    const note = scale[Math.floor(Math.random() * scale.length)];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = note;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.connect(gain);
    if (pan) {
      pan.pan.value = Math.random() * 1.6 - 0.8;
      gain.connect(pan);
      pan.connect(reverb);
    } else {
      gain.connect(reverb);
    }
    osc.start(now);
    osc.stop(now + 2.5);
    chimeTimer = setTimeout(chime, 3000 + Math.random() * 5000);
  }
  chimeTimer = setTimeout(chime, 1500);
}

function stopAmbient() {
  if (!audioCtx || !ambientNodes) return;
  const ctx = audioCtx;
  const { master, oscillators } = ambientNodes;
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
  clearTimeout(chimeTimer);
  setTimeout(() => {
    oscillators.forEach(({ osc, lfo }) => { osc.stop(); lfo.stop(); });
  }, 1300);
  ambientNodes = null;
}

toggleBtn.addEventListener('click', () => {
  playing = !playing;
  if (playing) {
    startAmbient();
    icon.textContent = '⏸';
    toggleBtn.classList.add('playing');
    toggleBtn.setAttribute('aria-label', 'Pause ambient sound');
    toggleBtn.title = 'Pause ambient sound';
  } else {
    stopAmbient();
    icon.textContent = '🎵';
    toggleBtn.classList.remove('playing');
    toggleBtn.setAttribute('aria-label', 'Play ambient sound');
    toggleBtn.title = 'Play ambient sound';
  }
});
