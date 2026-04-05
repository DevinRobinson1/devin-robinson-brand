---
name: animated-website
description: Build premium animated websites with scroll-driven animations, 3D effects, AI-generated images (Nano Banana 2), AI video (Kling 3.0), and cinematic scroll sequences. Combines Google Stitch, 21st.dev components, UI UX Pro Max design systems, and Firecrawl brand extraction into a single pipeline. Use when creating animated landing pages, scroll-driven websites, 3D hero sections, or premium client websites worth $5K-$15K.
allowed-tools: Bash(*), Grep, Read, Glob, WebFetch, WebSearch, Agent
---

# /animated-website — Premium Animated Website Builder

## Brand Context

When running for Devin Robinson's properties or creating content on his behalf, apply these defaults:

- **Read voice guide**: Read `~/.claude/skills/_references/voice.md` before generating any copy, scripts, or content
- **Read ICP profiles**: Read `~/.claude/skills/_references/icp.md` to understand the target audience (RE operators, aspiring fund managers)
- **Read offers**: Read `~/.claude/skills/_references/offers.md` for CTA mapping and product context
- **Read author profile**: Read `~/.claude/skills/_references/author-profile.md` for bio, proof points, and credibility anchors
- **Brand colors**: Midnight Navy (#132036), Neo Green (#6CDA9A), Off-White (#F2F1EC), Digital Iris (#7887EA), Frost (#B4C8C8)
- **Fonts**: Inter (headings), Hanken Grotesk (body)
- **Primary CTA**: Fund Flow OS free trial (always first)
- **Sign-off**: "To great success and greater impact"
- **NEVER use em dashes** in any generated content
- **Industry context**: Real estate capital raising, fund management, private lending, Reg D, syndication
- **Hashtag**: #DiversifyWallStreet

**Skill-specific**: Default to Fund Flow OS brand identity when building for Devin's properties. Use Midnight Navy (#132036) as the dark theme base, Neo Green (#6CDA9A) as accent/CTA color, Digital Iris (#7887EA) for secondary highlights, Off-White (#F2F1EC) for light surfaces. Font display: Inter, font body: Hanken Grotesk. Hero copy should speak to RE operators raising capital.

Build cinematic, scroll-animated websites that look like $10K+ agency work. Combines AI image generation, AI video creation, scroll-driven frame animation, 3D effects, and premium design systems into one pipeline.

---

## When to Use This Skill

Use when the user wants to:
- Build an animated website with scroll effects
- Create a premium landing page with 3D or cinematic animations
- Build a website for a client with "scroll-stopper" hero sections
- Generate a website with AI-generated images and video backgrounds
- Create exploded-view, rotating-object, or panning scroll animations
- Build a site that looks like Apple, Tesla, or luxury brand quality

---

## Prerequisites Check

Before starting, verify these tools are available. Ask the user to set up any that are missing:

| Tool | Purpose | How to Check |
|------|---------|-------------|
| **Google Stitch API Key** | AI UI generation & design system | Check env for `GOOGLE_STITCH_API_KEY` or ask user |
| **Nano Banana 2** | AI image generation | Check if `gemini` CLI with nanobanana extension is available, OR check for OpenRouter/FAL API key |
| **21st.dev** | Pre-built animated UI components | No setup needed — copy prompts from site |
| **Node.js / npm** | For Next.js or static site builds | `node --version` |
| **Firecrawl** (optional) | Scrape competitor brand assets | Check for `FIRECRAWL_API_KEY` |

### Quick Setup Commands

**Google Stitch**: User gets API key from https://stitch.withgoogle.com → Settings → Create Key
**Nano Banana**: Either via Gemini CLI (`gemini extensions install nanobanana`) or OpenRouter API key
**21st.dev**: Browse https://21st.dev for components — copy prompt and feed to Claude

---

## The Pipeline (5 Phases)

```
Phase 1: BRAND & DESIGN SYSTEM
  ├── Firecrawl competitor scrape (optional)
  ├── Google Stitch design generation
  └── Color palette, typography, spacing locked in

Phase 2: IMAGE GENERATION
  ├── Nano Banana 2 for hero images
  ├── Product/asset shots (16:9, 2K+, white bg)
  └── Start frame + end frame pairs for animations

Phase 3: VIDEO CREATION
  ├── Kling 3.0 via Higsfield (start → end frame)
  ├── Exploded views, pans, rotations
  └── Download MP4 assets

Phase 4: WEBSITE BUILD
  ├── Next.js or single HTML with inline everything
  ├── Scroll-driven frame animation (JPEG extraction)
  ├── Hero video backgrounds with masking gradients
  ├── 21st.dev animated components
  ├── GSAP ScrollTrigger + Lenis smooth scroll
  ├── Film grain, particles, glass cards, color tints
  └── Mobile responsive + performance optimized

Phase 5: DEPLOY & OPTIMIZE
  ├── Vercel or Netlify (free hosting)
  ├── SEO optimization
  ├── Analytics integration
  └── Custom domain setup
```

---

## Phase 1: Brand & Design System

### Option A: Competitor Brand Extraction (Firecrawl)

If the user has a competitor URL or existing website to reference:

```bash
# Use Firecrawl API to extract brand assets
curl -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "COMPETITOR_URL", "formats": ["markdown"], "actions": [{"type": "extract", "schema": "branding"}]}'
```

Extract: logo, colors, typography, tone, layout structure.

### Option B: Google Stitch Design Generation

Use the Google Stitch API to generate a design system:

```javascript
// Google Stitch API call for design generation
const response = await fetch('https://stitch.googleapis.com/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GOOGLE_STITCH_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: `Design system for [BUSINESS_TYPE]: color palette, typography, spacing, component styles`,
    style: 'modern-animated'
  })
});
```

### Option C: Manual Design System

If no API tools available, establish:

```css
:root {
  /* Colors — ask user or derive from business type */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.3);
  --gold: #d4a853;       /* luxury brands */
  --glass: rgba(255, 255, 255, 0.05);

  /* Typography */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --section-padding: clamp(4rem, 10vh, 8rem);
  --container-max: 1200px;

  /* Animation */
  --transition-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-duration: 0.6s;
}
```

### Design System Rules

1. **Never use default AI-slop colors** — every site needs a deliberate palette
2. **Typography hierarchy**: Display (hero) → H2 (sections) → Body → Caption
3. **Spacing rhythm**: Use consistent multiples (8px base grid)
4. **Dark themes dominate** for premium animated sites
5. **Accent color used sparingly** — CTAs, highlights, hover states only

---

## Phase 2: Image Generation

### Using Nano Banana 2

Generate images for the website. Key settings:
- **Aspect ratio**: 16:9 for hero/backgrounds, 1:1 for product shots
- **Resolution**: 2K minimum (1K looks cheap)
- **Iterations**: Generate 4 variations, pick the best
- **Background**: Clean white for assets that overlay on dark sites

```bash
# Via Gemini CLI
gemini --yolo "/generate 'Professional 3D render of [PRODUCT/SUBJECT], white background, studio lighting, no text, ultra high quality, 16:9 aspect ratio'"

# Via OpenRouter API (if using that route)
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-2.0-flash-exp:free",
    "messages": [{"role": "user", "content": "Generate: [PROMPT]"}]
  }'
```

### Image Prompt Templates

**Hero Background Asset:**
```
Professional 3D render of [SUBJECT] on clean white background.
Studio lighting, soft shadows. Ultra high quality, photorealistic.
Nothing touching edges. No text. 16:9 aspect ratio, 2K resolution.
```

**Exploded View Start Frame:**
```
[PRODUCT/OBJECT] fully assembled, centered, clean white background.
Professional studio photography, soft lighting. No text. 16:9.
```

**Exploded View End Frame:**
```
[PRODUCT/OBJECT] exploded view, all components floating apart in all
directions including vertically. Clean white background. Same lighting
as reference image. No text. Nothing outside bounds. 16:9.
```

**Rotating Object:**
```
3D render of [OBJECT] centered, slightly angled. Clean white background.
Dramatic studio lighting with subtle rim light. Ultra detailed, 2K. 16:9.
```

**Multi-Angle Generation:**
```
[SUBJECT] from [ANGLE: front/side/aerial/three-quarter] view.
Same style and lighting as reference. Clean background. 16:9, 2K.
```

### Important Image Rules

1. Always specify "white background" or "clean background" for overlay assets
2. Nothing should touch the edges of the image
3. Generate 4 variations minimum — pick the sharpest one
4. For animation pairs: use the first image as reference for the second
5. Upscale final selections to 4K if the tool supports it

---

## Phase 3: Video Creation (Kling 3.0 via Higsfield)

This is where the magic happens. Two frames become a cinematic animation.

### Higsfield Workflow

1. Go to https://higsfield.com → Video section
2. Upload **start frame** (assembled/initial state)
3. Upload **end frame** (exploded/rotated/panned state)
4. Write transition prompt (see templates below)
5. Settings: Kling 3.0, 5-7 seconds, 16:9, 1080p
6. Generate 2-3 variations, pick the smoothest
7. Download MP4

### Video Prompt Templates

**Exploded View Transition:**
```
Smooth cinematic transition from assembled [OBJECT] to exploded view.
All components gracefully float apart revealing internal structure.
Camera holds steady. White background. Professional product reveal.
5 seconds, smooth motion.
```

**180° Pan / Rotation:**
```
Slow cinematic 180-degree pan around [SUBJECT].
Camera orbits smoothly from left to right, revealing all angles.
Consistent studio lighting throughout. White background.
Center of mass stays fixed. 7 seconds.
```

**Zoom/Reveal:**
```
Camera slowly pulls back from close-up detail of [SUBJECT] to reveal
full object. Smooth dolly out movement. Studio lighting.
White background. 5 seconds.
```

**Environment Pan:**
```
Cinematic camera pan through [ENVIRONMENT], moving from left to right.
Slow, steady movement. Professional cinematography. Rich detail.
Natural lighting. 7 seconds.
```

### Video Rules

1. Always use start + end frame (not just text prompt)
2. 16:9 aspect ratio for landscape websites
3. 1080p minimum quality
4. 5-7 seconds is the sweet spot
5. Generate 2-3 versions and pick the smoothest
6. White backgrounds for overlay assets, environment for hero backgrounds
7. Cost: ~$3-4 per video on Higsfield Pro

---

## Phase 4: Website Build

### Tech Stack

```
Framework:    Next.js (TypeScript) OR single HTML file
Animations:   GSAP + ScrollTrigger (CDN)
Smooth Scroll: Lenis (CDN)
3D (if needed): Three.js (CDN)
Styling:      Tailwind CSS or inline CSS (mobile-first)
```

### CDN Links

```html
<!-- GSAP + ScrollTrigger -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

<!-- Lenis Smooth Scroll -->
<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>

<!-- Three.js (if 3D elements needed) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

### Page Structure

```
┌──────────────────────────────────────┐
│  HERO SECTION                        │
│  ├── Video background (MP4)          │
│  ├── Inward masking gradient overlay │
│  ├── Headline + subtext              │
│  ├── CTA button (glass card style)   │
│  └── Scroll indicator animation      │
├──────────────────────────────────────┤
│  SCROLL-DRIVEN ANIMATION SECTION     │
│  ├── Extracted JPEG frames           │
│  ├── Frame tied to scroll position   │
│  ├── Text reveals between frames     │
│  └── Parallax depth layers           │
├──────────────────────────────────────┤
│  FEATURES / BENEFITS                 │
│  ├── Glass card components           │
│  ├── Staggered scroll-in animations  │
│  ├── Icon/image animations           │
│  └── Particle background (optional)  │
├──────────────────────────────────────┤
│  SOCIAL PROOF / TESTIMONIALS         │
│  ├── Fade-in on scroll               │
│  ├── Counter animations              │
│  └── Logo carousel                   │
├──────────────────────────────────────┤
│  CTA / FOOTER                        │
│  ├── Final animated element          │
│  ├── Contact form or booking link    │
│  └── Footer with links               │
└──────────────────────────────────────┘
```

### Animation Technique 1: Hero Video Background

```html
<section class="hero">
  <video autoplay muted loop playsinline class="hero-video">
    <source src="hero-animation.mp4" type="video/mp4">
  </video>
  <div class="hero-gradient-overlay"></div>
  <div class="hero-content">
    <h1>Your Headline</h1>
    <p>Subtext goes here</p>
    <a href="#" class="cta-button">Get Started</a>
  </div>
</section>

<style>
.hero {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
.hero-video {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%; min-height: 100%;
  object-fit: cover;
}
.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center,
    transparent 30%,
    var(--bg-primary) 70%
  );
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}
</style>
```

### Animation Technique 2: Scroll-Driven Frame Animation

This is the money technique. Extract video frames → tie to scroll position.

**Step 1: Extract frames from video**
```bash
# Extract frames as optimized JPEGs (reduces lag dramatically)
mkdir -p public/frames
ffmpeg -i input-video.mp4 -vf "fps=30,scale=1920:-1" -q:v 2 public/frames/frame_%04d.jpg
```

**Step 2: Preload and bind to scroll**
```javascript
// Scroll-driven frame animation
const frameCount = 150; // adjust based on extracted frames
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');

