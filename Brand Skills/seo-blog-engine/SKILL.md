---
name: seo-blog-engine
description: End-to-end SEO blog engine — competitor gap analysis, bottom-funnel keyword discovery, SEO-optimized article writing, AI-generated images and infographics via Nano Banana, auto-publishing, and social repurposing. Finds what competitors rank for, identifies gaps, writes articles that rank on Google AND get cited by AI search engines (ChatGPT, Perplexity, Gemini), generates custom featured images, infographics, and data visualizations for every post, publishes to your website, and generates social content from the blog RSS. Uses Answer Capsule Technique, source-backed claims, E-E-A-T signals, and strategic internal linking. Can run as a one-off or a fully automated weekly content engine.
---

# SEO Blog Engine

End-to-end blog content engine: research competitors, find keyword gaps, write SEO-optimized articles that rank on Google AND get cited by AI search engines, publish to your website, and repurpose into social content.

**This is not just a blog writer. This is a content engine.**

---

## How It Works (The Full Pipeline)

```
PHASE 1: INTELLIGENCE
  Competitor analysis → Keyword gap discovery → Bottom-funnel opportunity ranking

PHASE 2: PLANNING
  Topic selection → Outline with Answer Capsules → User approval

PHASE 3: WRITING
  SEO-optimized article → Source-backed claims → Internal linking → Schema markup

PHASE 3.5: VISUALS (Nano Banana)
  Featured image → Section infographics → Data visualizations → OG social image

PHASE 4: PUBLISHING
  Publish to website (via CMS API or manual) → Verify live

PHASE 5: REPURPOSING
  Blog → Social posts (LinkedIn, X, Instagram, Facebook) → Email newsletter snippet
```

You can run the full pipeline or any single phase. Say "run my weekly blog plan" and it handles everything.

---

## Website & Author

- **Website**: https://pfpsolutions.us
- **Author**: Devin Robinson
- **Author profile**: Read from `~/.claude/skills/_references/author-profile.md`
- **ICP**: Read from `~/.claude/skills/_references/icp.md`
- **Offers**: Read from `~/.claude/skills/_references/offers.md`
- **Voice**: Read from `~/.claude/skills/_references/voice.md`

**IMPORTANT:** Read ALL four reference files before writing anything. These are non-negotiable context.

---

## Site-Specific Configuration: pfpsolutions.us

When writing for **pfpsolutions.us** specifically, apply these additional settings:

### Author Info
- **Author**: Devin Robinson
- **Author URL**: https://pfpsolutions.us/about
- **Author Job Title**: Founder
- **Organization**: Fund Flow OS / PFP Solutions
- **Social Profiles**:
  - LinkedIn: https://www.linkedin.com/in/devinrobinson
  - YouTube: https://www.youtube.com/@devinrobinson
  - Instagram: https://www.instagram.com/devinrobinson

