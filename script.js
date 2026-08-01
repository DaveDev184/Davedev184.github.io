function rand(min, max) {
  return min + Math.random() * (max - min);
}
function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ========== Pantalla 1: sobre + corazones cayendo ==========

function drawEnvelope() {
  const cv = document.getElementById("envelopeCanvas");
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  const w = cv.width;
  const h = cv.height;
  c.clearRect(0, 0, w, h);

  const margin = 3;
  c.strokeStyle = "#d81b46";
  c.lineWidth = 2;
  c.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  c.beginPath();
  c.moveTo(margin, margin);
  c.lineTo(w / 2, h / 2);
  c.lineTo(w - margin, margin);
  c.stroke();

  c.beginPath();
  c.moveTo(margin, h - margin);
  c.lineTo(w / 2 - 6, h / 2 + 2);
  c.moveTo(w - margin, h - margin);
  c.lineTo(w / 2 + 6, h / 2 + 2);
  c.stroke();

  c.fillStyle = "#d81b46";
  c.fillRect(w / 2 - 3, h / 2 - 2, 2, 2);
  c.fillRect(w / 2 + 1, h / 2 - 2, 2, 2);
  c.fillRect(w / 2 - 4, h / 2 - 1, 8, 2);
  c.fillRect(w / 2 - 3, h / 2 + 1, 6, 2);
  c.fillRect(w / 2 - 2, h / 2 + 3, 4, 2);
  c.fillRect(w / 2 - 1, h / 2 + 5, 2, 1);
}

function createPixelHeartDataURL(color) {
  const grid = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  const cv = document.createElement("canvas");
  cv.width = grid[0].length;
  cv.height = grid.length;
  const c = cv.getContext("2d");
  c.fillStyle = color;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === "1") c.fillRect(x, y, 1, 1);
    }
  }
  return cv.toDataURL();
}

function spawnFallingHearts() {
  const container = document.getElementById("heartsBg");
  const heartUrl = createPixelHeartDataURL("#e0355b");
  const count = 26;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "falling-heart";
    el.style.backgroundImage = `url(${heartUrl})`;
    const size = rand(10, 26);
    el.style.width = `${size}px`;
    el.style.height = `${size * (6 / 7)}px`;
    el.style.left = `${rand(0, 100)}%`;
    el.style.opacity = rand(0.35, 0.9);
    el.style.animationDuration = `${rand(6, 13)}s`;
    el.style.animationDelay = `${rand(-10, 0)}s`;
    container.appendChild(el);
  }
}

// ========== Navegación entre pantallas ==========

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

drawEnvelope();
spawnFallingHearts();

document.getElementById("screenEnvelope").addEventListener("click", () => {
  showScreen("screenQuestion");
});

document.getElementById("btnYes").addEventListener("click", () => {
  showScreen("screenLetter");
});

document.getElementById("btnVerFlores").addEventListener("click", () => {
  showScreen("screenFlowers");
  generate();
});

// ========== Pantalla 4: ramo de rosas (arte trazado de foto real, sobre canvas) ==========

const ramoCanvas = document.getElementById("ramoCanvas");
const ramoCtx = ramoCanvas.getContext("2d");
const ramoEscena = document.querySelector(".ramo-escena");

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgbStr(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
}

let flowerData = null;
let flowerLoadPromise = null;

