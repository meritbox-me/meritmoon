/* ═══════════════════════════════════════════════════════════════════════
   MERITMOON v3 — Forest canvas · Carousels · A11y · Responsive polish
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Read palette from CSS custom properties (single source of truth with style.css) */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const C = {
  silver: () => cssVar('--silver') || '#C8D8C0',
  emerald: () => cssVar('--emerald') || '#2E8B57',
  ruby: () => cssVar('--ruby') || '#C24B5A',
  gold: () => cssVar('--gold') || '#D4A853',
  silverBright: () => cssVar('--silver-bright') || '#E8F0E0',
  emeraldBright: () => cssVar('--emerald-bright') || '#4DBF82',
  goldBright: () => cssVar('--gold-bright') || '#F0C870',
  silverDim: () => cssVar('--silver-dim') || '#7A8C74',
  emeraldDim: () => cssVar('--emerald-dim') || '#1A5235',
  bgDeep: () => cssVar('--bg-deep') || '#020A05',
};

/* ══════════════════════════════════════════════════════════════════════
   1. FOREST + STARS CANVAS
   ══════════════════════════════════════════════════════════════════════ */
(function initForestCanvas() {
  const canvas = document.getElementById('forest-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], shooters = [], driftClouds = [];
  let frame = 0, raf;

  const rand = (a, b) => Math.random() * (b - a) + a;
  const hex2rgb = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const rgba = (hex, a) => {
    const { r, g, b } = hex2rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function buildStars() {
    stars = [];
    const n = Math.floor((W * H) / 2800);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      let sz, base, speed;
      if (t < 0.6) { sz = rand(0.25, 0.65); base = rand(0.08, 0.25); speed = rand(0.002, 0.005); }
      else if (t < 0.88) { sz = rand(0.65, 1.1); base = rand(0.2, 0.5); speed = rand(0.004, 0.008); }
      else { sz = rand(1.1, 1.8); base = rand(0.45, 0.85); speed = rand(0.007, 0.013); }
      stars.push({
        x: rand(0, W), y: rand(0, H * 0.72),
        sz, base, speed,
        phase: rand(0, Math.PI * 2),
        tint: Math.random() < 0.09
          ? (Math.random() < 0.6 ? C.silver() : C.emeraldDim())
          : '#FFFFFF',
      });
    }
  }

  function buildClouds() {
    driftClouds = [];
    for (let i = 0; i < 4; i++) {
      driftClouds.push({
        x: rand(W * 0.05, W * 0.95),
        y: rand(H * 0.05, H * 0.55),
        rx: rand(W * 0.12, W * 0.22),
        ry: rand(H * 0.06, H * 0.14),
        angle: rand(-0.3, 0.3),
        color: i % 2 === 0 ? C.emerald() : C.silver(),
        alpha: rand(0.012, 0.026),
      });
    }
  }

  function spawnShooter() {
    const angle = rand(-0.35, 0.12);
    const spd = rand(9, 20);
    shooters.push({
      x: rand(W * 0.05, W * 0.85),
      y: rand(0, H * 0.38),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      len: rand(55, 130),
      op: 1,
      decay: rand(0.013, 0.024),
    });
  }

  function drawSky() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.28, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    g.addColorStop(0, 'rgba(8,20,12,0.97)');
    g.addColorStop(0.3, 'rgba(5,14,8,0.99)');
    g.addColorStop(0.7, 'rgba(3,9,5,1)');
    g.addColorStop(1, 'rgba(2,6,3,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawClouds() {
    driftClouds.forEach((c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(c.rx, c.ry));
      g.addColorStop(0, rgba(c.color, c.alpha));
      g.addColorStop(0.5, rgba(c.color, c.alpha * 0.4));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawStars() {
    if (!prefersReducedMotion) frame++;
    stars.forEach((s) => {
      const op = prefersReducedMotion
        ? s.base
        : s.base + Math.sin(frame * s.speed + s.phase) * s.base * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
      ctx.fillStyle = s.tint === '#FFFFFF' ? `rgba(255,255,255,${op})` : rgba(s.tint, op);
      ctx.fill();
    });
  }

  function drawShooters() {
    if (prefersReducedMotion) return;
    shooters = shooters.filter((s) => s.op > 0);
    shooters.forEach((s) => {
      const tx = s.x - s.vx * (s.len / 14);
      const ty = s.y - s.vy * (s.len / 14);
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, `rgba(232,240,228,${s.op})`);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = g;
      ctx.lineWidth = s.op * 1.4;
      ctx.stroke();
      s.x += s.vx;
      s.y += s.vy;
      s.op -= s.decay;
    });
    if (frame % 300 === 0 && Math.random() < 0.55) spawnShooter();
  }

  function drawTreeline() {
    ctx.save();
    const hg = ctx.createLinearGradient(0, H * 0.72, 0, H);
    hg.addColorStop(0, rgba(C.silver(), 0.04));
    hg.addColorStop(0.3, rgba(C.emerald(), 0.02));
    hg.addColorStop(1, 'rgba(2,10,5,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    ctx.beginPath();
    ctx.moveTo(0, H * 0.78);
    let px = 0;
    while (px < W) {
      ctx.lineTo(px, rand(H * 0.72, H * 0.82));
      px += rand(8, 20);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(2,8,4,0.3)';
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawClouds();
    drawStars();
    drawShooters();
    drawTreeline();
    raf = requestAnimationFrame(animate);
  }

  resize();
  buildStars();
  buildClouds();
  animate();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cancelAnimationFrame(raf);
      resize();
      buildStars();
      buildClouds();
      animate();
    }, 200);
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   2. FIREFLIES
   ══════════════════════════════════════════════════════════════════════ */
(function initFireflies() {
  const container = document.getElementById('fireflies');
  if (!container || prefersReducedMotion) return;
  const count = window.innerWidth < 768 ? 10 : 22;

  for (let i = 0; i < count; i++) {
    const ff = document.createElement('div');
    ff.className = 'firefly';
    const x = Math.random() * 100;
    const y = 30 + Math.random() * 65;
    const dur = 6 + Math.random() * 12;
    const del = Math.random() * 10;
    const dx = (Math.random() - 0.5) * 80;
    const dy = -(20 + Math.random() * 80);
    const dx2 = (Math.random() - 0.5) * 60;
    const dy2 = -(40 + Math.random() * 100);
    if (Math.random() < 0.25) {
      ff.style.background = C.emeraldBright();
      ff.style.boxShadow = `0 0 6px 2px ${C.emeraldBright()}`;
    }
    ff.style.cssText += `
      left:${x}%; top:${y}%;
      --ff-dur:${dur}s; --ff-delay:${del}s;
      --ff-dx:${dx}px; --ff-dy:${dy}px;
      --ff-dx2:${dx2}px; --ff-dy2:${dy2}px;
      animation-delay:${del}s; animation-duration:${dur}s;
    `;
    container.appendChild(ff);
  }
})();

/* ══════════════════════════════════════════════════════════════════════
   3. CUSTOM CURSOR (fine pointer only)
   ══════════════════════════════════════════════════════════════════════ */
(function initCursor() {
  if (!finePointer || prefersReducedMotion) return;

  document.body.classList.add('use-custom-cursor');
  const el = document.createElement('div');
  el.id = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-moon"/></svg>';
  document.body.appendChild(el);

  let cx = -100, cy = -100, tx = -100, ty = -100;
  document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });

  const lerp = (a, b, t) => a + (b - a) * t;
  (function tick() {
    cx = lerp(cx, tx, 0.16);
    cy = lerp(cy, ty, 0.16);
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .dot, [role="button"]').forEach((node) => {
    node.addEventListener('mouseenter', () => el.classList.add('hover'));
    node.addEventListener('mouseleave', () => el.classList.remove('hover'));
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   4. NAVIGATION
   ══════════════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = document.getElementById('nav');
  const ham = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!nav || !ham || !links) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  ham.addEventListener('click', () => {
    const open = ham.classList.toggle('open');
    links.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
    ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      links.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   5. HERO ENTRY ANIMATION
   ══════════════════════════════════════════════════════════════════════ */
(function initHero() {
  const kicker = document.querySelector('.hero__kicker');
  if (kicker && !prefersReducedMotion) {
    setTimeout(() => {
      kicker.style.opacity = '1';
      kicker.style.animation = 'fade-up 0.8s var(--ease-forest) forwards';
    }, 300);
  } else if (kicker) {
    kicker.style.opacity = '1';
  }

  document.querySelectorAll('.hero__hl-line').forEach((line) => {
    const d = parseInt(line.dataset.d || '0', 10);
    const show = () => line.classList.add('vis');
    prefersReducedMotion ? show() : setTimeout(show, 500 + d);
  });

  document.querySelectorAll('.hero .reveal-fade[data-d]').forEach((el) => {
    const d = parseInt(el.dataset.d || '0', 10);
    const show = () => el.classList.add('vis');
    prefersReducedMotion ? show() : setTimeout(show, 500 + d);
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   6. SCROLL REVEALS + COUNTERS
   ══════════════════════════════════════════════════════════════════════ */
(function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('vis');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.reveal-fade, .reveal-card').forEach((el) => {
    if (el.closest('.hero')) return;
    const d = parseInt(el.dataset.d || '0', 10);
    if (d) el.style.transitionDelay = `${d / 1000}s`;
    if (prefersReducedMotion) el.classList.add('vis');
    else obs.observe(el);
  });

  [
    '.pcard', '.how__step', '.mtile', '.tcard', '.commit-card',
    '.about__words > *', '.about__pillars', '.fcol', '.footer__brand',
  ].forEach((sel) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (el.classList.contains('reveal-fade') || el.classList.contains('reveal-card')) return;
      el.classList.add('reveal-fade');
      el.style.transitionDelay = `${i * 0.08}s`;
      if (!el.closest('.hero')) {
        if (prefersReducedMotion) el.classList.add('vis');
        else obs.observe(el);
      }
    });
  });
})();

(function initCounters() {
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  function animateNum(el, target, dur = 2200) {
    if (prefersReducedMotion) {
      el.textContent = target.toLocaleString();
      return;
    }
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    })(start);
  }

  const cObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = parseInt(e.target.dataset.target, 10);
      if (!Number.isNaN(t)) animateNum(e.target, t);
      cObs.unobserve(e.target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach((el) => cObs.observe(el));
})();

/* ══════════════════════════════════════════════════════════════════════
   7. RESPONSIVE CAROUSEL
   ══════════════════════════════════════════════════════════════════════ */
function makeCarousel({ trackId, prevId, nextId, dotsId, cardSel, gapPx, autoplayMs }) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsEl = document.getElementById(dotsId);
  const outer = track?.parentElement;
  if (!track || !prev || !next || !dotsEl || !outer) return null;

  const cards = [...track.querySelectorAll(cardSel)];
  if (!cards.length) return null;

  let cur = 0;
  let perView = 1;
  let maxIdx = 0;
  let autoplayTimer = null;

  function calcPerView() {
    const cardW = cards[0].offsetWidth;
    const available = outer.clientWidth - 120;
    perView = Math.max(1, Math.floor((available + gapPx) / (cardW + gapPx)));
    maxIdx = Math.max(0, cards.length - perView);
    cur = Math.min(cur, maxIdx);
  }

  function cardStep() {
    return cards[0].offsetWidth + gapPx;
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i <= maxIdx; i++) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'dot' + (i === cur ? ' active' : '');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      d.addEventListener('click', () => go(i));
      dotsEl.appendChild(d);
    }
  }

  function updateUI() {
    track.style.transform = `translate3d(-${cur * cardStep()}px, 0, 0)`;
    dotsEl.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === cur);
      d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
    });
    prev.disabled = cur === 0;
    next.disabled = cur === maxIdx;
    prev.style.opacity = cur === 0 ? '0.4' : '1';
    next.style.opacity = cur === maxIdx ? '0.4' : '1';
  }

  function go(idx) {
    cur = Math.max(0, Math.min(idx, maxIdx));
    updateUI();
  }

  function resetAutoplay() {
    if (!autoplayMs || prefersReducedMotion) return;
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => go(cur < maxIdx ? cur + 1 : 0), autoplayMs);
  }

  prev.addEventListener('click', () => { go(cur - 1); resetAutoplay(); });
  next.addEventListener('click', () => { go(cur + 1); resetAutoplay(); });

  let tx0 = 0;
  outer.addEventListener('touchstart', (e) => { tx0 = e.changedTouches[0].clientX; }, { passive: true });
  outer.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 48) {
      go(dx < 0 ? cur + 1 : cur - 1);
      resetAutoplay();
    }
  }, { passive: true });

  outer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(cur - 1); resetAutoplay(); }
    if (e.key === 'ArrowRight') { go(cur + 1); resetAutoplay(); }
  });

  const ro = new ResizeObserver(() => {
    calcPerView();
    buildDots();
    updateUI();
  });
  ro.observe(outer);

  calcPerView();
  buildDots();
  updateUI();
  resetAutoplay();

  return { go, refresh: () => { calcPerView(); buildDots(); updateUI(); } };
}