### Internal Linking Strategy for pfpsolutions.us
- Include 4-7 internal links per post
- At least 1 link to the Fund Flow OS product page
- At least 1 link to a relevant lead magnet
- Use descriptive anchor text that includes target keywords
- Check the sitemap (https://pfpsolutions.us/sitemap.xml) for real existing URLs
- If specific internal URLs are not known, use placeholder format: `[INTERNAL LINK: /blog/topic-slug]`

### Author Schema JSON-LD (Include in Every Post)
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "author": {
    "@type": "Person",
    "name": "Devin Robinson",
    "url": "https://pfpsolutions.us/about",
    "jobTitle": "Founder",
    "worksFor": {
      "@type": "Organization",
      "name": "Fund Flow OS"
    },
    "sameAs": [
      "https://www.linkedin.com/in/devinrobinson",
      "https://www.youtube.com/@devinrobinson",
      "https://www.instagram.com/devinrobinson"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "PFP Solutions",
    "url": "https://pfpsolutions.us"
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "description": "[Meta description]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pfpsolutions.us/blog/[slug]"
  }
}
</script>
```

### Blog Voice for pfpsolutions.us
Uses the **LinkedIn side** of Devin's voice: professional but human, casual but structured, data-driven but accessible. Think "smart friend writing a well-researched article." Write at 8th grade reading level (Flesch-Kincaid). Short paragraphs (2-4 sentences). NO em dashes. Conclusion sign-off: "To great success and greater impact."

### Answer Capsule Technique (pfpsolutions.us Detail)
- ~60% of H2 sections get an Answer Capsule (bold, 2-4 sentences, 40-80 words)
- Capsule must fully answer the H2 question standalone (for AI extraction)
- Do NOT start capsules with "Yes," "No," or "Well" unless H2 is a yes/no question

### CTA Framework for pfpsolutions.us
- **Primary CTA (every post):** Fund Flow OS free trial
  - Soft mention at ~40% mark
  - Dedicated CTA section before conclusion
  - Final CTA in conclusion
- **Secondary CTA:** Contextual lead magnet mapped by topic (from offers.md)
- **CTA tone:** Matter-of-fact, not pushy. "If you're managing lenders in a spreadsheet, Fund Flow OS replaces that chaos with a real system. Try it free."

### Post-Delivery Summary Table (pfpsolutions.us)
After every post, output:
| Metric | Value |
|--------|-------|
| Word Count | [number] |
| Reading Level | [Flesch-Kincaid grade] |
| Source-Backed Claims | [count] |
| Internal Links | [count] |
| Answer Capsules | [count] / [total H2s] |
| Primary Keyword | [keyword] |
| FAQ Questions | 5 |
| Meta Description | [150-160 chars] |
| URL Slug | /blog/[slug] |
| Em Dashes Found | 0 (verified) |

---

## Before EVERY Session — Mandatory Reads

1. **ICP profiles** — Who we're writing for (Chapter 1: Flipper/Builder, Chapter 2: Syndicator/Fund Launcher)
2. **Voice guide** — How Devin sounds (LinkedIn-polished side for blog)
3. **Offers** — CTA mapping by topic
4. **Author profile** — E-E-A-T proof points and credibility anchors
5. **Sitemap** — Check https://pfpsolutions.us/sitemap.xml for existing content (avoid cannibalization, find internal linking opportunities)

---

# PHASE 1: INTELLIGENCE (Competitor Gap Analysis)

This is the differentiator. Before writing a single word, understand what the competition ranks for, where the gaps are, and which bottom-funnel, high-intent keywords are underserved.

## Step 1.1: Identify Competitors

If the user hasn't provided competitors:

1. **WebSearch** for the top 5-10 sites ranking for core keywords in the niche:
   - `"real estate fund management software"`
   - `"capital raising platform real estate"`
   - `"how to start a real estate fund"`
   - `"private lender management software"`
   - `"real estate syndication vs fund"`
2. Note which domains appear repeatedly in top 10 results
3. Present the competitor list to the user for confirmation

If competitors are already known (from Airtable Competitors table: `tblQJUE1wueEp6vo1` in base `app3wSvrdqdfsDF2c`), pull them directly.

## Step 1.2: Competitor Content Analysis

For each top competitor (3-5 sites), analyze their blog/content strategy:

### What to research:
```
WebSearch queries:
- site:[competitor.com] blog
- site:[competitor.com] [primary keyword]
- "[competitor name]" [keyword] guide OR tutorial OR explained
- [primary keyword] site:[competitor.com]
```

### What to extract per competitor:
- **Top ranking pages** — What blog posts drive their traffic?
- **Keywords they rank for** — What search terms bring them traffic?
- **Content gaps** — What questions in the niche do they NOT answer?
- **Content quality** — How deep are their articles? Word count? Sources?
- **Internal linking** — How do they structure topic clusters?
- **Publication frequency** — How often do they publish?

## Step 1.3: Keyword Gap Analysis

Cross-reference competitor rankings against pfpsolutions.us to find:

### Search Intent Classification (THE Core Strategy)

This is the most important concept in the entire skill. Every piece of content must be classified by search intent before writing. LLMs (ChatGPT, Perplexity, Gemini) are getting dramatically better at matching search intent to results. This means: **writing for intent-matching beats writing for keywords.** The better your content matches what someone actually wants when they search, the more you show up in both traditional and AI search results.

**Think of it like a funnel:**
```
TOP OF FUNNEL (broad, low conversion)
  "running shoes"
  "real estate investing"
  "what is a fund"
    → High traffic, low buyer intent, everyone competes here

MIDDLE OF FUNNEL (narrowing, researching)
  "best running shoes for flat feet"
  "syndication vs fund structure"
  "how to raise private capital"
    → Moderate traffic, moderate intent, fewer competitors

BOTTOM OF FUNNEL (specific, ready to buy) ← THIS IS WHERE WE FOCUS
  "running shoes for women over 40 with back pain"
  "506b PPM template for real estate fund"
  "investor management software for private lenders"
    → Lower traffic, HIGH buyer intent, converts fast, fewest competitors
```

**The magic:** Someone searching "investor management software for private lenders who track returns" is describing EXACTLY what Fund Flow OS does. That person is one click from becoming a customer. That's the content we write.

### Bottom-Funnel, High Search Intent Keywords (PRIORITY)

These are keywords where the searcher is ready to act. They convert.

**Patterns to look for:**
- `"how to [action]"` — Tutorial intent (e.g., "how to raise capital for a real estate fund")
- `"best [product/tool] for [use case]"` — Comparison intent (e.g., "best investor management software")
- `"[product] vs [product]"` — Decision stage (e.g., "syndication vs fund structure")
- `"[topic] checklist/template/guide"` — Resource intent
- `"[topic] for beginners"` — Educational entry point
- `"[specific question]"` — Direct answer intent (e.g., "do I need a PPM for a 506b")
- `"[product] for [specific audience]"` — Niche match (e.g., "capital raising software for minority fund managers")
- `"[problem] + [solution type]"` — Pain-to-product (e.g., "tracking private lender returns automatically")

**Patterns to AVOID (top-funnel, low conversion):**
- Generic industry news
- Broad definitions ("what is real estate")
- Celebrity/trending content with no search persistence
- Anything where the searcher doesn't know what they want yet

### Intent-Matching Scoring

For every keyword opportunity, score it on these 4 criteria:

| Criteria | Score 1 (Low) | Score 3 (High) |
|----------|--------------|----------------|
| **Buyer Intent** | Browsing, researching broadly | Ready to buy, comparing options |
| **Specificity** | Generic, one-word | Long-tail, describes exact need |
| **Product Fit** | Loosely related to our offers | Describes exactly what we sell |
| **Competition Gap** | Everyone ranks for this | Nobody answers this well |

**Total 9-12:** Write this FIRST. These are money pages.
**Total 6-8:** Strong candidates. Write after the 9-12s.
**Total 3-5:** Skip unless nothing better exists.

### Search Query Templates:
```
WebSearch:
- "[primary keyword] questions people ask"
- "related searches [primary keyword]"
- "[primary keyword] reddit" (find real questions people have)
- "[primary keyword] quora" (more real questions)
- "[primary keyword] statistics 2025 2026"
- "[primary keyword] common mistakes"
- "[primary keyword] step by step"
```

## Step 1.4: Present Opportunities

Output format:

```
## SEO Content Opportunities

**Competitors Analyzed:** [list with domains]
**Total Keywords Identified:** [X]
**Bottom-Funnel Opportunities:** [X]

### Top 10 Blog Topics (Ranked by Opportunity)

| # | Topic / Title | Primary Keyword | Search Intent | Competitor Gap | Difficulty |
|---|--------------|-----------------|---------------|----------------|------------|
| 1 | [title] | [keyword] | [intent type] | [who's NOT covering this] | Low/Med/High |
| 2 | [title] | [keyword] | [intent type] | [gap] | Low/Med/High |
| ... | | | | | |

### Why These Topics Win:
- [Topic 1]: [1 sentence on why this is a gap worth filling]
- [Topic 2]: [1 sentence]
- ...

Pick topics to write, or say "all" to queue them up.
```

**STOP and wait for the user to pick topics before proceeding.**

---

# PHASE 2: PLANNING (Outline & Approval)

## Step 2.1: Deep Research Per Topic

For EACH chosen topic, conduct thorough research:

### 2.1a: Current Data & Statistics
```
WebSearch:
- "[primary keyword] statistics 2025 2026"
- "[primary keyword] SEC regulations"
- "[primary keyword] site:sec.gov OR site:finra.org"
- "[primary keyword] real estate fund"
- "[primary keyword] best practices"
- "[primary keyword] case study OR example"
```

### 2.1b: People Also Ask / Related Questions
```
WebSearch:
- "[primary keyword] questions"
- "[primary keyword] FAQ"
- "people also ask [primary keyword]"
```

### 2.1c: What Competitors Say (So We Can Say It Better)
```
WebSearch:
- "[primary keyword] guide OR ultimate guide OR complete guide"
- "[primary keyword] explained"
```

Read the top 3 competitor articles. Note:
- What they cover well (match it)
- What they miss (our opportunity)
- What they get wrong (our correction angle)
- How deep they go (go deeper)

### 2.1d: Compile Research Brief

```
**Topic:** [title]
**Primary Keyword:** [keyword]
**Secondary Keywords:** [3-5 related keywords]

**Key Facts & Statistics:**
- [fact with source URL]
- [stat with source URL]
- [data point with source URL]

**What Competitors Say (Default Takes):**
- [Competitor A]: [their angle]
- [Competitor B]: [their angle]

**The Gap (Our Angle):**
- [What they all miss]
- [The second-order insight]
- [The practical thing nobody explains]

**ICP Pain Point Connection:**
- Chapter 1: [how this connects to Flipper/Builder pain]
- Chapter 2: [how this connects to Syndicator/Fund Launcher pain]

**E-E-A-T Anchors Available:**
- [Which of Devin's proof points to use — 70 deals, SEC attorney co-founder, etc.]

**Sources Identified:** [list with URLs]
```

## Step 2.2: Create Outline

Present a detailed outline for approval BEFORE writing:

```
TITLE: [SEO-optimized title, 50-65 characters]
PRIMARY KEYWORD: [keyword]
SECONDARY KEYWORDS: [3-5 keywords]
TARGET ICP: [Chapter 1 / Chapter 2 / Both]
ESTIMATED WORD COUNT: [1,500-3,000 words]
COMPETITOR ANGLE: [How this beats existing content on this topic]

TL;DR: [2-3 sentence summary]

INTRO APPROACH: [Brief description of the intro angle — which ICP pain point we lead with]

H2 SECTIONS:
1. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source for this section]
2. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]
3. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]
4. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]
5. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]
6. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]
7. [H2 Title] - [Answer Capsule? Y/N] - [Brief description] - [Source]

