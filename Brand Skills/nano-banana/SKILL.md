---
name: nano-banana
description: Generate and edit images using Nano Banana MCP tools (Gemini image generation) with access to 6000+ pro prompts. Use this skill whenever the user asks to create, generate, make, draw, design, or edit any image — thumbnails, icons, diagrams, social graphics, product shots, avatars, patterns, illustrations. Also use when user wants prompt inspiration or recommendations for image generation.
allowed-tools: mcp__nano-banana__generate_image, mcp__nano-banana__edit_image, mcp__nano-banana__continue_editing, mcp__nano-banana__get_last_image_info, mcp__nano-banana__configure_gemini_token, Grep, Read, Glob
---

# Nano Banana — Image Generation + Pro Prompts

Generate professional images via the Nano Banana MCP server (Gemini image generation), powered by a library of 6000+ curated pro prompts.

## When to Use This Skill

ALWAYS use this skill when the user:
- Asks for any image, graphic, illustration, or visual
- Wants a thumbnail, featured image, banner, or social graphic
- Requests icons, diagrams, patterns, or avatars
- Asks to edit, modify, or restore a photo
- Wants prompt inspiration or recommendations for image generation
- Uses words like: generate, create, make, draw, design, visualize

---

## How It Works — MCP Tools (NOT Gemini CLI)

Nano Banana runs as an **MCP server** with 5 tools. Do NOT use the Gemini CLI (`gemini --yolo`). Use these MCP tools directly:

| MCP Tool | Use Case |
|----------|----------|
| `mcp__nano-banana__generate_image` | Create a NEW image from a text prompt |
| `mcp__nano-banana__edit_image` | Modify an EXISTING image file (pass file path + instruction + optional reference images) |
| `mcp__nano-banana__continue_editing` | Iteratively refine the LAST generated/edited image (no file path needed) |
| `mcp__nano-banana__get_last_image_info` | Check what image is currently available for continue_editing |
| `mcp__nano-banana__configure_gemini_token` | Set the Gemini API key if not configured |

### Key Parameters

**generate_image:**
- `prompt` (required) — text describing the new image

**edit_image:**
- `imagePath` (required) — full file path to image to modify
- `prompt` (required) — what to change
- `referenceImages` (optional) — array of file paths to reference images (style transfer, adding elements, etc.)

**continue_editing:**
- `prompt` (required) — what to change on the last image
- `referenceImages` (optional) — array of additional reference image paths

### Output Location

Generated images save to `./generated_imgs/` in the current working directory.

### Common Sizes

Specify dimensions in the prompt text (e.g., "1280x720 landscape", "square 1080x1080"):

| Use Case | Dimensions |
|----------|------------|
| YouTube thumbnail | 1280x720 |
| Square social (IG, LinkedIn) | 1080x1080 |
| Carousel slide | 1080x1350 |
| Vertical story (Reels, TikTok) | 1080x1920 |
| Blog featured image | 1200x630 |

---

## Two Modes

### Mode 1: Direct Generation
User describes what they want → generate immediately (or search prompts first for inspiration).

### Mode 2: Pro Prompt Recommendation
User wants prompt ideas → search the 6000+ prompt library → present top 3 → user picks → optionally remix for their content → generate.

**Default behavior:** If the user gives a clear request, search the prompt library first for a matching pro prompt. If found, offer it. If not, generate with a custom prompt. Always bias toward using the curated library — the prompts are battle-tested.

---

## Pro Prompt Library (6000+ Prompts)

Reference files live in `references/` next to this skill file:

| File | Category | Count |
|------|----------|-------|
| `profile-avatar.json` | Profile / Avatar | 836 |
| `social-media-post.json` | Social Media Post | 4833 |
| `infographic-edu-visual.json` | Infographic / Edu Visual | 390 |
| `youtube-thumbnail.json` | YouTube Thumbnail | 131 |
| `comic-storyboard.json` | Comic / Storyboard | 236 |
| `product-marketing.json` | Product Marketing | 2575 |
| `ecommerce-main-image.json` | E-commerce Main Image | 269 |
| `game-asset.json` | Game Asset | 259 |
| `poster-flyer.json` | Poster / Flyer | 392 |
| `app-web-design.json` | App / Web Design | 143 |
| `others.json` | Uncategorized | 730 |