const coursesCarousel = makeCarousel({
  trackId: 'courses-track',
  prevId: 'c-prev',
  nextId: 'c-next',
  dotsId: 'c-dots',
  cardSel: '.ccard',
  gapPx: 24,
  autoplayMs: 5500,
});

makeCarousel({
  trackId: 'testi-track',
  prevId: 't-prev',
  nextId: 't-next',
  dotsId: 't-dots',
  cardSel: '.tcard',
  gapPx: 24,
  autoplayMs: 0,
});

/* ══════════════════════════════════════════════════════════════════════
   8. MOON PARALLAX + EYE TRACKING
   ══════════════════════════════════════════════════════════════════════ */
(function initMoonInteractions() {
  const moonWrap = document.querySelector('.hero-moon-wrap');
  if (!moonWrap || prefersReducedMotion) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      moonWrap.style.transform = `translateY(${window.scrollY * 0.12}px)`;
      ticking = false;
    });
  }, { passive: true });

  if (!finePointer) return;
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.mm-face').forEach((face) => {
      const r = face.getBoundingClientRect();
      const fcx = r.left + r.width / 2;
      const fcy = r.top + r.height / 2;
      const dx = e.clientX - fcx;
      const dy = e.clientY - fcy;
      const dist = Math.hypot(dx, dy);
      const max = 1.4;
      const mx = dist > 0 ? (dx / dist) * Math.min(dist * 0.025, max) : 0;
      const my = dist > 0 ? (dy / dist) * Math.min(dist * 0.025, max) : 0;
      face.querySelectorAll('.mm-eye').forEach((eye) => {
        eye.style.transform = `translate(${mx}px,${my}px)`;
      });
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   9. MOON BLINK
   ══════════════════════════════════════════════════════════════════════ */
