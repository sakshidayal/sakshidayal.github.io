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

const birdSvg = `<svg width="26" height="14" viewBox="0 0 26 14"><path d="M0 7 Q6 -3 13 6 Q20 -3 26 7 Q20 3 13 8 Q6 3 0 7Z" fill="#8a7f96" opacity="0.6"/></svg>`;
const BIRD_COUNT = 3;
for (let i = 0; i < BIRD_COUNT; i++) {
  const bird = document.createElement('div');
  bird.className = 'bird';
  bird.innerHTML = birdSvg;
  bird.style.top = `${8 + Math.random() * 35}%`;
  const duration = 22 + Math.random() * 14;
  bird.style.animationDuration = `${duration}s`;
  bird.style.animationDelay = `${Math.random() * 40}s`;
  natureBg.appendChild(bird);
}

// ---------- ambient nature soundscape: soft breeze + birdsong ----------
let audioCtx = null;
let ambientNodes = null;
let chirpTimer = null;
let playing = false;

const toggleBtn = document.getElementById('musicToggle');
const icon = document.getElementById('musicIcon');

function buildNoiseBuffer(ctx) {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startAmbient() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const ctx = audioCtx;

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);

  // soft breeze: filtered noise loop, gently wandering
  const noise = ctx.createBufferSource();
  noise.buffer = buildNoiseBuffer(ctx);
  noise.loop = true;
  const breezeFilter = ctx.createBiquadFilter();
  breezeFilter.type = 'bandpass';
  breezeFilter.frequency.value = 700;
  breezeFilter.Q.value = 0.6;
  const breezeLfo = ctx.createOscillator();
  breezeLfo.frequency.value = 0.06;
  const breezeLfoGain = ctx.createGain();
  breezeLfoGain.gain.value = 260;
  breezeLfo.connect(breezeLfoGain);
  breezeLfoGain.connect(breezeFilter.frequency);
  const breezeGain = ctx.createGain();
  breezeGain.gain.value = 0.35;
  noise.connect(breezeFilter);
  breezeFilter.connect(breezeGain);
  breezeGain.connect(master);
  noise.start();
  breezeLfo.start();

  const chirpBus = ctx.createGain();
  chirpBus.gain.value = 1;
  chirpBus.connect(master);

  ambientNodes = { master, noise, breezeLfo, chirpBus };

  function chirp() {
    const now = audioCtx.currentTime;
    const base = 2400 + Math.random() * 1400;
    const notes = 1 + Math.floor(Math.random() * 3);
    let t = now;
    for (let n = 0; n < notes; n++) {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      const gain = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      const freq = base * (1 + (Math.random() - 0.5) * 0.3);
      osc.frequency.setValueAtTime(freq * 0.7, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.13);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain);
      if (pan) {
        pan.pan.value = Math.random() * 1.6 - 0.8;
        gain.connect(pan);
        pan.connect(chirpBus);
      } else {
        gain.connect(chirpBus);
      }
      osc.start(t);
      osc.stop(t + 0.2);
      t += 0.14 + Math.random() * 0.08;
    }
    chirpTimer = setTimeout(chirp, 2500 + Math.random() * 5500);
  }
  chirpTimer = setTimeout(chirp, 1200);
}

function stopAmbient() {
  if (!audioCtx || !ambientNodes) return;
  const ctx = audioCtx;
  const { master, noise, breezeLfo } = ambientNodes;
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
  clearTimeout(chirpTimer);
  setTimeout(() => {
    noise.stop();
    breezeLfo.stop();
  }, 1100);
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
