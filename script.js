/* ═══════════════════════════════════════════════════════════════════════
   MERITMOON — SCRIPT.JS
   Starfield, carousels, scroll animations, counters, cursor, nav
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── DESIGN TOKEN MIRRORS (match CSS vars for canvas/JS use) ──────────── */
const COLORS = {
  silver: '#C0C8D8',
  emerald: '#3DBA7E',
  ruby: '#C9445A',
  gold: '#E8C97E',
  silverDim: '#7A8494',
  emeraldDim: '#1E6B49',
  skyDeep: '#03050D',
  skyMid: '#070C1A',
};

/* ─── STARFIELD CANVAS ──────────────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [], shootingStars = [];
  let animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Star types: tiny dim (far), medium (mid), bright (close)
  function createStar() {
    const tier = Math.random();
    let size, opacity, twinkleSpeed;
    if (tier < 0.65) {
      size = rand(0.3, 0.7); opacity = rand(0.1, 0.3); twinkleSpeed = rand(0.003, 0.006);
    } else if (tier < 0.9) {
      size = rand(0.7, 1.2); opacity = rand(0.25, 0.55); twinkleSpeed = rand(0.004, 0.009);
    } else {
      size = rand(1.2, 2.0); opacity = rand(0.5, 0.9); twinkleSpeed = rand(0.006, 0.012);
    }
    return {
      x: rand(0, W), y: rand(0, H),
      size,
      baseOpacity: opacity,
      opacity,
      twinkleSpeed,
      phase: rand(0, Math.PI * 2),
      // Very rarely, a star has a color tint
      color: Math.random() < 0.08
        ? (Math.random() < 0.5 ? COLORS.silver : COLORS.emeraldDim)
        : '#FFFFFF',
    };
  }

  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 3200);
    for (let i = 0; i < count; i++) stars.push(createStar());
  }

  function createShootingStar() {
    const angle = rand(-0.4, 0.1); // mostly going down-right
    const speed = rand(8, 18);
    return {
      x: rand(W * 0.1, W * 0.9),
      y: rand(0, H * 0.4),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: rand(60, 140),
      opacity: 1,
      decay: rand(0.012, 0.022),
    };
  }

  function drawBackground() {
    // Deep night sky gradient
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    grad.addColorStop(0, 'rgba(10, 16, 35, 0.95)');
    grad.addColorStop(0.4, 'rgba(5, 9, 20, 0.98)');
    grad.addColorStop(1, 'rgba(3, 5, 13, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawNebula() {
    // Subtle nebula wisps
    const nebulas = [
      { x: W * 0.2, y: H * 0.25, r: W * 0.18, color: 'rgba(61,186,126,0.025)' },
      { x: W * 0.75, y: H * 0.15, r: W * 0.14, color: 'rgba(192,200,216,0.02)' },
      { x: W * 0.5, y: H * 0.6, r: W * 0.22, color: 'rgba(201,68,90,0.018)' },
    ];
    nebulas.forEach(n => {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, n.color);
      g.addColorStop(0.5, n.color.replace(/[\d.]+\)$/, '0.01)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.r, n.r * 0.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let frame = 0;
  function drawStars() {
    frame++;
    stars.forEach(s => {
      s.opacity = s.baseOpacity + Math.sin(frame * s.twinkleSpeed + s.phase) * (s.baseOpacity * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color === '#FFFFFF'
        ? `rgba(255,255,255,${s.opacity})`
        : hexToRgba(s.color, s.opacity);
      ctx.fill();

      // Cross sparkle for brighter stars
      if (s.size > 1.4 && s.opacity > 0.6) {
        const arm = s.size * 3;
        ctx.strokeStyle = `rgba(255,255,255,${s.opacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - arm, s.y); ctx.lineTo(s.x + arm, s.y);
        ctx.moveTo(s.x, s.y - arm); ctx.lineTo(s.x, s.y + arm);
        ctx.stroke();
      }
    });
  }

  function drawShootingStars() {
    shootingStars = shootingStars.filter(s => s.opacity > 0);
    shootingStars.forEach(s => {
      const tailX = s.x - s.vx * (s.length / 15);
      const tailY = s.y - s.vy * (s.length / 15);
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, `rgba(232,240,255,${s.opacity})`);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.opacity * 1.5;
      ctx.stroke();

      s.x += s.vx; s.y += s.vy;
      s.opacity -= s.decay;
    });

    // Spawn occasional shooting star
    if (frame % 280 === 0 && Math.random() < 0.6) {
      shootingStars.push(createShootingStar());
    }
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawNebula();
    drawStars();
    drawShootingStars();
    animId = requestAnimationFrame(animate);
  }

  resize();
  initStars();
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      resize();
      initStars();
      animate();
    }, 200);
  });
})();

/* ─── CUSTOM CURSOR ──────────────────────────────────────────────────────── */
(function initCursor() {
  let cx = -100, cy = -100;
  let tx = -100, ty = -100;

  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function updateCursor() {
    cx = lerp(cx, tx, 0.18);
    cy = lerp(cy, ty, 0.18);
    document.body.style.setProperty('--cx', cx + 'px');
    document.body.style.setProperty('--cy', cy + 'px');

    // Move the ::after pseudo via direct DOM — use a small overlay div instead
    if (cursorEl) {
      cursorEl.style.left = cx + 'px';
      cursorEl.style.top = cy + 'px';
    }
    requestAnimationFrame(updateCursor);
  }

  // Create real cursor element
  const cursorEl = document.createElement('div');
  cursorEl.style.cssText = `
    position: fixed; top: 0; left: 0; width: 28px; height: 28px;
    pointer-events: none; z-index: 99999;
    transform: translate(-50%,-50%);
    font-size: 18px; line-height: 28px; text-align: center;
    color: ${COLORS.silver};
    text-shadow: 0 0 12px ${COLORS.silver};
    transition: transform 0.2s, color 0.2s;
    user-select: none;
  `;
  cursorEl.textContent = '☽';
  document.body.appendChild(cursorEl);

  // Remove default ::after cursor handling — we use the div
  document.body.style.cursor = 'none';
  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.style.cursor = 'none';
    el.addEventListener('mouseenter', () => {
      cursorEl.style.transform = 'translate(-50%,-50%) scale(1.5) rotate(-20deg)';
      cursorEl.style.color = COLORS.gold;
      cursorEl.style.textShadow = `0 0 16px ${COLORS.gold}`;
    });
    el.addEventListener('mouseleave', () => {
      cursorEl.style.transform = 'translate(-50%,-50%) scale(1)';
      cursorEl.style.color = COLORS.silver;
      cursorEl.style.textShadow = `0 0 12px ${COLORS.silver}`;
    });
  });

  requestAnimationFrame(updateCursor);
})();