function loadFlowerData() {
  if (flowerData) return Promise.resolve(flowerData);
  if (!flowerLoadPromise) {
    flowerLoadPromise = fetch("rosas.json")
      .then((res) => res.json())
      .then((raw) => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        const shapes = raw.map((s) => {
          for (const ring of s.rings) {
            for (const [x, y] of ring) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
          // colores ya vienen en RGB 0-255 (foto real), sin normalizar
          const hsl = rgbToHsl(clamp(s.color[0], 0, 255), clamp(s.color[1], 0, 255), clamp(s.color[2], 0, 255));
          const isPetal = hsl.s > 0.25 && (hsl.h < 20 || hsl.h > 340);
          return { rings: s.rings, hsl, isPetal };
        });
        flowerData = { shapes, minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
        return flowerData;
      });
  }
  return flowerLoadPromise;
}

// lift aclara los pétalos al recolorear: la foto original es muy oscura y un rosa
// saturado con esa luminosidad se percibe rojo; l' = l + lift * (0.9 - l)
const FLOWER_PALETTE = [
  { hue: 330, sat: 0.95, lift: 0.3 },
  { hue: 335, sat: 0.9, lift: 0.35 },
  { hue: 324, sat: 0.92, lift: 0.3 },
  { hue: 340, sat: 0.85, lift: 0.42 },
];

// revealT 0..1: las formas van apareciendo en orden (grandes primero, detalles al final),
// como si la tortuga estuviera pintando el ramo en vivo
function drawFlowerInstance(cx, groundY, scale, rotateRad, targetHue, satMult, lift, revealT) {
  const { shapes, minX, maxX, maxY } = flowerData;
  const centerX = (minX + maxX) / 2;
  const n = shapes.length;
  const fadeSpan = 3; // cada forma hace un fundido corto solapado con las siguientes
  const progress = revealT * (n + fadeSpan);
  ramoCtx.save();
  ramoCtx.translate(cx, groundY);
  ramoCtx.rotate(rotateRad);
  ramoCtx.scale(scale, scale);
  for (let si = 0; si < n; si++) {
    const alpha = clamp((progress - si) / fadeSpan, 0, 1);
    if (alpha <= 0) break; // las siguientes aún no empiezan
    const shape = shapes[si];
    ramoCtx.globalAlpha = alpha;
    ramoCtx.beginPath();
    for (const ring of shape.rings) {
      for (let i = 0; i < ring.length; i++) {
        const lx = ring[i][0] - centerX;
        const ly = ring[i][1] - maxY;
        if (i === 0) ramoCtx.moveTo(lx, ly);
        else ramoCtx.lineTo(lx, ly);
      }
      ramoCtx.closePath();
    }
    if (shape.isPetal) {
      const s = clamp(shape.hsl.s * satMult, 0, 1);
      const l = clamp(shape.hsl.l + lift * (0.9 - shape.hsl.l), 0, 1);
      ramoCtx.fillStyle = hslToRgbStr(targetHue, s, l);
    } else {
      ramoCtx.fillStyle = hslToRgbStr(shape.hsl.h, shape.hsl.s, shape.hsl.l);
    }
    ramoCtx.fill("evenodd");
  }
  ramoCtx.globalAlpha = 1;
  ramoCtx.restore();
}

function drawBackgroundRamo(w, h) {
  const grad = ramoCtx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, Math.max(w, h) * 0.85);
  grad.addColorStop(0, "#241019");
  grad.addColorStop(0.55, "#100810");
  grad.addColorStop(1, "#020202");
  ramoCtx.fillStyle = grad;
  ramoCtx.fillRect(0, 0, w, h);
}

function drawStarsRamo(stars, w, h, elapsed) {
  for (const s of stars) {
    const a = clamp(s.base + Math.sin(elapsed * s.speed + s.phase) * 0.3, 0, 1);
    ramoCtx.beginPath();
    ramoCtx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ramoCtx.fillStyle = `rgba(255,255,255,${a})`;
    ramoCtx.fill();
  }
}

function drawGroundGlow(x, y, radius, hue, alpha) {
  const g = ramoCtx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `hsla(${hue}, 70%, 55%, ${alpha})`);
  g.addColorStop(1, `hsla(${hue}, 70%, 55%, 0)`);
  ramoCtx.fillStyle = g;
  ramoCtx.beginPath();
  ramoCtx.arc(x, y, radius, 0, Math.PI * 2);
  ramoCtx.fill();
}