CONCLUSION ANGLE: [How we'll close it — identity shift language]

FAQ QUESTIONS: [5 questions based on People Also Ask + ICP pain points]

INTERNAL LINKS PLANNED: [4-7 pages on pfpsolutions.us to link to]

CTA STRATEGY:
- Primary: Fund Flow OS free trial
- Secondary: [Contextual lead magnet from offers.md]
- Placement: Soft mention at 40%, dedicated section before conclusion, final in conclusion

SOURCES IDENTIFIED: [Key sources with URLs]
```

**DO NOT proceed to Phase 3 until the user approves the outline.**

---

# PHASE 3: WRITING (The Article)

## Four Core SEO Strategies

### 1. Answer Capsule Technique

An "Answer Capsule" is a 2-4 sentence direct answer placed immediately after an H2 heading. Designed to be extracted by AI search engines (ChatGPT, Perplexity, Gemini) and Google featured snippets.

**Format:**
```markdown
## [Question-based H2]

**[Direct answer in 2-4 sentences. Concise. Definitive. No hedging. Written so it can stand alone as a complete answer if extracted by an AI or featured snippet.]**

[Then expand with context, examples, nuance, and depth for human readers.]
```

**Rules:**
- Include Answer Capsules in approximately 60% of H2 sections
- The capsule must fully answer the H2 question without needing any other context
- Bold the capsule text to visually distinguish it
- Write capsules in a neutral, authoritative tone (slightly more formal than the rest of the post)
- Capsules should be 40-80 words
- Do NOT start capsules with "Yes," "No," or "Well" unless the H2 is a yes/no question

### 2. Source-Backed Claims

Every factual claim, statistic, or data point must be backed by a credible source. This builds E-E-A-T signals and makes the content citeable by AI systems.

**Rules:**
- Include a source-backed claim every 150-200 words throughout the post
- Use inline links with descriptive anchor text (not "click here")
- Acceptable sources: SEC.gov, IRS publications, FINRA, academic papers, industry reports (CBRE, JLL, NAR, PwC), reputable news (WSJ, Bloomberg, Forbes), official documentation
- Do NOT fabricate sources. If a specific stat cannot be verified, frame it as an estimate or general industry observation
- Format: "According to [Source](URL), [claim]." or "[Claim] ([Source](URL))."

### 3. Strategic Internal Linking

Every post must include internal links to other pages on pfpsolutions.us to build topical authority and site structure.

**Rules:**
- Include 4-7 internal links per post
- Link to: other blog posts, product pages, lead magnet landing pages, about page
- Use descriptive anchor text that includes target keywords
- Place internal links naturally within the content flow, not clustered together
- At least 1 internal link should point to the Fund Flow OS product page
- At least 1 internal link should point to a relevant lead magnet
- Check the sitemap first to use REAL existing URLs

**Note:** If specific internal URLs are not known, create logical placeholder links with a note: `[INTERNAL LINK: /blog/topic-slug]` and flag them for the user to fill in.

### 4. E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)

Every post must demonstrate that Devin Robinson has real experience and authority in real estate capital raising.

**How to embed E-E-A-T:**
- Reference Devin's personal experience: "When I launched PF Capital..." or "After closing 70 deals in six months..."
- Include specific, non-generic examples from real estate operations
- Reference the Fund Flow OS platform as a tool Devin built from personal need
- Mention co-founder Seth (SEC attorney) when discussing legal/compliance topics
- Use first-person perspective naturally throughout
- Include Author Schema JSON-LD in every post

**Credibility Anchors (use these throughout):**

| Proof Point | Use When |
|-------------|----------|
| 70 deals in 6 months | Establishing RE credibility |
| $1M+ photography business | Showing entrepreneurial track record |
| Co-founded with SEC attorney Seth | Addressing legal credibility concerns |
| Technical co-founders via YC matching | Establishing tech credibility for Fund Flow OS |
| Grew up in Englewood, LA | Relatability, scrappy origin story |
| Foster/adoptive father of 3 | Human dimension, mission-driven credibility |
| Vibe-coded Fund Flow OS | "If I can build this, you can launch a fund" |

---

## Voice (Blog-Specific Calibration)

The blog uses the **LinkedIn side** of Devin's voice. Professional but human. Casual but structured. Data-driven but accessible. Think "smart friend writing a well-researched article" not "YouTube live energy."

### Blog Voice Rules
- Write at an **8th grade reading level** (Flesch-Kincaid)
- Short paragraphs (2-4 sentences max)
- Use "you" and "I" freely
- Active voice by default
- Contractions are fine and encouraged
- **NO em dashes. Ever.** Use periods, commas, or rewrite.
- No corporate jargon: "leverage," "synergize," "optimize your pipeline"
- Occasional Devin-isms are welcome: "straight up," "here's the thing," "pretty dang cool"
- But don't overdo it. The blog is the most polished version of Devin's voice.

### DO use:
- "y'all" (natural, inclusive, warm)
- Short sentences for impact
- Questions that mirror what the audience is thinking
- "Here's the thing..." as a transition to a key insight
- First person: "I built this," "I messed this up," "I learned this the hard way"
- Second person: "You already know how to do this," "Your track record matters"

### DO NOT use:
- Em dashes (seriously, never)
- "Utilize" (say "use")
- "In order to" (say "to")
- "It goes without saying" (then don't say it)
- "At the end of the day" (overused, meaningless)
- Passive voice when active works
- Filler transitions: "That being said," "With that in mind," "Moving forward"
- Engagement-bait: "Comment FIRE if you agree"

---

## CTA Framework

### Primary CTA (Every Post, No Exceptions)
**Fund Flow OS free trial.** Every blog post must drive readers toward trying Fund Flow OS.

CTA placement:
- Soft mention within the body (around the 40% mark of the article)
- Dedicated CTA section before the conclusion
- Final CTA in the conclusion paragraph

### Secondary CTA (Contextual)
Based on the blog topic, include ONE secondary CTA from this mapping:

| Content Topic | Secondary CTA |
|---------------|---------------|
| Private lender management | Raise Smart guide |
| Fund structures / Reg D | Fund Foundations 101 |
| Capital raising strategies | Fund Launcher's Checklist |
| Syndication vs. fund | Fund vs. Syndication Quiz |
| AI in real estate | Fund Launcher's Checklist |
| Finding investors | Investor Avatar Builder |
| Due diligence / LP meetings | Due Diligence Checklist |
| Fund economics / returns | Capital Stack Calculator Pack |
| First raise / getting started | Your First $1 Million |
| Scaling / advanced strategy | Fund Founders Formula |
| Community / mentorship | Capital Raised, Deals Made (Skool) |

### CTA Voice
- Not salesy. Not pushy. Matter-of-fact.
- "If you're managing lenders in a spreadsheet, Fund Flow OS replaces that chaos with a real system. Try it free."
- "I built a free checklist for this exact process. Grab it here."
- Never: "CLICK HERE NOW TO TRANSFORM YOUR BUSINESS!!!!"

---

## Blog Post Structure

Every blog post follows this exact structure:

### 1. Title
- SEO-optimized, 50-65 characters
- Include primary keyword naturally
- Use power words when they fit: "exactly," "complete," "proven," "step-by-step"
- No clickbait. No "You Won't Believe..." energy.

### 2. TL;DR
- Placed immediately after the title (before the intro)
- 2-4 sentences that summarize the entire post
- Written for skimmers and AI extraction
- Bold the entire TL;DR block
- Include the primary keyword

### 3. Introduction
- 100-200 words
- Start with a pain point or scenario the ICP recognizes immediately
- Establish why this topic matters RIGHT NOW
- Preview what the post will cover (without being formulaic)
- Include the primary keyword in the first 100 words
- No em dashes

### 4. Body: 5-7 H2 Sections
Each H2 section:
- Has a clear, keyword-rich heading (question format when natural)
- 200-400 words per section
- ~60% of sections include an Answer Capsule (bold, 2-4 sentences, directly after H2)
- At least one source-backed claim per section
- At least one internal link per 2 sections
- Subheadings (H3) when sections need sub-organization
- Short paragraphs, bullet points, and formatted lists for scannability

### 5. Conclusion
- 100-150 words
- Reinforce the key takeaway (not just a summary)
- Identity shift language (from the ICP reference):
  - Chapter 1: FROM "flipper who borrows money" TO "runs a capital operation"
  - Chapter 2: FROM "operator ready to go institutional" TO "fund manager"
- Final CTA for Fund Flow OS
- End with Devin's sign-off: **"To great success and greater impact."**

### 6. FAQ Section
- Exactly 5 questions
- Each answer is 2-4 sentences
- Written in Answer Capsule style (extractable by AI)
- Include the primary keyword in at least 2 FAQ answers
- Questions should reflect what the ICP would actually type into Google

---

## Writing Rules

### Content Rules
- Answer Capsules in ~60% of H2 sections
- 8th grade reading level (Flesch-Kincaid Grade Level 8 or lower)
- Source-backed claims every 150-200 words
- 4-7 internal links per post
- No em dashes anywhere in the entire post
- Primary keyword in: title, TL;DR, first 100 words, at least 3 H2s, conclusion, 2+ FAQ answers
- Secondary keywords distributed naturally (don't force them)
- Total word count: 1,500-3,000 words (varies by topic depth)

### Formatting Rules
- H2 for main sections, H3 for subsections
- Bold for emphasis (sparingly, meaningful emphasis only)
- Bullet points and numbered lists for scannable content
- Short paragraphs (2-4 sentences maximum)
- Tables when comparing data, options, or features
- Code blocks only for technical examples (schema markup, etc.)

### SEO Technical Rules
- One H1 (the title) only
- Logical heading hierarchy (H2 > H3, never skip levels)
- Alt text suggestions for any recommended images
- Meta description suggestion (150-160 characters)
- URL slug suggestion (lowercase, hyphens, keyword-focused)

---

# PHASE 3.5: VISUALS (Nano Banana Image Generation)

After writing the article, generate all visual assets using the Nano Banana skill (Gemini CLI + FAL API). Every blog post gets a complete visual package.

## Visual Asset Checklist

Every blog post should include:

| Asset | Purpose | Dimensions | FAL Size Param |
|-------|---------|------------|----------------|
| **Featured/Hero Image** | Top of article, OG preview, social shares | 1200x630 | `{"width": 1200, "height": 630}` |
| **Section Infographic(s)** | Visual breakdown of key concepts (1-3 per post) | 1200x800 or taller | `{"width": 1200, "height": 800}` |
| **Data Visualization** | Charts, comparisons, process flows | 1200x800 | `{"width": 1200, "height": 800}` |
| **CTA Banner** | Visual CTA for Fund Flow OS (before conclusion) | 1200x400 | `{"width": 1200, "height": 400}` |
| **Social Share Variants** | Platform-specific versions of the featured image | See below | See below |

### Social Share Image Sizes

| Platform | Dimensions | FAL Size Param |
|----------|------------|----------------|
| LinkedIn | 1200x628 | `{"width": 1200, "height": 628}` |
| X/Twitter | 1200x675 | `{"width": 1200, "height": 675}` |
| Facebook | 1200x630 | `{"width": 1200, "height": 630}` |
| Instagram (square) | 1080x1080 | `square_hd` |
| Instagram (portrait carousel) | 1080x1350 | `{"width": 1080, "height": 1350}` |

---

## Step 3.5.1: Featured/Hero Image

Generate the main blog image that appears at the top of the article and in social previews.

**Prompt construction rules:**
- Include the article's core topic/theme visually
- Use Devin's brand visual style: modern, clean, diverse representation, warm lighting
- Leave negative space for text overlay potential (but the image should work without text too)
- Avoid generic stock photo aesthetics
- Include "no text, no words, no letters" in the prompt to prevent AI-generated text artifacts

**Prompt template:**
```
[Topic-specific scene], [professional/editorial photography style], modern office or real estate setting, warm lighting, diverse professionals, clean composition with negative space on [left/right] for text overlay, high resolution, magazine quality, no text no words no letters
```

**Example for a "How to Raise Capital" article:**
```bash
curl -X POST "https://fal.run/fal-ai/flux-pro/v1.1" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Confident diverse real estate investors reviewing a modern digital dashboard showing fund performance metrics, professional office with city skyline view, warm golden hour lighting through floor-to-ceiling windows, editorial photography style, clean composition with negative space on left, high resolution, no text no words no letters",
    "image_size": {"width": 1200, "height": 630},
    "num_images": 3,
    "output_format": "jpeg",
    "num_inference_steps": 28,
    "guidance_scale": 3.5
  }'