/* ─── NAVIGATION ──────────────────────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
})();

/* ─── HERO ENTRY ANIMATION ────────────────────────────────────────────────── */
(function initHeroAnimation() {
  const moon = document.getElementById('hero-moon');
  if (moon) {
    setTimeout(() => moon.classList.add('visible'), 300);
  }

  // Stagger the .line-fade elements
  document.querySelectorAll('.line-fade').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => {
      el.classList.add('visible');
    }, 600 + delay);
  });
})();

/* ─── SCROLL REVEAL ──────────────────────────────────────────────────────── */
(function initScrollReveal() {
  // Add fade-in to key elements
  const selectors = [
    '.section-label', '.section-title', '.section-sub',
    '.about__content > p', '.about__pillars',
    '.dana-banner', '.dana-banner__stats',
    '.footer__brand', '.footer__col',
    '.souls-quote', '.souls-card',
    '.pillar', '.download-cta .section-title',
    '.download-cta .section-sub', '.cta-btns',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('fade-in')) {
        el.classList.add('fade-in');
        el.style.transitionDelay = (i * 0.07) + 's';
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in, .commitment__card').forEach(el => {
    observer.observe(el);
  });
})();

/* ─── ANIMATED COUNTERS ───────────────────────────────────────────────────── */
(function initCounters() {
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(el, target, duration = 2000) {
    const start = performance.now();
    const isFloat = String(target).includes('.');

    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const value = Math.floor(easeOutQuart(elapsed) * target);
      el.textContent = value.toLocaleString();
      if (elapsed < 1) requestAnimationFrame(step);
      else el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      if (!isNaN(target)) animateCounter(el, target, 2200);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => {
    counterObserver.observe(el);
  });
})();