// Preload all frames
const frames = [];
for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = `/frames/frame_${String(i).padStart(4, '0')}.jpg`;
  frames.push(img);
}

// Set canvas size
canvas.width = 1920;
canvas.height = 1080;

// Bind to scroll via GSAP ScrollTrigger
gsap.to({}, {
  scrollTrigger: {
    trigger: '#scroll-animation-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    pin: true,
    onUpdate: (self) => {
      const frameIndex = Math.min(
        Math.floor(self.progress * (frameCount - 1)),
        frameCount - 1
      );
      if (frames[frameIndex]?.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height);
      }
    }
  }
});
```

**Step 3: Add text reveals between scroll frames**
```javascript
// Text that fades in/out during scroll animation
const textSections = document.querySelectorAll('.scroll-text');
textSections.forEach((text, i) => {
  gsap.fromTo(text,
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      scrollTrigger: {
        trigger: '#scroll-animation-section',
        start: `${(i * 25) + 10}% center`,
        end: `${(i * 25) + 20}% center`,
        scrub: true,
      }
    }
  );
});
```

### Animation Technique 3: Glass Card Components

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: transform 0.4s var(--transition-smooth),
              border-color 0.4s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
}
```

### Animation Technique 4: Film Grain & Particles

```css
/* Film grain overlay */
.film-grain::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* noise SVG */
  pointer-events: none;
  z-index: 9999;
  animation: grain 0.5s steps(1) infinite;
}
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  30% { transform: translate(3%, -15%); }
  50% { transform: translate(12%, 9%); }
  70% { transform: translate(9%, 4%); }
  90% { transform: translate(-1%, 7%); }
}
```