```

Generate 3 variations. Present them to the user. Pick the best one.

---

## Step 3.5.2: Section Infographics

For each blog post, identify 1-3 sections that would benefit from a visual breakdown. These are the money images that make content shareable and linkable.

### When to Create an Infographic

| Section Content | Infographic Type | Example |
|----------------|-----------------|---------|
| **Step-by-step process** | Numbered flow diagram | "5 Steps to Launch a Real Estate Fund" |
| **Comparison** | Side-by-side or table visual | "506(b) vs 506(c) at a Glance" |
| **Statistics/data** | Data visualization with key numbers | "Only 1.4% of $82T AUM managed by minorities" |
| **Checklist** | Visual checklist graphic | "Fund Launch Compliance Checklist" |
| **Timeline** | Horizontal timeline | "Your First 90 Days as a Fund Manager" |
| **Hierarchy/structure** | Layered diagram | "The Capital Stack Explained" |
| **Before/After** | Split comparison | "Spreadsheet Chaos vs Fund Flow OS" |

### Infographic Prompt Strategy

Use the Nano Banana `infographic-edu-visual.json` prompt library first:

```
Grep pattern="[relevant keyword]" path="~/.claude/skills/nano-banana/references/infographic-edu-visual.json"
```

If no matching template exists, build a custom prompt:

**Infographic prompt template:**
```
Clean professional infographic showing [CONCEPT], [LAYOUT TYPE: vertical flow / side-by-side comparison / numbered steps / data visualization], modern flat design style, [BRAND COLORS: navy blue and gold accents], white background, clear visual hierarchy, icons and simple illustrations, minimal text placeholders, high resolution, professional business style, no photorealism
```

**For data-heavy infographics, use Gemini CLI diagram mode:**
```bash
gemini --yolo "/diagram '[DESCRIPTION OF THE DATA/PROCESS TO VISUALIZE]'" --aspect=3:4
```

### Infographic Rules
- Use clean, flat design (not photorealistic) for infographics
- Keep text to a minimum in the image (labels and numbers only)
- Include the actual data/stats from the article's source-backed claims
- Write detailed alt text for every infographic (SEO + accessibility)
- If the infographic visualizes a process, generate a description of what each step shows (for the article body to reference)

---

## Step 3.5.3: Data Visualizations

When the article includes statistics or comparisons, create visual representations:

**Types of data visualizations to generate:**
- **Key stat callouts**: Large number with context (e.g., "1.4% of $82 trillion")
- **Comparison graphics**: Side-by-side feature/benefit comparisons
- **Process flows**: How something works, step by step
- **Before/after**: The transformation your product enables

**Prompt template for data visualizations:**
```
Professional data visualization showing [SPECIFIC DATA POINT], clean modern design, [navy blue / gold / white] color palette, large bold numbers, minimal supporting text, infographic style, white or dark background, business professional aesthetic, high resolution, no photorealism
```

---

## Step 3.5.4: CTA Banner Image

Generate a visual CTA banner for the Fund Flow OS section of the article.

**Prompt template:**
```
Modern SaaS dashboard preview showing investor management platform interface, clean UI with charts and data tables, dark mode interface with blue accent lighting, professional tech product screenshot aesthetic, high resolution, no text no words no letters
```

**Size:** 1200x400 (wide banner format)

This image goes above or beside the CTA section to visually sell Fund Flow OS.

---

## Step 3.5.5: Social Share Variants

After selecting the best featured image, generate platform-specific variants:

1. **Resize the featured image concept** for each platform's optimal dimensions
2. For Instagram carousel posts (from Phase 5 repurposing), generate **3-5 carousel slides** at 1080x1350:
   - Slide 1: Hook/title slide (text-ready background)
   - Slides 2-4: Key takeaway visuals (one insight per slide)
   - Slide 5: CTA slide (text-ready background)

**Carousel slide prompt template:**
```
Clean modern slide background for social media carousel, [TOPIC-SPECIFIC VISUAL ELEMENT], minimalist design, [navy/gold/white] color palette, large area for text overlay, professional aesthetic, 1080x1350 portrait format, no text no words no letters
```

---

## Image Integration into Article

After generating all visuals, update the blog post markdown with image references:

```markdown
![Alt text describing the image for SEO and accessibility](image-filename.jpg)
*Caption: Brief description that adds context or cites the data source*
```

### Alt Text Rules
- Describe what the image shows (not "infographic" but "flowchart showing the 5 steps to launch a real estate fund under Reg D")
- Include the primary keyword naturally in at least 1 alt text
- Keep alt text under 125 characters
- For infographics, describe the key data point or takeaway

### Image Placement in Article
- **Featured image**: Before the TL;DR or immediately after the title
- **First infographic**: In or after the 2nd H2 section (visual break)
- **Data visualization**: Adjacent to the source-backed claim it illustrates
- **CTA banner**: Immediately before the CTA section (around 70% of the article)
- **Additional infographics**: Spread evenly, no more than 1 per 2 H2 sections

---

## Visual Output Summary

After generating all visuals, present:

```
## Visual Assets Generated