/* ─── GENERIC CAROUSEL FACTORY ────────────────────────────────────────────── */
function createCarousel({ trackId, prevId, nextId, dotsId, cardSelector, visibleCount, gap }) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsEl = document.getElementById(dotsId);
  if (!track || !prev || !next || !dotsEl) return;

  const cards = track.querySelectorAll(cardSelector);
  if (!cards.length) return;

  let current = 0;
  const total = cards.length;
  const maxIndex = Math.max(0, total - visibleCount);

  // Build dots
  const dotCount = maxIndex + 1;
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  }

  function getCardWidth() {
    const card = cards[0];
    const style = window.getComputedStyle(card);
    return card.offsetWidth + parseInt(style.marginRight || gap);
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex));
    const offset = current * (getCardWidth() + gap);
    track.style.transform = `translateX(-${offset}px)`;
    dotsEl.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  // Touch / swipe
  let touchStartX = 0;
  track.parentElement.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  track.parentElement.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Auto-advance (features carousel only)
  if (trackId === 'features-track') {
    setInterval(() => goTo(current < maxIndex ? current + 1 : 0), 5000);
  }
}

/* ─── FEATURES CAROUSEL ───────────────────────────────────────────────────── */
createCarousel({
  trackId: 'features-track',
  prevId: 'feat-prev',
  nextId: 'feat-next',
  dotsId: 'feat-dots',
  cardSelector: '.course-card',
  visibleCount: Math.floor(window.innerWidth / 368),
  gap: 28,
});

/* ─── TESTIMONIALS CAROUSEL ──────────────────────────────────────────────── */
createCarousel({
  trackId: 'testi-track',
  prevId: 'testi-prev',
  nextId: 'testi-next',
  dotsId: 'testi-dots',
  cardSelector: '.testi-card',
  visibleCount: Math.floor(window.innerWidth / 608),
  gap: 28,
});