(function initBlink() {
  if (prefersReducedMotion) return;
  function blink(face) {
    face.querySelectorAll('.mm-eye').forEach((e) => {
      const base = e.style.transform || '';
      e.style.transform = `${base} scaleY(0.08)`;
      setTimeout(() => { e.style.transform = base; }, 110);
    });
  }
  function scheduleBlink(face) {
    setTimeout(() => {
      blink(face);
      scheduleBlink(face);
    }, 3000 + Math.random() * 4500);
  }
  document.querySelectorAll('.mm-face').forEach(scheduleBlink);
})();

/* ══════════════════════════════════════════════════════════════════════
   10. CARD AMBIENT GLOW
   ══════════════════════════════════════════════════════════════════════ */
(function initCardGlow() {
  if (!finePointer) return;
  document.querySelectorAll('.ccard, .pcard, .tcard, .mcard, .mtile, .commit-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--glow-x', `${x}%`);
      card.style.setProperty('--glow-y', `${y}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--glow-x');
      card.style.removeProperty('--glow-y');
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   11. SPARK BURST ON PRIMARY BUTTONS
   ══════════════════════════════════════════════════════════════════════ */
(function initSparks() {
  if (prefersReducedMotion) return;
  const kf = document.createElement('style');
  kf.textContent = `
    @keyframes spark-out {
      0%   { transform: translate(0,0) scale(0); opacity:1; }
      70%  { opacity:0.8; }
      100% { transform: translate(var(--spx),var(--spy)) scale(1.4); opacity:0; }
    }
  `;
  document.head.appendChild(kf);

  document.querySelectorAll('.btn--forest').forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      for (let i = 0; i < 7; i++) {
        const sp = document.createElement('span');
        sp.setAttribute('aria-hidden', 'true');
        sp.innerHTML = '<svg width="10" height="10"><use href="#icon-spark"/></svg>';
        const spx = (Math.random() - 0.5) * 48;
        const spy = (Math.random() - 0.7) * 48;
        sp.style.cssText = `
          position:absolute; color:${Math.random() < 0.5 ? C.goldBright() : C.silverBright()};
          pointer-events:none; z-index:20;
          left:${15 + Math.random() * 70}%; top:${10 + Math.random() * 80}%;
          --spx:${spx}px; --spy:${spy}px;
          animation: spark-out 0.65s ease forwards;
          filter: drop-shadow(0 0 3px ${C.gold()});
        `;
        btn.appendChild(sp);
        setTimeout(() => sp.remove(), 700);
      }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   12. ACTIVE NAV HIGHLIGHT
   ══════════════════════════════════════════════════════════════════════ */
(function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav__links a[href^="#"]');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navAs.forEach((a) => {
        const active = a.getAttribute('href') === `#${e.target.id}`;
        a.classList.toggle('is-active', active);
        if (active) a.style.color = C.silverBright();
        else a.style.color = '';
      });
    });
  }, { threshold: 0.35 });

  sections.forEach((s) => obs.observe(s));
})();

/* ══════════════════════════════════════════════════════════════════════
   13. MOONLIGHT WASH SCROLL
   ══════════════════════════════════════════════════════════════════════ */
(function initWashParallax() {
  const wash = document.querySelector('.moonlight-wash');
  if (!wash || prefersReducedMotion) return;
  window.addEventListener('scroll', () => {
    const ratio = Math.min(window.scrollY / (document.body.scrollHeight * 0.25), 1);
    wash.style.opacity = String(0.5 + ratio * 0.4);
  }, { passive: true });
})();

/* Card hover glow via CSS variables */
(function injectCardGlowCSS() {
  const s = document.createElement('style');
  s.textContent = `
    .ccard, .pcard, .tcard, .mcard, .mtile, .commit-card {
      background-image: radial-gradient(
        circle at var(--glow-x, 50%) var(--glow-y, 0%),
        rgba(200,216,192,0.055) 0%,
        transparent 55%
      );
    }
    .nav__links a.is-active { color: var(--silver-bright) !important; }
  `;
  document.head.appendChild(s);
})();

window.addEventListener('load', () => {
  coursesCarousel?.refresh();
});