| Asset | File | Dimensions | Method |
|-------|------|------------|--------|
| Featured Image | hero-[slug].jpg | 1200x630 | FAL Flux Pro |
| Infographic 1: [topic] | infographic-1-[slug].jpg | 1200x800 | FAL / Gemini |
| Infographic 2: [topic] | infographic-2-[slug].jpg | 1200x800 | FAL / Gemini |
| Data Viz: [stat] | dataviz-[slug].jpg | 1200x800 | FAL / Gemini |
| CTA Banner | cta-banner-[slug].jpg | 1200x400 | FAL Flux Pro |
| LinkedIn Share | social-linkedin-[slug].jpg | 1200x628 | FAL Flux Pro |
| X/Twitter Share | social-twitter-[slug].jpg | 1200x675 | FAL Flux Pro |
| IG Square | social-ig-square-[slug].jpg | 1080x1080 | FAL Flux Pro |
| IG Carousel (5 slides) | carousel-[1-5]-[slug].jpg | 1080x1350 | FAL Flux Pro |

**Total images:** [X]
**Estimated cost:** ~$[X.XX]
**Files saved to:** ./nanobanana-output/blog/[slug]/
```

---

# PHASE 4: PUBLISHING

## Option A: Manual Publish
Deliver the complete article in clean Markdown, ready to paste into WordPress, Webflow, Ghost, or any CMS.

## Option B: API Publish (Arvo Integration)
If the user has Arvo (arvo.com) connected:

1. Send the article to Arvo via their API with:
   - Title
   - Primary keyword
   - Article body
   - Meta description
   - Internal links (from sitemap)
   - Call to action
2. Arvo handles: SEO formatting, internal linking from sitemap, image generation/placement, meta tags, and auto-publishing to the website
3. Verify the article is live on the site

**Arvo Setup (one-time):**
- Connect Arvo to your website (WordPress, Webflow, etc.) via their Integrations page
- Grab the Arvo API key from Settings > API
- Configure default campaign settings: brand voice, CTA, sitemap link, YouTube channel, image preferences

## Option C: Direct CMS Publish
If the user has a WordPress REST API or similar CMS API configured, publish directly.

---

# PHASE 5: REPURPOSING (Blog to Social)

After publishing, generate social content from the blog article.

## 5.1: LinkedIn Post
- Pull the core insight from the article
- Write a 150-250 word LinkedIn post in Devin's voice
- Include the blog URL as a "read more" link
- Use the LinkedIn calibration from the voice guide: casual but polished, data-driven, peer-level

## 5.2: X/Twitter Thread
- 3-5 tweet thread pulling key takeaways
- Tweet 1: Hook with the primary insight (no link)
- Tweets 2-4: Key data points, tips, or insights from the article
- Final tweet: CTA + blog link

## 5.3: Instagram Caption
- Write a caption for a carousel or static post
- Lead with a hook that matches the article's primary pain point
- Include 3-5 bullet takeaways
- CTA: "Link in bio for the full breakdown"
- 5-10 relevant hashtags

## 5.4: Facebook Post
- Conversational tone
- Lead with a question or relatable scenario
- 2-3 key takeaways
- Link to blog

## 5.5: Email Newsletter Snippet
- 3-4 sentence teaser for the email list
- Hook + one key insight + CTA to read the full article
- Subject line suggestion

---

# OUTPUT DELIVERABLES

For every blog post, deliver:

### 1. Full Blog Post in Clean Markdown
Complete post, formatted and ready for CMS. No HTML in the body unless needed.

### 2. FAQ Schema JSON-LD

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question 1]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer 1]"
      }
    }
  ]
}
</script>
```

