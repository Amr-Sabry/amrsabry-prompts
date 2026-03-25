# PromptLens — SPEC.md

> Extract text from images → Plain + JSON → Save to Library

---

## 1. Concept & Vision

PromptLens is a local-first tool for creatives who see text on images (memes, design mockups, AI生成 content) and want to extract, reuse, and organize that text. It feels like a sharp, professional design tool — not a generic utility. Bold, dark, confident. Built for power users who work with prompts across multiple languages.

---

## 2. Design Language

**Aesthetic:** Dark studio / creative tool aesthetic — inspired by Figma's dark mode crossed with a terminal's precision.

**Color Palette:**
- Background: `#0a0a0f` (near-black)
- Surface: `#14141f` (card/panel bg)
- Border: `#2a2a3d` (subtle borders)
- Primary: `#7c3aed` (vivid violet — accent)
- Secondary: `#22d3ee` (cyan — secondary actions)
- Text Primary: `#f0f0ff`
- Text Muted: `#6b7280`
- Success: `#22c55e`
- Danger: `#ef4444`
- Warning: `#f59e0b`

**Typography:**
- Font: `Cairo` (Google Fonts) — Arabic-friendly, modern, strong character
- Mono: `JetBrains Mono` for extracted text/code boxes

**Spatial System:**
- Base unit: 4px
- Section spacing: 32px / 48px
- Card padding: 20px
- Border radius: 12px (cards), 8px (buttons/inputs)

**Motion:**
- Fade + slide-up on page load (200ms ease-out)
- Copy button: brief flash green + scale pulse
- Library cards: stagger entrance 50ms apart
- Tab switch: smooth underline slide
- Drag-over: pulsing border glow

**Visual Assets:**
- Icons: Lucide React (consistent stroke-width: 1.5)
- Decorative: subtle grid background pattern on hero area

---

## 3. Layout & Structure

### Pages

**1. Home (Extract) — `/`**
- Top: Logo + nav tabs (Extract | Library)
- Hero: Drag-and-drop zone (large, centered)
- Below zone: Image preview + Extracted Text outputs
- Two text boxes: Plain Text + JSON Format
- Copy buttons on each box
- Save to Library button

**2. Library — `/library`**
- Grid of saved prompt cards
- Search bar
- Each card: prompt preview, source image thumbnail, copy/edit/delete buttons
- Empty state with illustration

### Responsive Strategy
- Mobile: single column, full-width cards
- Desktop: max-width 1200px, centered

---

## 4. Features & Interactions

### Upload
- Drag & drop image onto zone
- Click to open file picker
- Accepts: PNG, JPG, WEBP, GIF, BMP
- Shows image preview after upload
- "Clear" button to reset

### OCR Extraction
- Uses Tesseract.js (runs entirely in browser — no server)
- Shows "Processing..." state with spinner
- Auto-detects language (multi-language OCR)
- Two outputs simultaneously:
  1. **Plain Text** — clean, line-broken text
  2. **JSON Format** — structured: `{ "text": "...", "language": "en", "confidence": 0.95 }`

### Copy
- Each box has a "Copy" button
- On click: copies to clipboard
- Button shows checkmark + "Copied!" for 2 seconds
- JSON output is pretty-printed (2-space indent)

### Save to Library
- Button appears after successful OCR
- Saves: extracted text (plain), JSON version, image thumbnail (base64), timestamp
- Stored in browser `localStorage`
- Shows toast notification on save

### Library
- Lists all saved prompts, newest first
- Search: filters by text content (live, no submit)
- Each card shows:
  - Truncated plain text preview (first 80 chars)
  - Language badge
  - Timestamp
  - Thumbnail of source image
  - **Copy Plain** button
  - **Copy JSON** button
  - **Delete** button (with confirm)
- Clicking card expands to show full text

### Delete
- Trash icon on each card
- Confirmation modal: "Delete this prompt?"
- On confirm: removes from localStorage, card fades out

### Error States
- No image selected: drop zone shows idle state
- OCR fails: shows error message with retry button
- Empty text result: "No text detected in this image"
- localStorage full: warning toast

---

## 5. Component Inventory

### DropZone
- States: idle (dashed border), hover (border glow + scale 1.02), processing (spinner), error (red border)
- Icon: Upload Cloud (Lucide)
- Text: "Drop an image here or click to browse"

### ImagePreview
- Shows uploaded image, max-height 300px, object-fit contain
- Rounded corners, border
- "Remove" button (X) top-right

### TextOutput (x2: Plain + JSON)
- Monospace font (JetBrains Mono)
- Dark surface background `#0d0d1a`
- Border left 3px solid primary color (violet for plain, cyan for JSON)
- Line numbers optional
- Copy button top-right corner of box
- Scrollable if content overflows

### CopyButton
- States: default (copy icon), success (check icon + green)
- Hover: slight scale up
- Click: brief scale pulse

### SaveButton
- Large, full-width on mobile
- Primary violet gradient
- Hover: brightness increase

### LibraryCard
- Surface card with border
- Thumbnail left, text right
- Action buttons row at bottom
- Hover: border brightens
- Selected/expanded: shows full text below

### Toast
- Bottom-right notification
- Success (green), Error (red), Info (violet)
- Auto-dismiss after 3s
- Slide-in from right

### TabNav
- Two tabs: Extract / Library
- Active: violet underline + bold
- Smooth underline slide on switch

### SearchBar
- Full-width input with search icon
- Debounced live filter (300ms)
- Clear button when text present

---

## 6. Technical Approach

**Framework:** Next.js 15 (App Router)
**Styling:** Tailwind CSS v4
**OCR:** Tesseract.js v5 (`tesseract.js` npm package)
**Icons:** Lucide React
**State:** React hooks (useState, useEffect, useLocalStorage custom hook)
**Storage:** localStorage (key: `promptlens_library`)
**Fonts:** Google Fonts (Cairo, JetBrains Mono)

### Data Model

```typescript
interface SavedPrompt {
  id: string;           // crypto.randomUUID()
  plainText: string;
  jsonText: string;
  imageThumbnail: string;  // base64 small preview
  language: string;
  confidence: number;
  createdAt: string;   // ISO timestamp
}
```

### API / Routing
- `/` — Extract page (client-side only, no server)
- `/library` — Library page (client-side only)
- All logic runs in-browser — zero backend needed

### Key Implementation Notes
- Tesseract.js worker loaded lazily (not on page load)
- Image resized client-side before OCR to max 2000px (performance)
- localStorage hook with JSON serialization
- Debounced search with useMemo/useCallback
- Responsive: mobile-first Tailwind classes
