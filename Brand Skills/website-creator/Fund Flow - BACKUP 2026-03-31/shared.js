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
        <rect width="800" height="500" fill="#f0ede8"/>
        <rect x="16" y="16" width="768" height="468" rx="10" fill="#e8e4dd" stroke="#d4cfc7" stroke-width="1"/>
        <rect x="16" y="16" width="768" height="32" rx="10" fill="#ddd8cf"/>
        <circle cx="36" cy="32" r="5" fill="#c4bfb6"/>
        <circle cx="52" cy="32" r="5" fill="#c4bfb6"/>
        <circle cx="68" cy="32" r="5" fill="#c4bfb6"/>
        <text x="400" y="270" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" fill="#8a8580">${short}</text>
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