### 3. Author Schema JSON-LD

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "author": {
    "@type": "Person",
    "name": "Devin Robinson",
    "url": "https://pfpsolutions.us/about",
    "jobTitle": "Founder",
    "worksFor": {
      "@type": "Organization",
      "name": "Fund Flow OS"
    },
    "sameAs": [
      "https://www.linkedin.com/in/devinrobinson",
      "https://www.youtube.com/@devinrobinson",
      "https://www.instagram.com/devinrobinson"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "PFP Solutions",
    "url": "https://pfpsolutions.us"
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "description": "[Meta description]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pfpsolutions.us/blog/[slug]"
  }
}
</script>
```

### 4. Social Repurpose Pack
- LinkedIn post
- X/Twitter thread
- Instagram caption
- Facebook post
- Email newsletter snippet

### 5. Post-Delivery Summary

| Metric | Value |
|--------|-------|
| Word Count | [number] |
| Estimated Reading Level | [Flesch-Kincaid grade] |
| Source-Backed Claims | [count] |
| Internal Links | [count] |
| Answer Capsules | [count] / [total H2s] |
| Primary Keyword | [keyword] |
| Primary Keyword Frequency | [count] |
| FAQ Questions | 5 |
| Meta Description | [150-160 chars] |
| URL Slug | /blog/[slug] |
| Target ICP | [Chapter 1 / Chapter 2 / Both] |
| Primary CTA | Fund Flow OS free trial |
| Secondary CTA | [contextual lead magnet] |
| Em Dashes Found | 0 (verified) |
| Competitor Gap Filled | [which competitor gap this addresses] |
| Images Generated | [count] (hero, infographics, data viz, CTA, social variants) |
| Image Cost | ~$[X.XX] |
| Social Posts Generated | [count] |

---

# QUALITY CHECKLIST

Before delivering, verify EVERY item:

### Content Quality
- [ ] Title is 50-65 characters with primary keyword
- [ ] TL;DR is present, bold, and includes primary keyword
- [ ] Introduction hooks with ICP pain point in first 100 words
- [ ] 5-7 H2 sections with logical flow
- [ ] Answer Capsules in ~60% of H2 sections (bold, 2-4 sentences)
- [ ] Source-backed claims every 150-200 words with REAL URLs
- [ ] 4-7 internal links with descriptive anchor text
- [ ] 8th grade reading level throughout
- [ ] Zero em dashes in the entire post (search every line)
- [ ] Primary keyword in title, TL;DR, intro, 3+ H2s, conclusion, 2+ FAQs

### Voice & Brand
- [ ] Voice sounds like Devin (professional side of casual)
- [ ] No corporate speak, no engagement-bait
- [ ] E-E-A-T signals present (personal experience, expertise markers)
- [ ] At least 1 credibility anchor used naturally

### CTAs
- [ ] Fund Flow OS CTA appears at 40% mark, before conclusion, and in conclusion
- [ ] Secondary CTA matches the content topic (per offers mapping)
- [ ] CTA tone is matter-of-fact, not salesy

### Structure & SEO
- [ ] Conclusion ends with "To great success and greater impact."
- [ ] FAQ section has exactly 5 questions with extractable answers
- [ ] FAQ Schema JSON-LD is complete and valid
- [ ] Author Schema JSON-LD is complete and valid
- [ ] Meta description is 150-160 characters
- [ ] URL slug is clean, lowercase, keyword-focused

### Visuals (Nano Banana)
- [ ] Featured/hero image generated (1200x630)
- [ ] 1-3 section infographics created for key concepts
- [ ] Data visualizations for major statistics
- [ ] CTA banner image for Fund Flow OS section
- [ ] Alt text written for every image (keyword-inclusive, under 125 chars)
- [ ] Images placed correctly in article (hero, 2nd H2, data sections, before CTA)
- [ ] Social share variants generated for each platform
- [ ] All images saved to `./nanobanana-output/blog/[slug]/`

### Competitive Edge
- [ ] This article is BETTER than what competitors have on this topic
- [ ] Covers angles competitors miss (from Phase 1 gap analysis)
- [ ] Goes deeper with more sources, more data, more practical advice
- [ ] Has custom visuals that competitors don't (infographics, data viz)

### Deliverables
- [ ] Post-delivery summary table is filled in
- [ ] Visual assets summary table is filled in
- [ ] Social repurpose pack is complete (if requested)

---

# AUTOMATION MODE

For hands-off weekly content generation, the user can say:

**"Run my weekly blog plan"** — This triggers the full pipeline:

1. **Monday**: Run Phase 1 intelligence, present top 5 opportunities
2. **User picks** 2-3 topics
3. **Tuesday-Thursday**: Write articles (Phase 2-3), present for review
4. **Friday**: Publish approved articles (Phase 4) + generate social content (Phase 5)

**"Run my monthly SEO audit"** — This triggers:
1. Re-run Phase 1 competitor analysis
2. Check which published articles are ranking (WebSearch for `site:pfpsolutions.us [keyword]`)
3. Identify new gaps since last analysis
4. Recommend content updates for existing articles that could rank higher
5. Present next month's content calendar

---

# BATCH MODE

For bulk article generation:

```
/seo-blog-engine batch 5
```

1. Runs full Phase 1 intelligence
2. Presents top 10 opportunities
3. User picks 5
4. Generates outlines for all 5, presents for batch approval
5. Writes all 5 articles sequentially
6. Delivers complete package with all deliverables

---

# CONTENT PERFORMANCE TRACKING

After articles have been live for 2+ weeks, check performance:

### Check Rankings
```
WebSearch:
- site:pfpsolutions.us [primary keyword]
- "[article title]"
- [primary keyword] (check if pfpsolutions.us appears in results)
```

### Performance Metrics to Track
- Is the article ranking on page 1 for the primary keyword?
- Is it appearing in AI search results (Perplexity, ChatGPT)?
- Which sections are getting featured snippets?
- Are Answer Capsules being extracted by AI engines?

### Optimization Recommendations
If an article isn't ranking after 4 weeks:
- Update with fresher statistics and sources
- Add more Answer Capsules
- Strengthen internal linking
- Add more E-E-A-T signals
- Expand thin sections
- Update the publication date

---

# TOPIC CLUSTER STRATEGY

Don't write random articles. Build topic clusters that dominate search:

### Pillar + Spoke Model
```
PILLAR ARTICLE (3,000+ words, broad topic):
  "The Complete Guide to Raising Capital for a Real Estate Fund"
    |
    |-- SPOKE: "506(b) vs 506(c): Which Reg D Exemption Is Right for Your Fund?"
    |-- SPOKE: "How to Write a PPM for Your First Real Estate Fund"
    |-- SPOKE: "7 Private Lender Management Mistakes That Kill Deals"
    |-- SPOKE: "How to Build an Investor Pipeline From Scratch"
    |-- SPOKE: "Fund Flow OS Review: AI-Powered Capital Raising for RE Operators"
    |-- SPOKE: "What Is a Capital Stack? A Real Estate Operator's Guide"
