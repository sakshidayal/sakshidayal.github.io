// Interactive damped double-well demo, matching the bistability model from
// the thesis: PE(x) = (x-1)^2 for x>=0, (x+1)^2 for x<0 — two wells at
// x=-1 and x=+1 separated by a barrier at x=0.

const svg = document.getElementById('wellSvg');
const curve = document.getElementById('wellCurve');
const ball = document.getElementById('wellBall');
const readout = document.getElementById('wellReadout');

const X_MIN = -2.2, X_MAX = 2.2;
const svgX = (x) => 220 + x * 80;
const svgY = (pe) => 190 - pe * 100;

function potential(x) {
  return x >= 0 ? (x - 1) ** 2 : (x + 1) ** 2;
}

// draw the curve once
(function drawCurve() {
  let d = '';
  for (let x = X_MIN; x <= X_MAX + 1e-9; x += 0.02) {
    const cmd = x === X_MIN ? 'M' : 'L';
    d += `${cmd}${svgX(x).toFixed(1)},${svgY(potential(x)).toFixed(1)} `;
  }
  curve.setAttribute('d', d.trim());
})();

let x = -1, v = 0;
let rafId = null;
let lastT = null;
let settleFrames = 0;

function placeBall() {
  ball.setAttribute('cx', svgX(x));
  ball.setAttribute('cy', svgY(potential(x)) - 2);
}
placeBall();

function step(t) {
  if (lastT === null) lastT = t;
  const dt = Math.min((t - lastT) / 1000, 0.032);
  lastT = t;

  const k = 2, c = 2.7;
  const eq = x >= 0 ? 1 : -1;
  const a = -k * (x - eq) - c * v;
  v += a * dt;
  x += v * dt;
  x = Math.max(X_MIN, Math.min(X_MAX, x));

  placeBall();

  if (Math.abs(v) < 0.035 && Math.abs(a) < 0.07) {
    settleFrames++;
  } else {
    settleFrames = 0;
  }

  if (settleFrames > 10) {
    const well = x >= 0 ? 'RIGHT' : 'LEFT';
    readout.textContent = `Settled into the ${well} well (x ≈ ${x.toFixed(2)}).`;
    rafId = null;
    return;
  }
  rafId = requestAnimationFrame(step);
}

function release(startX, jitter = false) {
  x = startX;
  v = jitter ? (Math.random() - 0.5) * 0.1 : 0;
  lastT = null;
  settleFrames = 0;
  readout.textContent = 'Rolling…';
  placeBall();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(step);
}

svg.addEventListener('click', (e) => {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
  const clickedX = Math.max(X_MIN, Math.min(X_MAX, (svgPt.x - 220) / 80));
  release(clickedX, Math.abs(clickedX) < 0.05);
});

document.getElementById('wellLeft').addEventListener('click', () => release(-1.8));
document.getElementById('wellRight').addEventListener('click', () => release(1.8));
document.getElementById('wellCenter').addEventListener('click', () => release(0, true));
