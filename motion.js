// =====================================================
// Quanta QA Labs — Motion layer
// =====================================================

import * as THREE from 'three';

// Debounced window-resize subscription so each canvas doesn't pay for layout twice.
function onResize(fn) {
  let raf = 0;
  const handler = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fn);
  };
  window.addEventListener('resize', handler, { passive: true });
}

// -------- Animated squares grid background --------
function initSquares(canvas, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const squareSize = opts.squareSize || 44;
  const speed = opts.speed || 0.4;
  const borderColor = opts.borderColor || 'rgba(34, 211, 238, 0.12)';
  const hoverFillColor = opts.hoverFillColor || 'rgba(34, 211, 238, 0.18)';
  const fadeColor = opts.fadeColor || 'rgba(5, 8, 16, 0.85)';
  const offset = { x: 0, y: 0 };
  let hovered = null;
  let fadeGradient = null;

  function rebuildGradient() {
    fadeGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
    );
    fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fadeGradient.addColorStop(1, fadeColor);
  }

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    rebuildGradient();
  }
  resize();
  onResize(resize);

  function draw() {
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    const ox = offset.x % squareSize;
    const oy = offset.y % squareSize;
    const startX = Math.floor(offset.x / squareSize) * squareSize;
    const startY = Math.floor(offset.y / squareSize) * squareSize;

    if (hovered) {
      ctx.fillStyle = hoverFillColor;
      ctx.fillRect(
        hovered.x * squareSize - ox,
        hovered.y * squareSize - oy,
        squareSize, squareSize,
      );
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    for (let x = startX; x < cw + squareSize; x += squareSize) {
      for (let y = startY; y < ch + squareSize; y += squareSize) {
        ctx.rect(x - ox, y - oy, squareSize, squareSize);
      }
    }
    ctx.stroke();

    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, 0, cw, ch);
  }

  function tick() {
    offset.x = (offset.x - speed + squareSize) % squareSize;
    offset.y = (offset.y - speed + squareSize) % squareSize;
    draw();
    requestAnimationFrame(tick);
  }

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    hovered = {
      x: Math.floor((mx + (offset.x % squareSize)) / squareSize),
      y: Math.floor((my + (offset.y % squareSize)) / squareSize),
    };
  });
  canvas.addEventListener('mouseleave', () => { hovered = null; });
  requestAnimationFrame(tick);
}

// -------- Staged loader --------
function runLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return Promise.resolve();
  const msg = loader.querySelector('.loader-msg');
  const bar = loader.querySelector('.loader-bar > span');

  const stages = [
    { pct: 12, label: 'Initializing runtime' },
    { pct: 32, label: 'Compiling test framework' },
    { pct: 52, label: 'Booting CI pipeline' },
    { pct: 72, label: 'Loading dashboards' },
    { pct: 88, label: 'Calibrating precision' },
    { pct: 100, label: 'Ready' },
  ];

  return new Promise(resolve => {
    let i = 0;
    function step() {
      if (i >= stages.length) {
        setTimeout(() => {
          loader.classList.add('gone');
          resolve();
        }, 120);
        return;
      }
      const s = stages[i++];
      msg.innerHTML = `<span>${s.label}</span><span class="pct">${s.pct}%</span>`;
      bar.style.width = s.pct + '%';
      setTimeout(step, 140 + Math.random() * 100);
    }
    setTimeout(step, 80);
  });
}

// -------- Three.js wireframe globe --------
function initThree() {
  const host = document.getElementById('three-canvas');
  if (!host) return;

  const w = host.clientWidth, h = host.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas: host, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  cam.position.z = 6;

  const group = new THREE.Group();
  scene.add(group);

  // Outer wireframe sphere
  const sphereGeo = new THREE.IcosahedronGeometry(2, 3);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.55,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(sphere);

  // Inner solid icosahedron
  const innerGeo = new THREE.IcosahedronGeometry(1.1, 1);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.85,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  group.add(inner);

  // Particle dust around it
  const particleCount = 800;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 3 + Math.random() * 4;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(p) * Math.cos(t);
    positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    positions[i * 3 + 2] = r * Math.cos(p);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x22d3ee, size: 0.025, transparent: true, opacity: 0.7,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Mouse reactivity
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function applyResponsiveScale() {
    const vw = window.innerWidth;
    const s = vw < 480 ? 0.5 : vw < 640 ? 0.6 : vw < 960 ? 0.78 : 1;
    group.scale.setScalar(s);
    dust.scale.setScalar(s);
  }
  applyResponsiveScale();

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    applyResponsiveScale();
  }
  onResize(resize);

  function tick(t) {
    mx += (tx - mx) * 0.02;
    my += (ty - my) * 0.02;
    group.rotation.y = t * 0.00008 + mx * 0.4;
    group.rotation.x = my * 0.25;
    inner.rotation.x = -t * 0.00025;
    inner.rotation.z =  t * 0.00018;
    dust.rotation.y = t * 0.00003;
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// -------- Magnetic buttons --------
function initMagnetic() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.15;
      const y = (e.clientY - r.top - r.height / 2) * 0.22;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// -------- Scroll progress + parallax --------
function initScroll() {
  const bar = document.querySelector('.scroll-progress');
  const heroCopy = document.querySelector('.hero-copy');
  const heroTerm = document.querySelector('.hero-term');
  function onScroll() {
    const sc = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${Math.min(sc / max, 1)})`;
    if (sc < window.innerHeight) {
      if (heroCopy) heroCopy.style.transform = `translateY(${sc * 0.08}px)`;
      if (heroTerm) heroTerm.style.transform = `translateY(${sc * 0.03}px)`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// -------- Bootstrap --------
window.addEventListener('load', async () => {
  await runLoader();
  initThree();
  initMagnetic();
  initScroll();
  document.querySelectorAll('[data-squares]').forEach(c => initSquares(c, {
    squareSize: parseInt(c.dataset.size) || 44,
    speed: parseFloat(c.dataset.speed) || 0.4,
    borderColor: c.dataset.border || 'rgba(34, 211, 238, 0.12)',
    hoverFillColor: c.dataset.hover || 'rgba(34, 211, 238, 0.18)',
  }));
});
