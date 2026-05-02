// =============================================
// Quanta QA Labs — site interactions
// =============================================

// ---------- Reveal on scroll ----------
function initReveals() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

// ---------- Particle background ----------
function initParticles(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let nodes = [];
  const NODE_COUNT = 70;
  const LINK_DIST = 140;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.4,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
    }
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dsq = dx * dx + dy * dy;
        if (dsq < LINK_DIST_SQ) {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 211, 238, 0.65)';
    ctx.beginPath();
    for (const n of nodes) {
      ctx.moveTo(n.x + n.r, n.y);
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    }
    ctx.fill();
    requestAnimationFrame(draw);
  }

  resize(); init(); draw();
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { resize(); init(); });
  }, { passive: true });
}

// ---------- Counters ----------
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0');
      const dur = 1400;
      const start = performance.now();
      function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = target * eased;
        el.textContent = v.toFixed(decimals);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
}

// ---------- Service card cursor glow ----------
function initSvcGlow() {
  document.querySelectorAll('.svc-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
}

// ---------- Live dashboard ticker ----------
function initDash() {
  const live = document.querySelector('[data-dash-live]');
  if (!live) return;
  const counters = live.querySelectorAll('[data-tick]');
  setInterval(() => {
    counters.forEach(c => {
      const cur = parseInt(c.textContent.replace(/,/g, '')) || 0;
      const step = parseInt(c.dataset.tick) || 1;
      const next = cur + Math.floor(Math.random() * step) + 1;
      c.textContent = next.toLocaleString();
    });
  }, 1800);
}

// ---------- Sparkline draw ----------
function drawSpark(svg) {
  if (!svg) return;
  const w = 160, h = 40;
  const points = 24;
  const data = Array.from({ length: points }, (_, i) =>
    50 + 20 * Math.sin(i * 0.6) + Math.random() * 12
  );
  const max = Math.max(...data), min = Math.min(...data);
  const path = data.map((v, i) => {
    const x = (i / (points - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const fillPath = path + ` L${w},${h} L0,${h} Z`;
  svg.innerHTML = `
    <path class="spark-fill" d="${fillPath}" />
    <path class="spark" d="${path}" />
  `;
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initParticles(document.getElementById('particle-canvas'));
  initCounters();
  initSvcGlow();
  initDash();
  document.querySelectorAll('[data-spark]').forEach(drawSpark);
});
