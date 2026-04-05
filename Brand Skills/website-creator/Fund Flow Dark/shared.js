/* Fund Flow — Shared JS
   Tab navigation, scroll reveals, FAQ accordion, nav behavior.
   No heavy libraries. Clean and fast. */

// ============================================
// Nav scroll shadow
// ============================================
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
});

// ============================================
// Tab Navigation
// ============================================
function initTabs(navSelector, panelsId) {
  const navEl = document.querySelector(navSelector);
  if (!navEl) return;

  const tabBtns = navEl.querySelectorAll('.tab-btn');
  const panelsContainer = document.getElementById(panelsId);
  if (!panelsContainer) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all tabs in this group
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Determine tab id
      const tabId = btn.dataset.tab || btn.dataset.audienceTab;

      // Hide all panels
      panelsContainer.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      // Show target
      const prefix = btn.dataset.tab ? 'panel-' : 'audience-';
      const target = document.getElementById(prefix + tabId);
      if (target) target.classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs('#tabNav', 'platformPanels');
  initTabs('#audienceTabNav', 'audiencePanels');
});

// ============================================
// FAQ Accordion
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // Close all other items
      document.querySelectorAll('.faq-item.open').forEach(i => {
        if (i !== item) i.classList.remove('open');
      });

      // Toggle current
      item.classList.toggle('open', !wasOpen);
    });
  });
});

// ============================================
// Scroll Reveals — Intersection Observer (Enhanced)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const allRevealables = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-parent, .trust-logos, .compare-grid');
  if (!allRevealables.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });

  allRevealables.forEach(el => observer.observe(el));
});

// ============================================
// Counter Animation — Numbers tick up on scroll
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));

  function animateCounter(el) {
    const text = el.textContent.trim();
    // Extract number, prefix, suffix (e.g. "$6,500" -> prefix="$", num=6500, suffix="")
    const match = text.match(/^([^\d]*?)([\d,.]+)(.*)$/);
    if (!match) return;

    const prefix = match[1];
    const rawNum = match[2];
    const suffix = match[3];
    const hasComma = rawNum.includes(',');
    const target = parseFloat(rawNum.replace(/,/g, ''));
    const isDecimal = rawNum.includes('.');
    const decimals = isDecimal ? rawNum.split('.')[1].length : 0;
    const duration = 1800;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      let current = eased * target;

      if (!isDecimal) current = Math.round(current);
      else current = parseFloat(current.toFixed(decimals));

      let formatted = isDecimal ? current.toFixed(decimals) : String(Math.round(current));
      if (hasComma) {
        formatted = Number(formatted).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }

      el.textContent = prefix + formatted + suffix;

      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }
});