### Category Signal Mapping

| User Request Signals | File |
|---------------------|------|
| avatar, profile picture, headshot, portrait, selfie | `profile-avatar.json` |
| post, instagram, twitter, facebook, social, viral | `social-media-post.json` |
| infographic, diagram, educational, data viz, chart | `infographic-edu-visual.json` |
| thumbnail, youtube, video cover, click-bait | `youtube-thumbnail.json` |
| comic, manga, storyboard, panel, cartoon story | `comic-storyboard.json` |
| product, marketing, advertisement, promo, campaign | `product-marketing.json` |
| e-commerce, product photo, white background, listing | `ecommerce-main-image.json` |
| game, asset, sprite, character design, item | `game-asset.json` |
| poster, flyer, banner, announcement, event | `poster-flyer.json` |
| app, UI, website, interface, mockup | `app-web-design.json` |

### CRITICAL: Token Optimization

**NEVER fully load category files.** Use Grep to search:
```
Grep pattern="keyword" path="~/.claude/skills/nano-banana/references/category-name.json"
```
- Search multiple category files if the need spans categories
- Load only matching prompts, not entire files

---

## Workflow

### Step 1: Understand the Request

If vague, ask:
- What style? (realistic, illustration, cartoon, abstract, editorial)
- What mood? (professional, playful, dramatic, minimal)
- What dimensions? (square, landscape, portrait, thumbnail)
- What's it for? (social post, thumbnail, product shot, avatar)

If clear, proceed directly.

### Step 2: Search Pro Prompts

1. Identify target category from signal mapping
2. Use Grep to search relevant file(s) with keywords from user's request
3. If no match in primary category, search `others.json`
4. If still no match, craft a custom prompt (mark it as AI-generated)

### Step 3: Present Results

**Max 3 prompts per request.** For each:

```markdown
### [Prompt Title]
**Description**: [Brief description]
**Prompt**:
\`\`\`
[Exact prompt from content field]
\`\`\`
**Sample Images**: [sourceMedia URLs if available]
**Requires Reference Images**: [Yes/No based on needReferenceImages]
```

Then ask: "Want me to generate one of these? Pick 1/2/3, or describe what you want and I'll customize."

### Step 4: Remix (If User Provides Content)

When user provides article/video/content for illustration:
1. Extract core theme, key concepts, emotional tone, visual metaphors
2. Keep the style/structure from selected template
3. Replace subject matter with elements from user's content
4. Adjust details based on any personalization answers

### Step 5: Generate

Call the appropriate MCP tool:

- **New image:** `mcp__nano-banana__generate_image` with your prompt
- **Edit existing:** `mcp__nano-banana__edit_image` with file path + instruction
- **Refine last result:** `mcp__nano-banana__continue_editing` with adjustment instruction

After generation:
1. The tool returns the file path and displays the image inline
2. Present the path to the user so they can click to open
3. Offer to refine with `continue_editing` if needed

### Refinement Shortcuts
- **"Try again"**: Call `generate_image` again with adjusted prompt
- **"Make it more [adjective]"**: Use `continue_editing` with the adjustment
- **"Edit this one"**: Use `edit_image` with the file path and instruction
- **"Use this as reference"**: Use `edit_image` with `referenceImages` array

---

## Prompt Crafting Tips

1. **Be specific**: Include style, mood, colors, composition details
2. **Add "no text"**: If you don't want text rendered in the image
3. **Reference styles**: "editorial photography", "flat illustration", "3D render", "watercolor"
4. **Specify aspect ratio context**: "wide banner", "square thumbnail", "vertical story"

## Output Location

All generated images save to `./generated_imgs/` in the current working directory.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| API key not configured | Call `mcp__nano-banana__configure_gemini_token` with your key |
| Quota exceeded | Wait for reset or switch model |
| Image generation failed | Check prompt for policy violations, simplify request |
| MCP tool not found | Check that nano-banana MCP server is running in `.mcp.json` |