### Animation Technique 5: Smooth Scroll Setup

```javascript
// Lenis smooth scroll initialization
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  smooth: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Connect Lenis to GSAP ScrollTrigger
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Animation Technique 6: Staggered Section Reveals

```javascript
// Reveal sections on scroll
gsap.utils.toArray('.reveal-section').forEach((section) => {
  gsap.from(section, {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      toggleActions: 'play none none none',
    }
  });
});

// Staggered card reveals
gsap.utils.toArray('.card-grid').forEach((grid) => {
  const cards = grid.querySelectorAll('.glass-card');
  gsap.from(cards, {
    opacity: 0,
    y: 40,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: grid,
      start: 'top 75%',
    }
  });
});
```

### 21st.dev Component Integration

Browse https://21st.dev for pre-built animated components. Workflow:
1. Browse backgrounds, CTAs, cards, navigation at 21st.dev
2. Click "Copy Prompt" on any component you like
3. Paste the prompt into Claude Code
4. Claude adapts the component to match your site's design system

**Popular 21st.dev categories for animated sites:**
- Backgrounds: Shooting stars, dotted surfaces, eternal shadows, hero waves
- Navigation: Animated navbars, mobile menus
- CTAs: Hover effects, tracking buttons, glass buttons
- Cards: Glass cards, tilt cards, spotlight cards
- Themes: Full pre-built dark/light themes

---

## Phase 5: Deploy & Optimize

### Deployment Options

**Vercel (Recommended for Next.js):**
```bash
npm i -g vercel
vercel --prod
```

**Netlify (Recommended for static HTML):**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=.
```