/* ─── MOON PARALLAX ON SCROLL ─────────────────────────────────────────────── */
(function initParallax() {
  const heroMoon = document.getElementById('hero-moon');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (heroMoon) {
          heroMoon.style.transform = `translateY(${scrollY * 0.25}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ─── MOON EYES FOLLOW CURSOR ─────────────────────────────────────────────── */
(function initEyeTracking() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.moon-face').forEach(face => {
      const rect = face.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = 1.5;
      const mx = dist > 0 ? (dx / dist) * Math.min(dist * 0.03, maxMove) : 0;
      const my = dist > 0 ? (dy / dist) * Math.min(dist * 0.03, maxMove) : 0;

      face.querySelectorAll('.moon-eye').forEach(eye => {
        eye.style.transform = `translate(${mx}px, ${my}px)`;
      });
    });
  });
})();

/* ─── NIMITTA LIGHT PULSE ON HERO SCROLL ─────────────────────────────────── */
(function initNimitta() {
  const overlay = document.querySelector('.nimitta-overlay');
  if (!overlay) return;
  // Subtle pulse responding to scroll depth
  let scrollRatio = 0;
  window.addEventListener('scroll', () => {
    scrollRatio = Math.min(window.scrollY / (document.body.scrollHeight * 0.3), 1);
    overlay.style.opacity = 0.3 + scrollRatio * 0.5;
  }, { passive: true });
})();

/* ─── MOON SMILE EXTRA BLINK ANIMATION ──────────────────────────────────── */
(function initBlink() {
  function blink(face) {
    if (!face) return;
    const eyes = face.querySelectorAll('.moon-eye');
    // Squash eyes to simulate blink
    eyes.forEach(e => { e.style.transform += ' scaleY(0.1)'; });
    setTimeout(() => {
      eyes.forEach(e => { e.style.transform = e.style.transform.replace(' scaleY(0.1)', ''); });
    }, 120);
  }

  function scheduleBlinkForFace(face) {
    const delay = Math.random() * 4000 + 3000;
    setTimeout(() => {
      blink(face);
      scheduleBlinkForFace(face);
    }, delay);
  }

  document.querySelectorAll('.moon-face').forEach(face => {
    scheduleBlinkForFace(face);
  });
})();

/* ─── STREAK COUNTER FLOATING ANIMATION ─────────────────────────────────── */
(function initStreakGlow() {
  const streakNum = document.querySelector('.streak-number');
  if (!streakNum) return;

  const glowObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      // Add a pulsing glow once visible
      streakNum.style.animation = 'none';
      let pulseCount = 0;
      const interval = setInterval(() => {
        streakNum.style.filter = pulseCount % 2 === 0
          ? 'drop-shadow(0 0 20px rgba(61,186,126,0.8))'
          : 'drop-shadow(0 0 6px rgba(61,186,126,0.3))';
        pulseCount++;
        if (pulseCount > 6) {
          clearInterval(interval);
          streakNum.style.filter = '';
        }
      }, 200);
      glowObs.unobserve(streakNum);
    }
  }, { threshold: 0.5 });
  glowObs.observe(streakNum);
})();

/* ─── SMOOTH ACTIVE NAV HIGHLIGHT ────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');

  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + entry.target.id
            ? COLORS.silver
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObs.observe(s));
})();

/* ─── PITI SPARKLE BURST ON CTA HOVER ───────────────────────────────────── */
(function initPitiBurst() {
  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement('span');
        spark.textContent = Math.random() < 0.5 ? '✦' : '✧';
        spark.style.cssText = `
          position: absolute;
          color: ${Math.random() < 0.5 ? COLORS.gold : COLORS.silver};
          font-size: ${8 + Math.random() * 8}px;
          pointer-events: none;
          z-index: 999;
          left: ${20 + Math.random() * 60}%;
          top: ${10 + Math.random() * 80}%;
          animation: spark-pop 0.6s ease forwards;
          filter: drop-shadow(0 0 4px ${COLORS.gold});
        `;
        btn.appendChild(spark);
        setTimeout(() => spark.remove(), 700);
      }
    });
  });

  // Add the spark-pop keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spark-pop {
      0%   { transform: translate(0,0) scale(0); opacity: 1; }
      60%  { opacity: 1; }
      100% { transform: translate(${randomDir()}px, ${randomDir()}px) scale(1.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  function randomDir() { return (Math.random() - 0.5) * 40; }
})();

/* ─── COURSE CARD GLOW MOUSE TRACKING ───────────────────────────────────── */
(function initCardGlowTrack() {
  document.querySelectorAll('.course-card, .commitment__card, .testi-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
      card.style.background = `
        radial-gradient(circle at ${x}% ${y}%, rgba(192,200,216,0.06) 0%, transparent 60%),
        var(--card-bg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
})();

/* ─── MOON ROTATION ON SCROLL ────────────────────────────────────────────── */
(function initMoonRotation() {
  const moons = document.querySelectorAll('.logo-moon, .about__big-moon');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    moons.forEach(m => {
      const rotation = (scrollY * 0.05) % 360;
      m.style.setProperty('--moon-rot', rotation + 'deg');
    });
  }, { passive: true });
})();

/* ─── FOOTER MOON DRIFT ──────────────────────────────────────────────────── */
(function initFooterMoonDrift() {
  const footerMoon = document.querySelector('.footer .logo-moon');
  if (!footerMoon) return;
  let hovered = false;
  footerMoon.addEventListener('mouseenter', () => {
    hovered = true;
    let angle = 0;
    const drift = setInterval(() => {
      if (!hovered) { clearInterval(drift); return; }
      angle += 2;
      footerMoon.style.transform = `rotate(${angle}deg)`;
    }, 16);
    footerMoon.addEventListener('mouseleave', () => {
      hovered = false;
      footerMoon.style.transform = '';
    }, { once: true });
  });
})();

/* ─── SUBTLE AUDIO HINT (silent — just prepares for future use) ──────────── */
// No audio autoplay — respects user preference. Reserved for future ambient bell feature.

/* ─── PAGE LOAD COMPLETE ─────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.8s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
});