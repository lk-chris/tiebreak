# ⚡ tiebreak

> Decisions your crew is still arguing about — settled.

**tiebreak** is a fast, delightful group polling and decision-making web application built 1:1 from the prototype specifications, elevated with modern web development practices: React 18, TypeScript, Vite, responsive CSS custom properties, and client state management.

---

## 🎨 Design System & Tokens

The application strictly adheres to the retro-warm palette and bold typography:

- **Primary Font**: `Bricolage Grotesque`, sans-serif (weights: 400, 600, 800)
- **Palette**:
  - Background: `--bg: #f9f0e0`
  - Cards & Panels: `--card: #fffaf0`
  - Inks & Lines: `--ink: #3a2417`, `--line: #3a2417`
  - Accents:
    - Pepper Red: `--red: #e2522b`
    - Warm Yellow: `--yel: #f2c14e`
    - Spruce Teal: `--teal: #1f7a6d`
    - Muted Teal: `--tealbg: #cfe6e0`
    - Sand: `--sand: #eddfc6`
    - Muted Caption: `--mut: #8a6f5c`
- **Key Details**:
  - Chunky 2px ink borders with large pill radii
  - Playful text-shadow on headings: `3px 3px 0 var(--yel)`
  - 45° angled ribbons (`IN THE LEAD`, `WINNER`, `TIE`)
  - Segmented vote tally meters
  - Responsive safe-area inset handling (`env(safe-area-inset-*)`)

---

## 🧭 Routes & Features

All routes are fully interactive and bookmarkable via hash routing:

1. **`#polls` (My Polls)**
   - Displays all active and draft polls with live vote statuses and leading margins.
   - Quick action to create a new poll.
2. **`#live` (Live Results)**
   - Leader card with yellow badge, percentage, tally meters, and segment indicators.
   - Runner-up vote progress bars and vote counts.
   - Live share link copy with toast notification.
   - Ability to end voting and trigger tie/winner determination.
3. **`#vote` (Vote Interface)**
   - Radio option selection with checkmark indicators.
   - Vote button with disabled state protection.
   - Suggestion entry trigger.
4. **`#suggest` (Option Suggestion)**
   - Idea name and justification pitch form.
   - Submits to poll with toast notification.
5. **`#voted` (Vote Confirmation)**
   - Confirmation badge with selected option.
   - Navigation to live results or vote alteration.
6. **`#new` (Poll Creator)**
   - Question prompt.
   - Dynamic option list with addition/removal.
   - Expiration timeline selection.
   - Toggles for suggestions and live result visibility.
7. **`#created` (Shareable Launch View)**
   - Instant shareable link with clipboard copy action.
8. **`#results` (Final Results & Tie-Breaking)**
   - Winner celebration or Tie resolution state.
   - In tie state, interactive buttons allow the host to pick the winning option.
   - Toggle to preview tie vs. winner states.
9. **`#closed` (Archive)**
   - History of concluded polls with winner and tie-break records.
10. **`#profile` (User Settings)**
    - Configurable display name.
    - Avatar color selector with real-time header avatar sync.
    - Notification preferences.

---

## 🛠️ Tech Stack & Architecture

- **React 18** with functional components and hooks
- **TypeScript** for end-to-end type safety
- **Vite** for blazing fast HMR and optimized production builds
- **Context API** (`PollContext`) with unified state for polls, selections, profile, and toast notifications
- **CSS3** with CSS custom properties, grid/flexbox, and mobile breakpoint queries

---

## 🚀 Getting Started

### Development
```bash
npm run dev
```
Runs the local dev server at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

### Preview Production
```bash
npm run preview
```
Previews the built application locally.
