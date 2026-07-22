// Three small, always-moving illustrations for the bistable mechanisms
// thesis page. Nothing here requires a click — everything runs on its own.

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/* ---------------------------------------------------------------------
   1) WALKER — a real four-bar linkage + coupler point, traced and driven
   --------------------------------------------------------------------- */
(function walker() {
  const svg = document.getElementById('walkerSvg');
  if (!svg) return;

  function circleIntersect(p0, r0, p1, r1, sign) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const d = Math.hypot(dx, dy);
    if (d > r0 + r1 || d < Math.abs(r0 - r1) || d === 0) return null;
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
    return {
      x: p0.x + a * dx / d + sign * h * dy / d,
      y: p0.y + a * dy / d - sign * h * dx / d,
    };
  }

  const O1 = { x: 0, y: 0 };
  const O2 = { x: 80, y: 0 };
  const r1 = 20, r2 = 100, r3 = 110, AP = 130, BP = 70;

  function solve(theta) {
    const A = { x: O1.x + r1 * Math.cos(theta), y: O1.y + r1 * Math.sin(theta) };
    const B = circleIntersect(A, r2, O2, r3, -1);
    const P = B && circleIntersect(A, AP, B, BP, -1);
    return { A, B, P };
  }

  // sample the full path to size the viewBox and draw the guide curve
  const N = 240;
  const samples = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < N; i++) {
    const { P } = solve((i / N) * Math.PI * 2);
    samples.push(P);
    minX = Math.min(minX, P.x, O1.x, O2.x);
    maxX = Math.max(maxX, P.x, O1.x, O2.x);
    minY = Math.min(minY, P.y, O1.y, O2.y);
    maxY = Math.max(maxY, P.y, O1.y, O2.y);
  }
  const pad = 20;
  const vbX = minX - pad, vbY = minY - pad;
  const vbW = (maxX - minX) + pad * 2, vbH = (maxY - minY) + pad * 2;
  svg.setAttribute('viewBox', `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);

  let d = '';
  samples.forEach((p, i) => { d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} `; });
  d += 'Z';
  svg.appendChild(el('path', { d, fill: 'none', stroke: '#d9cdf0', 'stroke-width': 2.5, 'stroke-dasharray': '1 6', 'stroke-linecap': 'round' }));

  // fixed pivots
  svg.appendChild(el('circle', { cx: O1.x, cy: O1.y, r: 4, fill: '#8a7f96' }));
  svg.appendChild(el('circle', { cx: O2.x, cy: O2.y, r: 4, fill: '#8a7f96' }));

  const crank = el('line', { stroke: '#e39aab', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const coupler = el('line', { stroke: '#8fc9a6', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const rocker = el('line', { stroke: '#b9a4e0', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const braceA = el('line', { stroke: '#c9a8b4', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 });
  const braceB = el('line', { stroke: '#c9a8b4', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 });
  const jointA = el('circle', { r: 3.5, fill: '#5b5468' });
  const jointB = el('circle', { r: 3.5, fill: '#5b5468' });
  [braceA, braceB, crank, coupler, rocker, jointA, jointB].forEach((n) => svg.appendChild(n));

  const feet = [0, 0.33, 0.66].map((phase, i) =>
    el('circle', { r: i === 0 ? 6 : 4, fill: '#e39aab', opacity: i === 0 ? 1 : 0.4 })
  );
  feet.forEach((f) => svg.appendChild(f));

  let theta = 0;
  function frame() {
    theta += 0.018;
    const { A, B, P } = solve(theta);
    crank.setAttribute('x1', O1.x); crank.setAttribute('y1', O1.y);
    crank.setAttribute('x2', A.x); crank.setAttribute('y2', A.y);
    coupler.setAttribute('x1', A.x); coupler.setAttribute('y1', A.y);
    coupler.setAttribute('x2', B.x); coupler.setAttribute('y2', B.y);
    rocker.setAttribute('x1', O2.x); rocker.setAttribute('y1', O2.y);
    rocker.setAttribute('x2', B.x); rocker.setAttribute('y2', B.y);
    braceA.setAttribute('x1', A.x); braceA.setAttribute('y1', A.y);
    braceA.setAttribute('x2', P.x); braceA.setAttribute('y2', P.y);
    braceB.setAttribute('x1', B.x); braceB.setAttribute('y1', B.y);
    braceB.setAttribute('x2', P.x); braceB.setAttribute('y2', P.y);
    jointA.setAttribute('cx', A.x); jointA.setAttribute('cy', A.y);
    jointB.setAttribute('cx', B.x); jointB.setAttribute('cy', B.y);

    feet.forEach((f, i) => {
      const phase = [0, 0.33, 0.66][i];
      const idx = Math.floor(((theta / (Math.PI * 2) + phase) % 1) * N + N) % N;
      const p = samples[idx];
      f.setAttribute('cx', p.x);
      f.setAttribute('cy', p.y);
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------------------------------------------------------------------
   shared: a small seesaw/rocker that damps toward an alternating target
   --------------------------------------------------------------------- */
function makeSeesaw(svg, { cx, cy, armLen, thetaMaxDeg, period, colorA, colorB, label }) {
  const g = el('g', {});
  svg.appendChild(g);

  const post = el('line', { x1: cx, y1: cy, x2: cx, y2: cy + 22, stroke: '#8a7f96', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const bar = el('line', { stroke: '#5b5468', 'stroke-width': 5, 'stroke-linecap': 'round' });
  const weightL = el('circle', { r: 8, fill: colorA });
  const weightR = el('circle', { r: 8, fill: colorB });
  g.appendChild(post); g.appendChild(bar); g.appendChild(weightL); g.appendChild(weightR);

  if (label) {
    const t = el('text', { x: cx, y: cy - armLen - 14, 'text-anchor': 'middle', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700, 'font-size': 15, fill: '#5b5468' });
    t.textContent = label;
    g.appendChild(t);
  }

  const thetaMax = (thetaMaxDeg * Math.PI) / 180;
  let angle = -thetaMax, vel = 0, target = -thetaMax, timer = 0;

  function step(dt) {
    timer += dt;
    if (timer > period) { timer = 0; target = target > 0 ? -thetaMax : thetaMax; }
    const k = 9, c = 5;
    const a = k * (target - angle) - c * vel;
    vel += a * dt;
    angle += vel * dt;

    const dx = Math.cos(angle) * armLen, dy = Math.sin(angle) * armLen;
    bar.setAttribute('x1', cx - dx); bar.setAttribute('y1', cy - dy);
    bar.setAttribute('x2', cx + dx); bar.setAttribute('y2', cy + dy);
    weightL.setAttribute('cx', cx - dx); weightL.setAttribute('cy', cy - dy);
    weightR.setAttribute('cx', cx + dx); weightR.setAttribute('cy', cy + dy);
  }

  // 0 = fully at -thetaMax, 1 = fully at +thetaMax
  function value() { return (angle / thetaMax + 1) / 2; }

  return { step, value };
}

/* ---------------------------------------------------------------------
   2) BISTABLE — one seesaw settling to +theta0 / -theta0, forever
   --------------------------------------------------------------------- */
(function bistableDemo() {
  const svg = document.getElementById('bistableSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 300 200');

  svg.appendChild(el('text', { x: 60, y: 175, 'text-anchor': 'middle', 'font-size': 13, fill: '#837c8f', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700 })).textContent = '−θ₀';
  svg.appendChild(el('text', { x: 240, y: 175, 'text-anchor': 'middle', 'font-size': 13, fill: '#837c8f', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700 })).textContent = '+θ₀';

  const seesaw = makeSeesaw(svg, { cx: 150, cy: 110, armLen: 90, thetaMaxDeg: 24, period: 3.4, colorA: '#f4c6d0', colorB: '#bfe3cc' });

  let last = null;
  function frame(t) {
    if (last === null) last = t;
    const dt = Math.min((t - last) / 1000, 0.032);
    last = t;
    seesaw.step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------------------------------------------------------------------
   3) LOGIC / ADDER — two seesaws (A, B) drive a 0.4A + 0.6B gauge needle
   --------------------------------------------------------------------- */
(function logicDemo() {
  const svg = document.getElementById('logicSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 300 190');

  const a = makeSeesaw(svg, { cx: 70, cy: 70, armLen: 45, thetaMaxDeg: 26, period: 3.2, colorA: '#f4c6d0', colorB: '#f4c6d0', label: 'A' });
  const b = makeSeesaw(svg, { cx: 230, cy: 70, armLen: 45, thetaMaxDeg: 26, period: 4.7, colorA: '#bfe3cc', colorB: '#bfe3cc', label: 'B' });

  // gauge arc + needle
  const cx = 150, cy = 165, r = 60;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  svg.appendChild(el('path', { d: arcPath, fill: 'none', stroke: '#e8e0d3', 'stroke-width': 10, 'stroke-linecap': 'round' }));
  const needle = el('line', { x1: cx, y1: cy, stroke: '#e39aab', 'stroke-width': 4, 'stroke-linecap': 'round' });
  svg.appendChild(needle);
  svg.appendChild(el('circle', { cx, cy, r: 5, fill: '#5b5468' }));

  const readout = el('text', { x: cx, y: cy - r - 14, 'text-anchor': 'middle', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700, 'font-size': 14, fill: '#5b5468' });
  svg.appendChild(readout);

  let last = null;
  function frame(t) {
    if (last === null) last = t;
    const dt = Math.min((t - last) / 1000, 0.032);
    last = t;
    a.step(dt);
    b.step(dt);

    const out = 0.4 * a.value() + 0.6 * b.value();
    const ang = Math.PI - out * Math.PI; // 0 -> left(pi), 1 -> right(0)
    needle.setAttribute('x2', cx + r * 0.82 * Math.cos(ang));
    needle.setAttribute('y2', cy - r * 0.82 * Math.sin(ang));
    readout.textContent = `0.4·A + 0.6·B = ${out.toFixed(2)}`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
