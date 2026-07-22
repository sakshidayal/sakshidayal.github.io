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
   shared: a bistable parallelogram unit (the actual mechanism from the
   thesis — two hinged verticals + a torsional spring at the base) that
   damps toward an alternating target angle, forever.
   --------------------------------------------------------------------- */
function springPath(x, y, scale) {
  const w = 9 * scale, h = 4 * scale;
  let d = `M ${x - w} ${y}`;
  for (let i = 0; i < 5; i++) {
    const sx = x - w + (w * 2 * (i + 1)) / 5;
    const sy = y + (i % 2 === 0 ? -h : h);
    d += ` L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  }
  return d;
}

function makeBistableSwitch(svg, { x, y, scale = 1, thetaMaxDeg, period, color, label }) {
  const g = el('g', {});
  svg.appendChild(g);

  const bw = 26 * scale, L = 58 * scale;
  const P1 = { x: x - bw, y }, P2 = { x: x + bw, y };

  const base = el('line', { x1: P1.x, y1: P1.y, x2: P2.x, y2: P2.y, stroke: '#8a7f96', 'stroke-width': 5, 'stroke-linecap': 'round' });
  const spring = el('path', { d: springPath(x, y + 14 * scale, scale), fill: 'none', stroke: '#8a7f96', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const left = el('line', { stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round' });
  const right = el('line', { stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round' });
  const top = el('line', { stroke: '#5b5468', 'stroke-width': 5, 'stroke-linecap': 'round' });
  const dots = [P1, P2].map((p) => el('circle', { cx: p.x, cy: p.y, r: 3.5, fill: '#5b5468' }));
  const dotsTop = [0, 1].map(() => el('circle', { r: 3.5, fill: '#5b5468' }));

  [spring, base, left, right, top, ...dots, ...dotsTop].forEach((n) => g.appendChild(n));

  if (label) {
    const t = el('text', { x, y: y - L - 16 * scale, 'text-anchor': 'middle', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700, 'font-size': 15 * scale, fill: '#5b5468' });
    t.textContent = label;
    g.appendChild(t);
  }

  const thetaMax = (thetaMaxDeg * Math.PI) / 180;
  let angle = -thetaMax, vel = 0, target = -thetaMax, timer = Math.random() * period;

  function step(dt) {
    timer += dt;
    if (timer > period) { timer = 0; target = target > 0 ? -thetaMax : thetaMax; }
    const k = 9, c = 5;
    const acc = k * (target - angle) - c * vel;
    vel += acc * dt;
    angle += vel * dt;

    const dx = L * Math.sin(angle), dy = -L * Math.cos(angle);
    const P3 = { x: P1.x + dx, y: P1.y + dy };
    const P4 = { x: P2.x + dx, y: P2.y + dy };
    left.setAttribute('x1', P1.x); left.setAttribute('y1', P1.y);
    left.setAttribute('x2', P3.x); left.setAttribute('y2', P3.y);
    right.setAttribute('x1', P2.x); right.setAttribute('y1', P2.y);
    right.setAttribute('x2', P4.x); right.setAttribute('y2', P4.y);
    top.setAttribute('x1', P3.x); top.setAttribute('y1', P3.y);
    top.setAttribute('x2', P4.x); top.setAttribute('y2', P4.y);
    dotsTop[0].setAttribute('cx', P3.x); dotsTop[0].setAttribute('cy', P3.y);
    dotsTop[1].setAttribute('cx', P4.x); dotsTop[1].setAttribute('cy', P4.y);
  }

  // 0 = fully at -thetaMax, 1 = fully at +thetaMax
  function value() { return (angle / thetaMax + 1) / 2; }
  function bool() { return target > 0 ? 1 : 0; }

  return { step, value, bool };
}

/* ---------------------------------------------------------------------
   2) BISTABLE — one unit settling to +theta0 / -theta0, forever
   --------------------------------------------------------------------- */
(function bistableDemo() {
  const svg = document.getElementById('bistableSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 300 200');

  svg.appendChild(el('text', { x: 65, y: 185, 'text-anchor': 'middle', 'font-size': 13, fill: '#837c8f', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700 })).textContent = '−θ₀';
  svg.appendChild(el('text', { x: 235, y: 185, 'text-anchor': 'middle', 'font-size': 13, fill: '#837c8f', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700 })).textContent = '+θ₀';

  const unit = makeBistableSwitch(svg, { x: 150, y: 150, scale: 1.5, thetaMaxDeg: 22, period: 3.4, color: '#e39aab' });

  let last = null;
  function frame(t) {
    if (last === null) last = t;
    const dt = Math.min((t - last) / 1000, 0.032);
    last = t;
    unit.step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------------------------------------------------------------------
   3) LOGIC / ADDER — two units (A, B) drive a 0.4A + 0.6B gauge needle
   --------------------------------------------------------------------- */
(function logicDemo() {
  const svg = document.getElementById('logicSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 300 190');

  const a = makeBistableSwitch(svg, { x: 75, y: 90, scale: 0.85, thetaMaxDeg: 26, period: 3.2, color: '#e39aab', label: 'A' });
  const b = makeBistableSwitch(svg, { x: 225, y: 90, scale: 0.85, thetaMaxDeg: 26, period: 4.7, color: '#8fc9a6', label: 'B' });

  // gauge arc + needle
  const cx = 150, cy = 175, r = 55;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  svg.appendChild(el('path', { d: arcPath, fill: 'none', stroke: '#e8e0d3', 'stroke-width': 10, 'stroke-linecap': 'round' }));
  const needle = el('line', { x1: cx, y1: cy, stroke: '#e39aab', 'stroke-width': 4, 'stroke-linecap': 'round' });
  svg.appendChild(needle);
  svg.appendChild(el('circle', { cx, cy, r: 5, fill: '#5b5468' }));

  const readout = el('text', { x: cx, y: cy - r - 12, 'text-anchor': 'middle', 'font-family': 'Quicksand, sans-serif', 'font-weight': 700, 'font-size': 14, fill: '#5b5468' });
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

/* ---------------------------------------------------------------------
   4) LOGIC GATES — the same switches (A, B) driving real AND / OR / NOT
   gates, each shown beside its standard schematic symbol.
   --------------------------------------------------------------------- */
(function gatesDemo() {
  const svg = document.getElementById('gatesSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 320 320');

  const a = makeBistableSwitch(svg, { x: 80, y: 55, scale: 0.62, thetaMaxDeg: 26, period: 2.6, color: '#e39aab', label: 'A' });
  const b = makeBistableSwitch(svg, { x: 240, y: 55, scale: 0.62, thetaMaxDeg: 26, period: 3.9, color: '#8fc9a6', label: 'B' });

  // -- standard gate symbols, drawn generically (not traced from any spec) --
  function andGate(cx, cy) {
    const w = 34, h = 26;
    return `M ${cx - w / 2} ${cy - h / 2} L ${cx} ${cy - h / 2}
            A ${h / 2} ${h / 2} 0 0 1 ${cx} ${cy + h / 2}
            L ${cx - w / 2} ${cy + h / 2} Z`;
  }
  function orGate(cx, cy) {
    const w = 34, h = 26;
    const x0 = cx - w / 2;
    return `M ${x0} ${cy - h / 2}
            Q ${x0 + w * 0.35} ${cy - h / 2} ${cx + w / 2} ${cy}
            Q ${x0 + w * 0.35} ${cy + h / 2} ${x0} ${cy + h / 2}
            Q ${x0 + w * 0.22} ${cy} ${x0} ${cy - h / 2} Z`;
  }
  function notGate(cx, cy) {
    const w = 30, h = 26;
    return `M ${cx - w / 2} ${cy - h / 2} L ${cx - w / 2} ${cy + h / 2} L ${cx + w / 2 - 6} ${cy} Z`;
  }

  function gateRow(cy, kind, pathFn, computeFn, labelText) {
    const g = el('g', {});
    svg.appendChild(g);

    const cx = 160;
    g.appendChild(el('path', { d: pathFn(cx, cy), fill: '#fff', stroke: '#5b5468', 'stroke-width': 2.5 }));
    if (kind === 'not') {
      g.appendChild(el('circle', { cx: cx + 15, cy, r: 4, fill: '#fff', stroke: '#5b5468', 'stroke-width': 2.5 }));
    }
    // input/output leads
    if (kind !== 'not') {
      g.appendChild(el('line', { x1: cx - 44, y1: cy - 7, x2: cx - 17, y2: cy - 7, stroke: '#5b5468', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: cx - 44, y1: cy + 7, x2: cx - 17, y2: cy + 7, stroke: '#5b5468', 'stroke-width': 2 }));
    } else {
      g.appendChild(el('line', { x1: cx - 44, y1: cy, x2: cx - 15, y2: cy, stroke: '#5b5468', 'stroke-width': 2 }));
    }
    g.appendChild(el('line', { x1: cx + (kind === 'not' ? 19 : 17), y1: cy, x2: cx + 46, y2: cy, stroke: '#5b5468', 'stroke-width': 2 }));

    const lamp = el('circle', { cx: cx + 60, cy, r: 8, stroke: '#5b5468', 'stroke-width': 1.5 });
    g.appendChild(lamp);

    const label = el('text', { x: cx - 90, y: cy + 5, 'font-family': 'Quicksand, sans-serif', 'font-weight': 700, 'font-size': 14, fill: '#5b5468' });
    label.textContent = labelText;
    g.appendChild(label);

    return {
      update() {
        const on = computeFn();
        lamp.setAttribute('fill', on ? '#f6c343' : '#e8e0d3');
      },
    };
  }

  const andRow = gateRow(150, 'and', andGate, () => a.bool() && b.bool(), 'AND');
  const orRow = gateRow(220, 'or', orGate, () => a.bool() || b.bool(), 'OR');
  const notRow = gateRow(290, 'not', notGate, () => (a.bool() ? 0 : 1), 'NOT A');

  let last = null;
  function frame(t) {
    if (last === null) last = t;
    const dt = Math.min((t - last) / 1000, 0.032);
    last = t;
    a.step(dt);
    b.step(dt);
    andRow.update();
    orRow.update();
    notRow.update();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
