/* ═══════════════════════════════════════════════════════════════════════
   MERITMOON v2 — SCRIPT.JS
   Forest canvas · Fireflies · Carousels · Scroll reveals · Counters
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── COLOR MIRRORS (matches CSS vars — edit in CSS, mirror here for canvas) */
const C = {
  silver: '#C8D8C0',
  emerald: '#2E8B57',
  ruby: '#C24B5A',
  gold: '#D4A853',
  silverBright: '#E8F0E0',
  emeraldBright: '#4DBF82',
  goldBright: '#F0C870',
  silverDim: '#7A8C74',
  emeraldDim: '#1A5235',
  bgDeep: '#020A05',
};

/* ══════════════════════════════════════════════════════════════════════
   1. FOREST + STARS CANVAS
   Layered: deep night sky gradient → stars → faint star clusters →
   distant treeline silhouette painted on canvas bottom
   ══════════════════════════════════════════════════════════════════════ */
(function initForestCanvas() {
  const canvas = document.getElementById('forest-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], shooters = [], driftClouds = [];
  let frame = 0, raf;

  function rand(a, b) { return Math.random() * (b - a) + a; }
  function hex2rgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }
  function rgba(hex, a) {
    const { r, g, b } = hex2rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* Stars */
  function buildStars() {
    stars = [];
    const n = Math.floor(W * H / 2800);
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
          ? (Math.random() < 0.6 ? C.silver : C.emeraldDim)
          : '#FFFFFF',
      });
    }
  }

  /* Wispy drift clouds (very faint nebula smears) */
  function buildClouds() {
    driftClouds = [];
    for (let i = 0; i < 4; i++) {
      driftClouds.push({
        x: rand(W * 0.05, W * 0.95),
        y: rand(H * 0.05, H * 0.55),
        rx: rand(W * 0.12, W * 0.22),
        ry: rand(H * 0.06, H * 0.14),
        angle: rand(-0.3, 0.3),
        color: i % 2 === 0 ? C.emerald : C.silver,
        alpha: rand(0.012, 0.026),
      });
    }
  }

  /* Shooting stars */
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

  /* Paint sky gradient */
  function drawSky() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.28, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    g.addColorStop(0, 'rgba(8,20,12,0.97)');
    g.addColorStop(0.3, 'rgba(5,14,8,0.99)');
    g.addColorStop(0.7, 'rgba(3,9,5,1)');
    g.addColorStop(1, 'rgba(2,6,3,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* Paint nebula smears */
  function drawClouds() {
    driftClouds.forEach(c => {
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

  /* Paint stars */
  function drawStars() {
    frame++;
    stars.forEach(s => {
      const op = s.base + Math.sin(frame * s.speed + s.phase) * s.base * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
      ctx.fillStyle = s.tint === '#FFFFFF'
        ? `rgba(255,255,255,${op})`
        : rgba(s.tint, op);
      ctx.fill();

      if (s.sz > 1.3 && op > 0.55) {
        const arm = s.sz * 2.8;
        ctx.strokeStyle = `rgba(255,255,255,${op * 0.28})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(s.x - arm, s.y); ctx.lineTo(s.x + arm, s.y);
        ctx.moveTo(s.x, s.y - arm); ctx.lineTo(s.x, s.y + arm);
        ctx.stroke();
      }
    });
  }

  /* Paint shooting stars */
  function drawShooters() {
    shooters = shooters.filter(s => s.op > 0);
    shooters.forEach(s => {
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
      s.x += s.vx; s.y += s.vy; s.op -= s.decay;
    });
    if (frame % 300 === 0 && Math.random() < 0.55) spawnShooter();
  }

  /* Paint far treeline on canvas — reinforces CSS forest layers */
  function drawTreeline() {
    ctx.save();
    // Moonlit horizon glow
    const hg = ctx.createLinearGradient(0, H * 0.72, 0, H);
    hg.addColorStop(0, 'rgba(200,216,192,0.04)');
    hg.addColorStop(0.3, 'rgba(46,139,87,0.02)');
    hg.addColorStop(1, 'rgba(2,10,5,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Very faint canopy shimmer line
    ctx.strokeStyle = 'rgba(200,216,192,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Jagged silhouette top
    ctx.moveTo(0, H * 0.78);
    let px = 0;
    while (px < W) {
      const step = rand(8, 20);
      const ht = rand(H * 0.72, H * 0.82);
      ctx.lineTo(px, ht);
      px += step;
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
      resize(); buildStars(); buildClouds(); animate();
    }, 200);
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   2. FIREFLIES
   ══════════════════════════════════════════════════════════════════════ */
(function initFireflies() {
  const container = document.getElementById('fireflies');
  if (!container) return;
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
    // Occasionally emerald-tinted firefly
    if (Math.random() < 0.25) {
      ff.style.background = '#4DBF82';
      ff.style.boxShadow = '0 0 6px 2px #4DBF82';
    }
    ff.style.cssText += `
      left: ${x}%; top: ${y}%;
      --ff-dur: ${dur}s;
      --ff-delay: ${del}s;
      --ff-dx: ${dx}px;
      --ff-dy: ${dy}px;
      --ff-dx2: ${dx2}px;
      --ff-dy2: ${dy2}px;
      animation-delay: ${del}s;
      animation-duration: ${dur}s;
    `;
    container.appendChild(ff);
  }
})();


/* ══════════════════════════════════════════════════════════════════════
   3. CUSTOM CURSOR
   ══════════════════════════════════════════════════════════════════════ */
(function initCursor() {
  const el = document.createElement('div');
  el.id = 'cursor';
  el.textContent = '☽';
  document.body.appendChild(el);
  document.body.style.cursor = 'none';

  let cx = -100, cy = -100, tx = -100, ty = -100;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function tick() {
    cx = lerp(cx, tx, 0.16);
    cy = lerp(cy, ty, 0.16);
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.querySelectorAll('a,button,[role="button"]').forEach(node => {
    node.style.cursor = 'none';
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

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   5. HERO ENTRY ANIMATION
   ══════════════════════════════════════════════════════════════════════ */
(function initHero() {
  // Kicker
  const kicker = document.querySelector('.hero__kicker');
  if (kicker) setTimeout(() => {
    kicker.style.opacity = '1';
    kicker.style.animation = 'fade-up 0.8s var(--ease-forest) forwards';
  }, 300);

  // Headline lines
  document.querySelectorAll('.hero__hl-line').forEach(line => {
    const d = parseInt(line.dataset.d || 0);
    setTimeout(() => line.classList.add('vis'), 500 + d);
  });

  // Body + CTA
  document.querySelectorAll('.reveal-fade[data-d]').forEach(el => {
    if (!el.closest('.hero')) return;
    const d = parseInt(el.dataset.d || 0);
    setTimeout(() => el.classList.add('vis'), 500 + d);
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   6. INTERSECTION OBSERVER — scroll reveals + counters
   ══════════════════════════════════════════════════════════════════════ */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('vis');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  // Tag everything that should reveal (excluding hero, which has its own timing)
  document.querySelectorAll('.reveal-fade, .reveal-card').forEach(el => {
    if (el.closest('.hero')) return;
    // Delay based on data-d if present
    const d = parseInt(el.dataset.d || 0);
    if (d) el.style.transitionDelay = (d / 1000) + 's';
    obs.observe(el);
  });

  // Tag other elements
  [
    '.pcard', '.how__step', '.mtile', '.tcard',
    '.about__words > *', '.about__pillars',
    '.fcol', '.footer__brand',
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal-fade') && !el.classList.contains('reveal-card')) {
        el.classList.add('reveal-fade');
        el.style.transitionDelay = (i * 0.08) + 's';
        if (!el.closest('.hero')) obs.observe(el);
      }
    });
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   7. ANIMATED COUNTERS
   ══════════════════════════════════════════════════════════════════════ */
(function initCounters() {
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function animateNum(el, target, dur = 2200) {
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    })(start);
  }

  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const t = parseInt(e.target.dataset.target, 10);
      if (!isNaN(t)) animateNum(e.target, t);
      cObs.unobserve(e.target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => cObs.observe(el));
})();


/* ══════════════════════════════════════════════════════════════════════
   8. CAROUSEL FACTORY
   ══════════════════════════════════════════════════════════════════════ */
function makeCarousel({ trackId, prevId, nextId, dotsId, cardSel, perView, gapPx, autoplay }) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsEl = document.getElementById(dotsId);
  if (!track || !prev || !next || !dotsEl) return;

  const cards = [...track.querySelectorAll(cardSel)];
  if (!cards.length) return;

  const maxIdx = Math.max(0, cards.length - perView);
  let cur = 0;

  // Build dots
  for (let i = 0; i <= maxIdx; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
  }

  function cardW() {
    return cards[0].offsetWidth + gapPx;
  }

  function go(idx) {
    cur = Math.max(0, Math.min(idx, maxIdx));
    track.style.transform = `translateX(-${cur * cardW()}px)`;
    dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));

  // Touch swipe
  let tx0 = 0;
  track.parentElement.addEventListener('touchstart', e => { tx0 = e.changedTouches[0].clientX; }, { passive: true });
  track.parentElement.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 44) go(dx < 0 ? cur + 1 : cur - 1);
  }, { passive: true });

  if (autoplay) {
    setInterval(() => go(cur < maxIdx ? cur + 1 : 0), autoplay);
  }
}

// Courses
makeCarousel({
  trackId: 'courses-track', prevId: 'c-prev', nextId: 'c-next', dotsId: 'c-dots',
  cardSel: '.ccard', perView: Math.max(1, Math.floor(window.innerWidth / 348)),
  gapPx: 24, autoplay: 5500,
});

// Testimonials
makeCarousel({
  trackId: 'testi-track', prevId: 't-prev', nextId: 't-next', dotsId: 't-dots',
  cardSel: '.tcard', perView: Math.max(1, Math.floor(window.innerWidth / 588)),
  gapPx: 24, autoplay: 0,
});


/* ══════════════════════════════════════════════════════════════════════
   9. MOON PARALLAX + EYE TRACKING
   ══════════════════════════════════════════════════════════════════════ */
(function initMoonInteractions() {
  const heroMoon = document.getElementById('hero-moon');

  // Parallax on scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      if (heroMoon) {
        heroMoon.style.transform = `translateY(${window.scrollY * 0.22}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  // Eye follow
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.mm-face').forEach(face => {
      const r = face.getBoundingClientRect();
      const fcx = r.left + r.width / 2;
      const fcy = r.top + r.height / 2;
      const dx = e.clientX - fcx;
      const dy = e.clientY - fcy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max = 1.4;
      const mx = dist > 0 ? (dx / dist) * Math.min(dist * 0.025, max) : 0;
      const my = dist > 0 ? (dy / dist) * Math.min(dist * 0.025, max) : 0;
      face.querySelectorAll('.mm-eye').forEach(eye => {
        eye.style.transform = `translate(${mx}px,${my}px)`;
      });
    });
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   10. MOON BLINK
   ══════════════════════════════════════════════════════════════════════ */
(function initBlink() {
  function blink(face) {
    face.querySelectorAll('.mm-eye').forEach(e => {
      const base = e.style.transform || '';
      e.style.transform = base + ' scaleY(0.08)';
      setTimeout(() => { e.style.transform = base; }, 110);
    });
  }
  function scheduleBlink(face) {
    setTimeout(() => { blink(face); scheduleBlink(face); }, 3000 + Math.random() * 4500);
  }
  document.querySelectorAll('.mm-face').forEach(face => scheduleBlink(face));
})();


/* ══════════════════════════════════════════════════════════════════════
   11. CARD AMBIENT GLOW (mouse-tracked radial)
   ══════════════════════════════════════════════════════════════════════ */
(function initCardGlow() {
  const selector = '.ccard, .pcard, .tcard, .mcard, .mtile';
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.background = `
        radial-gradient(circle at ${x}% ${y}%, rgba(200,216,192,0.055) 0%, transparent 55%),
        var(--bg-card)
      `;
    });
    card.addEventListener('mouseleave', () => { card.style.background = ''; });
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   12. PITI SPARK BURST on primary button hover
   ══════════════════════════════════════════════════════════════════════ */
(function initSparks() {
  const kf = document.createElement('style');
  kf.textContent = `
    @keyframes spark-out {
      0%   { transform: translate(0,0) scale(0); opacity:1; }
      70%  { opacity:0.8; }
      100% { transform: translate(var(--spx),var(--spy)) scale(1.4); opacity:0; }
    }
  `;
  document.head.appendChild(kf);

  document.querySelectorAll('.btn--forest').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      for (let i = 0; i < 7; i++) {
        const sp = document.createElement('span');
        sp.textContent = Math.random() < 0.5 ? '✦' : '✧';
        const spx = (Math.random() - 0.5) * 48;
        const spy = (Math.random() - 0.7) * 48;
        sp.style.cssText = `
          position:absolute;
          color:${Math.random() < 0.5 ? C.goldBright : C.silverBright};
          font-size:${7 + Math.random() * 7}px;
          pointer-events:none; z-index:20;
          left:${15 + Math.random() * 70}%; top:${10 + Math.random() * 80}%;
          --spx:${spx}px; --spy:${spy}px;
          animation: spark-out 0.65s ease forwards;
          filter: drop-shadow(0 0 3px ${C.gold});
        `;
        btn.appendChild(sp);
        setTimeout(() => sp.remove(), 700);
      }
    });
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   13. ACTIVE NAV HIGHLIGHT
   ══════════════════════════════════════════════════════════════════════ */
(function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav__links a[href^="#"]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + e.target.id
            ? C.silverBright : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
})();


/* ══════════════════════════════════════════════════════════════════════
   14. MOONLIGHT WASH SCROLL RESPONSE
   ══════════════════════════════════════════════════════════════════════ */
(function initWashParallax() {
  const wash = document.querySelector('.moonlight-wash');
  if (!wash) return;
  window.addEventListener('scroll', () => {
    const ratio = Math.min(window.scrollY / (document.body.scrollHeight * 0.25), 1);
    wash.style.opacity = 0.5 + ratio * 0.4;
  }, { passive: true });
})();


/* ══════════════════════════════════════════════════════════════════════
   15. SMOOTH FADE-IN ON LOAD
   ══════════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.9s ease';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  }));
});