**GitHub Pages (Free, simple):**
```bash
git init && git add . && git commit -m "deploy"
gh repo create my-site --public --push
# Enable Pages in repo settings
```

### Performance Optimization Checklist

Before deploying, optimize for speed:

1. **Compress hero video**: `ffmpeg -i hero.mp4 -vcodec libx264 -crf 28 -preset slow hero-compressed.mp4`
   - Target: Under 500KB for hero video
2. **Optimize scroll frames**: Convert to WebP, reduce quality to 80%
   ```bash
   for f in frames/*.jpg; do cwebp -q 80 "$f" -o "${f%.jpg}.webp"; done
   ```
3. **Preload critical frames**: Add `<link rel="preload">` for first 10 frames
4. **Lazy load below-fold images**: Use `loading="lazy"` attribute
5. **Minimize JS**: Ensure GSAP tree-shaking if using npm build
6. **Test at 60fps**: Open DevTools → Performance → scroll through site
7. **Mobile test**: Resize to 375px width, ensure all animations work

### SEO Basics

```html
<head>
  <title>[Business Name] — [Value Proposition]</title>
  <meta name="description" content="[Compelling 155-char description]">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Open Graph -->
  <meta property="og:title" content="[Title]">
  <meta property="og:description" content="[Description]">
  <meta property="og:image" content="[Screenshot or hero image URL]">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Title]">
  <meta name="twitter:description" content="[Description]">
  <meta name="twitter:image" content="[Image URL]">

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "[Business Name]",
    "url": "[URL]",
    "description": "[Description]"
  }
  </script>
</head>
```