// ============================================
// Placeholder for missing screenshots
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[src*="screenshots/"]').forEach(img => {
    const replaceWithPlaceholder = () => {
      const label = img.alt || 'Product Screenshot';
      const short = label.length > 50 ? label.substring(0, 47) + '...' : label;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
        <rect width="800" height="500" fill="#111B2E"/>
        <rect x="16" y="16" width="768" height="468" rx="10" fill="#162236" stroke="#1E3048" stroke-width="1"/>
        <rect x="16" y="16" width="768" height="32" rx="10" fill="#1A2940"/>
        <circle cx="36" cy="32" r="5" fill="#2A4060"/>
        <circle cx="52" cy="32" r="5" fill="#2A4060"/>
        <circle cx="68" cy="32" r="5" fill="#2A4060"/>
        <text x="400" y="270" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" fill="#4A6080">${short}</text>
      </svg>`;
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
    };

    img.addEventListener('error', replaceWithPlaceholder);
    img.addEventListener('load', () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) replaceWithPlaceholder();
    });
    if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) replaceWithPlaceholder();
  });
});

// ============================================
// Hero Phase Auto-Cycling (Mosey-style)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const phaseBtns = document.querySelectorAll('.hero-phase-btn');
  const phaseCards = document.querySelectorAll('.hero-cards-phase');
  if (!phaseBtns.length || !phaseCards.length) return;

  const phases = ['find', 'raise', 'manage'];
  let currentIndex = 0;
  let cycleTimer = null;
  const PHASE_DURATION = 6000;

  function setPhase(index) {
    currentIndex = index;

    // Update buttons
    phaseBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      const bar = btn.querySelector('.hero-phase-bar');
      if (bar) {
        bar.style.animation = 'none';
        bar.offsetHeight;
        if (i === index) {
          bar.style.animation = `phaseProgress ${PHASE_DURATION}ms linear forwards`;
        } else {
          bar.style.animation = '';
          bar.style.width = '0%';
        }
      }
    });

    // Update card groups
    phaseCards.forEach(group => {
      group.classList.toggle('active', group.dataset.phase === phases[index]);
    });

    // Update building illustrations
    document.querySelectorAll('.hero-building').forEach(bldg => {
      bldg.classList.toggle('active', bldg.dataset.building === phases[index]);
    });
  }

  function nextPhase() {
    setPhase((currentIndex + 1) % phases.length);
  }

  function startCycling() {
    stopCycling();
    cycleTimer = setInterval(nextPhase, PHASE_DURATION);
  }

  function stopCycling() {
    if (cycleTimer) clearInterval(cycleTimer);
  }

  // Click handlers
  phaseBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setPhase(i);
      startCycling();
    });
  });

  // Initial state
  setPhase(0);
  startCycling();

  // Pause on hover
  const heroAnim = document.getElementById('heroAnimation');
  if (heroAnim) {
    heroAnim.addEventListener('mouseenter', stopCycling);
    heroAnim.addEventListener('mouseleave', startCycling);
  }
});

// ============================================
// Testimonials Carousel
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const currentEl = document.getElementById('testimonialCurrent');
  if (!track || !prevBtn || !nextBtn) return;

  const slides = track.querySelectorAll('.testimonial-slide');
  const total = slides.length;
  let current = 0;
  let slidesPerView = 3;

  function getSlidesPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function update() {
    slidesPerView = getSlidesPerView();
    const maxIndex = Math.max(0, total - slidesPerView);
    current = Math.min(current, maxIndex);

    const gap = 24; // 1.5rem
    const slideWidth = track.parentElement.offsetWidth / slidesPerView - (gap * (slidesPerView - 1) / slidesPerView);
    const offset = current * (slideWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    if (currentEl) currentEl.textContent = String(current + 1).padStart(2, '0');
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= maxIndex;
  }

  prevBtn.addEventListener('click', () => { current--; update(); });
  nextBtn.addEventListener('click', () => { current++; update(); });

  // Touch/swipe support
  let startX = 0;
  let isDragging = false;
  track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) { current = Math.min(current + 1, total - getSlidesPerView()); }
      else { current = Math.max(current - 1, 0); }
      update();
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  update();

  // Auto-advance every 5 seconds
  let autoTimer = setInterval(() => {
    const maxIndex = Math.max(0, total - getSlidesPerView());
    current = current >= maxIndex ? 0 : current + 1;
    update();
  }, 5000);

  // Pause on hover
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.parentElement.addEventListener('mouseleave', () => {
    autoTimer = setInterval(() => {
      const maxIndex = Math.max(0, total - getSlidesPerView());
      current = current >= maxIndex ? 0 : current + 1;
      update();
    }, 5000);
  });
});

// ============================================
// Mobile Menu Toggle
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
      toggle.classList.toggle('active');
    });
  }
});

// ============================================
// Pricing Toggle Tabs
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtns = document.querySelectorAll('.pricing-toggle-btn');
  if (!toggleBtns.length) return;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.pricingTab;

      // Update active button
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show matching panel
      document.querySelectorAll('.pricing-tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === 'pricing-' + tab);
      });
    });
  });
});

// ============================================
// Smooth scroll for anchor links
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
});

// ============================================
// Scroll-driven video scrub
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.scroll-video-section');
  const video = document.querySelector('.scroll-video');
  if (!section || !video) return;

  // Reveal panels with IntersectionObserver
  const panels = section.querySelectorAll('.scroll-panel');
  if (panels.length) {
    const panelObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          panelObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    panels.forEach(p => panelObs.observe(p));
  }

  // Wait for video metadata to load
  video.addEventListener('loadedmetadata', () => { bindScroll(); });
  if (video.readyState >= 1) bindScroll();

  function bindScroll() {
    let targetTime = 0;
    let currentTime = 0;
    let velocity = 0;
    const DAMPING = 0.92;   // higher = more momentum, smoother
    const STIFFNESS = 0.04; // lower = softer spring, smoother

    function onScroll() {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));

      if (video.duration) {
        targetTime = progress * video.duration;
      }
    }

    // Spring-damper animation — much smoother than simple lerp
    function animate() {
      const diff = targetTime - currentTime;
      velocity = velocity * DAMPING + diff * STIFFNESS;
      currentTime += velocity;

      if (Math.abs(diff) > 0.005 || Math.abs(velocity) > 0.005) {
        video.currentTime = Math.max(0, currentTime);
      }
      requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    currentTime = targetTime;
    if (video.duration) video.currentTime = currentTime;
    animate();
  }
});

// ============================================
// Network Effect — Interactive animated lender connections
// ============================================
(function() {
  const section = document.getElementById('networkEffect');
  const canvas = document.querySelector('.network-canvas');
  const profilesContainer = document.querySelector('.network-profiles');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');

  let nodes = [];
  let edges = [];
  let profileNodes = [];  // indices of nodes that have profile photos
  let profileEls = [];    // DOM elements for profiles
  let W = 0, H = 0;
  let animProgress = 0;
  let started = false;
  let mouse = { x: -1000, y: -1000, active: false };
  const MOUSE_RADIUS = 180;
  const MOUSE_FORCE = 0.08;
  const RETURN_FORCE = 0.03;

  // Profile data — realistic private lenders
  const PROFILES = [
    { name: 'Marcus Chen', role: 'Private Lender · Phoenix, AZ', stat: 'Funded 12 deals · $1.8M total', img: 1 },
    { name: 'Rachel Torres', role: 'Real Estate Investor · Austin, TX', stat: 'Funded 8 deals · $2.4M in 2025', img: 5 },
    { name: 'David Okafor', role: 'Family Office · Atlanta, GA', stat: 'Funded 23 deals · $6.2M total', img: 3 },
    { name: 'Sarah Mitchell', role: 'Accredited Investor · Denver, CO', stat: 'Funded 5 deals · $750K total', img: 9 },
    { name: 'James Whitfield', role: 'Private Lender · Miami, FL', stat: 'Funded 15 deals · $3.1M total', img: 11 },
    { name: 'Linda Park', role: 'HNW Investor · Seattle, WA', stat: 'Funded 6 deals · $1.2M in 2026', img: 16 },
    { name: 'Robert Hayes', role: 'Retired Executive · Charlotte, NC', stat: 'Funded 9 deals · $2.8M total', img: 12 },
    { name: 'Priya Sharma', role: 'Angel Investor · San Jose, CA', stat: 'Funded 18 deals · $4.5M total', img: 25 },
    { name: 'Antonio Reyes', role: 'Private Lender · Houston, TX', stat: 'Funded 7 deals · $890K total', img: 33 },
    { name: 'Michelle Brooks', role: 'Real Estate Fund LP · Chicago, IL', stat: 'Funded 11 deals · $3.7M total', img: 32 },
  ];

  function resize() {
    const rect = section.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) generateNodes();
  }

  function generateNodes() {
    nodes = [];
    edges = [];
    profileNodes = [];
    const count = Math.min(70, Math.floor((W * H) / 6000));
    const pad = 40;
    const centerX = W / 2;
    const centerY = H / 2;
    const safeCenterX = W * 0.15; // safe zone around center text
    const safeCenterY = H * 0.12;

    for (let i = 0; i < count; i++) {
      const x = pad + Math.random() * (W - pad * 2);
      const y = pad + Math.random() * (H - pad * 2);
      nodes.push({
        x, y,
        homeX: x, homeY: y,
        vx: 0, vy: 0,
        r: 1.5 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.015,
        bright: 0,
        isProfile: false
      });
    }

    // Designate some nodes as profile nodes (in the outer edges, not center)
    const profileCount = Math.min(PROFILES.length, Math.floor(count * 0.15));
    const candidates = [];
    for (let i = 0; i < count; i++) {
      const dx = Math.abs(nodes[i].homeX - centerX);
      const dy = Math.abs(nodes[i].homeY - centerY);
      if (dx > safeCenterX || dy > safeCenterY) {
        candidates.push(i);
      }
    }
    // Shuffle candidates for random spread, not biased to one side
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Pick spread-out profile positions
    for (let i = 0; i < candidates.length && profileNodes.length < profileCount; i++) {
      const idx = candidates[i];
      // Check min distance from other profile nodes
      let tooClose = false;
      for (const pi of profileNodes) {
        const dx = nodes[idx].homeX - nodes[pi].homeX;
        const dy = nodes[idx].homeY - nodes[pi].homeY;
        if (Math.sqrt(dx * dx + dy * dy) < 130) { tooClose = true; break; }
      }
      if (!tooClose) {
        profileNodes.push(idx);
        nodes[idx].isProfile = true;
        nodes[idx].r = 4;
      }
    }

    // Connect nearby nodes
    const maxDist = Math.min(W, H) * 0.28;
    for (let i = 0; i < count; i++) {
      let connections = 0;
      for (let j = i + 1; j < count; j++) {
        const dx = nodes[i].homeX - nodes[j].homeX;
        const dy = nodes[i].homeY - nodes[j].homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist && connections < 3 && Math.random() > 0.35) {
          edges.push({ from: i, to: j, dist, delay: Math.random() * 0.5 });
          connections++;
        }
      }
    }

    createProfiles();
  }

  function createProfiles() {
    // Clear old profile elements
    profilesContainer.innerHTML = '';
    profileEls = [];

    profileNodes.forEach((nodeIdx, i) => {
      const profile = PROFILES[i];
      if (!profile) return;

      const el = document.createElement('div');
      el.className = 'network-profile';
      el.innerHTML = `
        <div class="network-profile-card">
          <div class="network-card-name">${profile.name}</div>
          <div class="network-card-role">${profile.role}</div>
          <div class="network-card-stat">${profile.stat}</div>
        </div>
        <img class="network-profile-avatar" src="https://i.pravatar.cc/96?img=${profile.img}" alt="${profile.name}" loading="lazy">
        <div class="network-profile-name">${profile.name.split(' ')[0]}</div>
      `;

      profilesContainer.appendChild(el);
      profileEls.push({ el, nodeIdx });
    });
  }

  function updateProfiles() {
    profileEls.forEach(({ el, nodeIdx }) => {
      const node = nodes[nodeIdx];
      if (!node) return;
      const np = Math.max(0, Math.min(1, (animProgress - 0.15) / 0.5));
      el.style.transform = `translate(${node.x - 24}px, ${node.y - 24}px)`;
      el.style.opacity = np;
    });
  }

  function updateNodes() {
    nodes.forEach(node => {
      // Mouse attraction
      if (mouse.active) {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 1) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
          node.bright = Math.max(node.bright, 1 - dist / MOUSE_RADIUS);
        } else {
          node.bright *= 0.95;
        }
      } else {
        node.bright *= 0.95;
      }

      // Spring back to home position
      node.vx += (node.homeX - node.x) * RETURN_FORCE;
      node.vy += (node.homeY - node.y) * RETURN_FORCE;

      // Damping
      node.vx *= 0.88;
      node.vy *= 0.88;

      node.x += node.vx;
      node.y += node.vy;

      node.pulse += node.speed;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw edges
    edges.forEach(edge => {
      const ep = Math.max(0, Math.min(1, (animProgress - edge.delay) / 0.5));
      if (ep <= 0) return;
      const a = nodes[edge.from];
      const b = nodes[edge.to];

      // Edge brightness from connected nodes
      const edgeBright = Math.max(a.bright, b.bright);
      const baseAlpha = 0.08 + edgeBright * 0.2;

      const mx = a.x + (b.x - a.x) * ep;
      const my = a.y + (b.y - a.y) * ep;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = `rgba(108, 218, 154, ${baseAlpha * ep})`;
      ctx.lineWidth = 0.8 + edgeBright * 1;
      ctx.stroke();
    });

    // Draw nodes (skip profile nodes — they have HTML photos)
    nodes.forEach((node, i) => {
      if (node.isProfile) return;

      const np = Math.max(0, Math.min(1, (animProgress - (i / nodes.length) * 0.3) / 0.4));
      if (np <= 0) return;

      const pulseR = node.r + Math.sin(node.pulse) * 1;
      const baseR = pulseR * np;
      const bright = node.bright;

      // Outer glow (bigger when mouse is near)
      const glowR = baseR + 8 + bright * 16;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      glow.addColorStop(0, `rgba(108, 218, 154, ${(0.1 + bright * 0.3) * np})`);
      glow.addColorStop(1, 'rgba(108, 218, 154, 0)');
      ctx.fillStyle = glow;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR + bright * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 218, 154, ${(0.5 + bright * 0.5) * np})`;
      ctx.fill();

      // Bright center on hover proximity
      if (bright > 0.3) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${bright * 0.8 * np})`;
        ctx.fill();
      }
    });
  }

  function animate() {
    if (animProgress < 1) animProgress += 0.006;
    updateNodes();
    draw();
    updateProfiles();
    requestAnimationFrame(animate);
  }

  // Mouse tracking
  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  section.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Touch support
  section.addEventListener('touchmove', (e) => {
    const rect = section.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
    mouse.active = true;
  }, { passive: true });

  section.addEventListener('touchend', () => {
    mouse.active = false;
  });

  // Start network when section scrolls into view
  function init() {
    if (started) return;
    started = true;
    resize();
    animate();
  }

  // Use IntersectionObserver as primary trigger
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      init();
      obs.disconnect();
    }
  }, { threshold: 0.05 });
  obs.observe(section);

  // Fallback: scroll listener + periodic check
  function checkStart() {
    if (started) return;
    const r = section.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      init();
    }
  }
  window.addEventListener('scroll', checkStart, { passive: true });

  window.addEventListener('resize', () => {
    if (started) { nodes = []; resize(); }
  });

  // Check immediately and again after a short delay (covers race conditions)
  checkStart();
  setTimeout(checkStart, 500);
})();

// ============================================
// Mission Section — dramatic counter + staggered reveals
// ============================================
(function() {
  const section = document.getElementById('mission');
  if (!section) return;

  const numberEl = section.querySelector('.mission-number');
  if (!numberEl) return;
  const target = parseFloat(numberEl.dataset.target);
  let counted = false;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        section.classList.add('active');
        if (!counted) {
          counted = true;
          animateNumber(numberEl, target);
        }
        obs.unobserve(section);
      }
    });
  }, { threshold: 0.3 });

  obs.observe(section);

  function animateNumber(el, target) {
    const duration = 2400;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo — fast start, dramatic slow at the end
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = eased * target;

      el.textContent = current.toFixed(1);

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
})();