function drawParticlesRamo(particles, w, h, elapsed) {
  for (const p of particles) {
    const cycle = (elapsed / 1000 / p.period + p.phase) % 1;
    const y = p.startY * h - cycle * h * 0.5;
    const x = p.startX * w + Math.sin(cycle * Math.PI * 2 + p.phase * 6) * 10;
    const alpha = Math.sin(cycle * Math.PI);
    if (alpha <= 0) continue;
    ramoCtx.beginPath();
    ramoCtx.arc(x, y, p.size, 0, Math.PI * 2);
    ramoCtx.fillStyle = `hsla(${p.hue}, 85%, 80%, ${alpha * 0.8})`;
    ramoCtx.fill();
  }
}

let ramoFrame = null;

function generate() {
  loadFlowerData().then((data) => {
    const w = ramoEscena.clientWidth;
    const h = ramoEscena.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ramoCanvas.width = w * dpr;
    ramoCanvas.height = h * dpr;

    const scale = Math.min((h * 0.86) / data.height, (w * 0.92) / data.width);
    const renderedW = data.width * scale;
    const gap = renderedW * 0.18;
    const perSlot = renderedW + gap;
    const count = clamp(Math.floor(w / perSlot), 1, 3);

    const totalWidth = count * renderedW + (count - 1) * gap;
    const startX = (w - totalWidth) / 2 + renderedW / 2;

    const paletteChoice = choice(FLOWER_PALETTE);

    const instances = [];
    for (let i = 0; i < count; i++) {
      const isCenter = count > 1 && i === Math.floor((count - 1) / 2);
      instances.push({
        cx: startX + i * perSlot + rand(-6, 6),
        groundY: h * rand(0.94, 0.99),
        instScale: scale * rand(0.92, 1.05) * (isCenter ? 1.06 : 1),
        rot: rand(-0.05, 0.05),
        hue: paletteChoice.hue + rand(-4, 4),
        sat: clamp(paletteChoice.sat + rand(-0.03, 0.03), 0, 1.2),
        lift: clamp(paletteChoice.lift + rand(-0.03, 0.03), 0, 0.6),
        delay: i * 700,
        drawDuration: rand(2600, 3200),
      });
    }

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.4, 1.6),
      base: rand(0.1, 0.5),
      speed: rand(0.0008, 0.002),
      phase: rand(0, Math.PI * 2),
    }));

    const particles = Array.from({ length: 14 }, () => ({
      startX: rand(0.1, 0.9),
      startY: rand(0.55, 0.95),
      size: rand(1.5, 3),
      period: rand(5, 9),
      phase: rand(0, 1),
      hue: paletteChoice.hue + rand(-10, 10),
    }));

    if (ramoFrame) cancelAnimationFrame(ramoFrame);
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      ramoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ramoCtx.clearRect(0, 0, w, h);
      drawBackgroundRamo(w, h);
      drawStarsRamo(stars, w, h, elapsed);

      for (const inst of instances) {
        const t = clamp((elapsed - inst.delay) / inst.drawDuration, 0, 1);
        if (t <= 0) continue;
        drawGroundGlow(
          inst.cx,
          inst.groundY - inst.instScale * data.height * 0.35,
          inst.instScale * data.height * 0.55,
          inst.hue,
          0.28 * t
        );
      }

      for (const inst of instances) {
        const t = clamp((elapsed - inst.delay) / inst.drawDuration, 0, 1);
        if (t <= 0) continue;
        const swayAngle = Math.sin(elapsed * 0.0006 + inst.cx) * 0.012;
        drawFlowerInstance(inst.cx, inst.groundY, inst.instScale, inst.rot + swayAngle, inst.hue, inst.sat, inst.lift, t);
      }

      drawParticlesRamo(particles, w, h, elapsed);

      ramoFrame = requestAnimationFrame(frame);
    }
    ramoFrame = requestAnimationFrame(frame);
  });
}