---

## Workflow: Putting It All Together

When the user triggers `/animated-website`, follow this sequence:

### Step 1: Gather Requirements
Ask the user:
1. **What's the business/brand?** (name, industry, vibe)
2. **Do you have a competitor URL to reference?** (for Firecrawl)
3. **What's the style?** (dark/luxury, clean/minimal, colorful/bold, classic/elegant)
4. **What kind of animation?** (exploded view, rotating product, environment pan, abstract 3D)
5. **Do you have product images?** (if not, we generate with Nano Banana)
6. **Where should it be deployed?** (Vercel, Netlify, local only)

### Step 2: Build Design System
- If competitor URL → Firecrawl brand extraction
- If no competitor → Google Stitch or manual design system
- Lock in: colors, fonts, spacing, component styles

### Step 3: Generate Images
- Use Nano Banana 2 for all visual assets
- Generate start + end frame pairs for animations
- 16:9, 2K+, white backgrounds, 4 iterations each

### Step 4: Create Videos (User Does This in Higsfield)
- Provide the user with exact Higsfield prompts
- Specify: Kling 3.0, 5-7 seconds, 16:9, 1080p
- User downloads MP4 files and drops them into the project folder

### Step 5: Build the Website
- Create project structure (Next.js or HTML)
- Implement hero with video background + masking gradient
- Extract video frames for scroll animation sections
- Add 21st.dev components (user picks or auto-select)
- Wire up GSAP ScrollTrigger + Lenis smooth scroll
- Add film grain, particles, glass cards as finishing touches
- Mobile responsive pass
- Performance optimization pass

### Step 6: Deploy
- Push to Vercel/Netlify
- Set up custom domain (if provided)
- Run basic SEO audit

---

## Quality Standards

Every animated website MUST have:

- [ ] Deliberate color palette (no AI defaults)
- [ ] At least one scroll-driven animation section
- [ ] Hero section with video or animated background
- [ ] Glass card or frosted UI elements
- [ ] Smooth scroll (Lenis)
- [ ] Film grain or subtle texture overlay
- [ ] Mobile responsive (tested at 375px)
- [ ] 60fps scroll performance
- [ ] Compressed assets (video < 500KB, frames as WebP)
- [ ] SEO meta tags + Open Graph
- [ ] Accessible (semantic HTML, proper contrast)
- [ ] At least 3 distinct animated sections