```

Every spoke links back to the pillar. The pillar links to every spoke. This builds topical authority that Google rewards.

### Suggested Topic Clusters for pfpsolutions.us:
1. **Capital Raising** (pillar) + raise strategies, investor types, pitch prep, compliance
2. **Fund Management** (pillar) + structures, legal, operations, reporting, technology
3. **Private Lender Management** (pillar) + tracking, relationships, returns, scaling
4. **AI in Real Estate** (pillar) + automation, tools, Fund Flow OS, future of RE

---

# MONEY PAGES & SERVICE PAGES

Not all SEO content is blog posts. The highest-converting pages on any site are **money pages**: service pages, product pages, and comparison pages that directly match buyer intent keywords.

## When to Create a Money Page Instead of a Blog Post

| If the keyword is... | Create a... | Example |
|---------------------|-------------|---------|
| A product/service the user sells | **Service page** | "investor management software" |
| A direct comparison | **Comparison page** | "Fund Flow OS vs spreadsheets" |
| A specific offer | **Landing page** | "7-day syndication launch" |
| An educational topic | **Blog post** | "how to structure a real estate fund" |
| A tool/resource | **Resource page** | "capital stack calculator" |

## Money Page SEO Rules

Money pages follow the same SEO principles as blog posts (Answer Capsules, source-backed claims, E-E-A-T) but with key differences:

1. **Shorter, more direct** (800-1,500 words vs 1,500-3,000 for blogs)
2. **CTA is the primary purpose** (not secondary like in blog posts)
3. **Comparison tables are essential** (feature vs feature, product vs product)
4. **Social proof heavy** (testimonials, case studies, numbers)
5. **FAQ section focused on objections** (not just informational questions)
6. **Schema markup**: Use Product or Service schema instead of Article schema

### Comparison Tables (SEO Gold)

Comparison tables are one of the highest-performing elements for both Google featured snippets and AI citations. Use them whenever comparing:
- Your product vs competitors
- Two approaches (syndication vs fund, 506b vs 506c)
- Before/after scenarios (spreadsheets vs Fund Flow OS)
- Pricing tiers or feature sets

**Format:**
```markdown
| Feature | Spreadsheets | Fund Flow OS |
|---------|-------------|--------------|
| Investor tracking | Manual, error-prone | Automated, real-time |
| Return calculations | Formula hell | One-click reports |
| Investor portal | None | Branded, self-service |
| Compliance | Hope for the best | Built-in guardrails |
```

Google loves tables. AI search engines love tables. Readers love tables. Use them.

## When Running Phase 1 Intelligence

When identifying keyword opportunities, flag which ones should be **money pages** vs **blog posts**. Present them separately:

```
### Money Page Opportunities (Service/Product Pages)
| # | Page Title | Primary Keyword | Intent Score | Current Gap |
|---|-----------|-----------------|-------------|-------------|

### Blog Post Opportunities (Educational Content)
| # | Topic / Title | Primary Keyword | Intent Score | Current Gap |
|---|--------------|-----------------|-------------|-------------|
```

Money pages come first because they convert directly.

---

# RULES

1. **NEVER fabricate sources, URLs, statistics, or data.** If you can't verify it, frame it as a general observation.
2. **NEVER write em dashes.** Not one. Not anywhere. Search the entire output before delivering.
3. **NEVER skip the research phase.** The intelligence gathering is what makes this content rank.
4. **ALWAYS check the sitemap** before writing to avoid topic cannibalization and find real internal links.
5. **ALWAYS present the outline** and wait for approval before writing the full article.
6. **ALWAYS include both schemas** (FAQ + Author) with every article.
7. **ALWAYS end with** "To great success and greater impact."
8. **Content must be BETTER** than what's currently ranking. Not the same. Better. More sources, more depth, more practical, more E-E-A-T.
9. **Write for search intent, not for algorithms.** LLMs are matching intent to results better every day. The more precisely your content answers what someone actually wants, the more it shows up. Don't keyword-stuff. Intent-match.
10. **Comparison tables in every post.** Google, AI search, and readers all love tables. Include at least one comparison table per article when the topic allows it.
11. **Score every keyword opportunity** using the Intent-Matching Scoring system (Buyer Intent + Specificity + Product Fit + Competition Gap). Write 9-12s first.

---

# REFERENCES

- Voice guide: `~/.claude/skills/_references/voice.md`
- ICP profiles: `~/.claude/skills/_references/icp.md`
- Offer suite & CTA mapping: `~/.claude/skills/_references/offers.md`
- Author profile: `~/.claude/skills/_references/author-profile.md`
- Sitemap: https://pfpsolutions.us/sitemap.xml

---

# PART OF THE CONTENT TEAM

```
/daily-content-researcher → Fresh topic ideas (video-focused)
/competitor-analyst → What competitors do better (video + content)
/content-analyst → Your content performance data
/seo-blog-engine (this skill) → Full blog content pipeline
/repurpose → Turn any content into multi-platform posts
```

This skill handles everything from research to publish for blog content. For video content, use the video pipeline skills. For turning blog content into social, this skill's Phase 5 handles it, or use `/repurpose` for deeper platform-specific adaptation.
