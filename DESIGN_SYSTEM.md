# Radio Constanța Design System

## Overview

This document defines the design system for Radio Constanța, a modern glassmorphic web application optimized for mobile, tablet, desktop, and TV experiences.

## Design Philosophy

- **Glassmorphism**: Modern aesthetic with blur effects, transparency, and layered depth
- **Dark-First**: Optimized for low-light environments
- **Multi-Device**: Seamless experience from mobile to 4K TV
- **Accessibility**: Keyboard navigation, focus states, and ARIA support

---

## 1. Color System

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#00BFFF` | Primary actions, links, accents (cyan) |
| `secondary` | `#9333EA` | Secondary accents, alternative states (purple) |

### Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `dark-bg` | `#0C0C0C` | App background, darkest |
| `dark-surface` | `#1A1A1A` | Cards, surfaces, mid-tone |
| `dark-card` | `#1F1F1F` | Elevated elements, lightest dark |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `white` at 90% opacity | Primary text |
| `text-secondary` | `white` at 70% opacity | Secondary text, descriptions |
| `text-tertiary` | `white` at 50% opacity | Tertiary text, metadata |
| `text-disabled` | `white` at 30% opacity | Disabled states |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#10B981` | Success states |
| `warning` | `#F59E0B` | Warning states |
| `error` | `#EF4444` | Error states, live indicators (red) |
| `info` | `#3B82F6` | Information states |

---

## 2. Typography System

### Font Family

- **Primary**: Inter (Google Fonts)
- **Fallbacks**: system-ui, -apple-system, sans-serif
- **Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Type Scale (Responsive)

The type system automatically scales across devices using CSS variables:

| Token | Mobile | Tablet (768px+) | Desktop (1024px+) | TV (1920px+) | Usage |
|-------|---------|-----------------|-------------------|--------------|-------|
| `text-xs` | 0.75rem (12px) | 0.8125rem (13px) | 0.875rem (14px) | 1.125rem (18px) | Captions, metadata |
| `text-sm` | 0.875rem (14px) | 0.9375rem (15px) | 1rem (16px) | 1.375rem (22px) | Small body text |
| `text-base` | 1rem (16px) | 1.0625rem (17px) | 1.125rem (18px) | 1.625rem (26px) | Body text |
| `text-lg` | 1.125rem (18px) | 1.25rem (20px) | 1.375rem (22px) | 2rem (32px) | Large body, small headings |
| `text-xl` | 1.25rem (20px) | 1.5rem (24px) | 1.625rem (26px) | 2.5rem (40px) | Heading 4 |
| `text-2xl` | 1.5rem (24px) | 1.75rem (28px) | 2rem (32px) | 3rem (48px) | Heading 3 |
| `text-3xl` | 1.875rem (30px) | 2.125rem (34px) | 2.5rem (40px) | 3.75rem (60px) | Heading 2 |
| `text-4xl` | 2.25rem (36px) | 2.5rem (40px) | 3rem (48px) | 4.5rem (72px) | Heading 1 |

### Semantic Typography

| Component | Scale | Weight | Usage |
|-----------|-------|--------|-------|
| `Heading1` | `text-4xl` | 700 | Page titles |
| `Heading2` | `text-3xl` | 700 | Section titles |
| `Heading3` | `text-2xl` | 600 | Subsection titles |
| `Heading4` | `text-xl` | 600 | Card titles |
| `Body` | `text-base` | 400 | Body text |
| `BodyLarge` | `text-lg` | 400 | Emphasized body |
| `BodySmall` | `text-sm` | 400 | Small body |
| `Caption` | `text-xs` | 500 | Metadata, labels |

### Line Height

| Context | Value | Usage |
|---------|-------|-------|
| `leading-tight` | 1.25 | Headings |
| `leading-snug` | 1.375 | Subheadings |
| `leading-normal` | 1.5 | Body text |
| `leading-relaxed` | 1.625 | Long-form content |

---

## 3. Spacing System

### Base Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | 0.25rem (4px) | Minimal spacing |
| `spacing-sm` | 0.5rem (8px) | Tight spacing |
| `spacing-md` | 1rem (16px) | Default spacing |
| `spacing-lg` | 1.5rem (24px) | Section spacing |
| `spacing-xl` | 2rem (32px) | Large gaps |
| `spacing-2xl` | 3rem (48px) | Major sections |
| `spacing-3xl` | 4rem (64px) | Page sections |

### Component Spacing (Responsive)

| Component | Mobile | Tablet | Desktop | TV |
|-----------|---------|---------|----------|-----|
| Container padding X | 1rem (16px) | 1.5rem (24px) | 2rem (32px) | 3rem (48px) |
| Container padding Y | 1rem (16px) | 1.5rem (24px) | 2rem (32px) | 2.5rem (40px) |
| Card padding | 1rem (16px) | 1.25rem (20px) | 1.5rem (24px) | 2rem (32px) |
| Button padding X | 1rem (16px) | 1.25rem (20px) | 1.5rem (24px) | 2rem (32px) |
| Button padding Y | 0.75rem (12px) | 1rem (16px) | 1.25rem (20px) | 1.5rem (24px) |
| Gap (flex/grid) | 1rem (16px) | 1.25rem (20px) | 1.5rem (24px) | 2rem (32px) |

---

## 4. Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 0.25rem (4px) | Small elements, badges |
| `rounded-base` | 0.5rem (8px) | Default radius, inputs |
| `rounded-lg` | 0.75rem (12px) | Cards, buttons |
| `rounded-xl` | 1rem (16px) | Large cards, modals |
| `rounded-2xl` | 1.5rem (24px) | Prominent elements |
| `rounded-full` | 9999px | Pills, circular buttons |

### Component Radius

| Component | Radius | Notes |
|-----------|--------|-------|
| Button (small) | `rounded-lg` | Consistent |
| Button (medium/large) | `rounded-xl` | More prominent |
| Card | `rounded-xl` | Default |
| Modal/Sheet | `rounded-2xl` | Elevated |
| Avatar/Icon Button | `rounded-full` | Circular |
| Badge/Tag | `rounded-full` | Pill shape |
| Input | `rounded-base` | Subtle |

---

## 5. Shadow System

### Elevation Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.3)` | Subtle depth |
| `shadow-base` | `0 2px 4px -1px rgba(0, 0, 0, 0.3)` | Default cards |
| `shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)` | Elevated cards |
| `shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)` | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)` | High elevation |
| `shadow-2xl` | `0 25px 50px -12px rgba(0, 0, 0, 0.4)` | Maximum elevation |

### Glow Effects

| Token | Value | Usage |
|-------|-------|-------|
| `glow-primary` | `0 0 20px rgba(0, 191, 255, 0.4)` | Primary actions |
| `glow-secondary` | `0 0 20px rgba(147, 51, 234, 0.4)` | Secondary actions |
| `glow-focus` | `0 0 0 4px rgba(0, 191, 255, 0.6)` | Focus states |

---

## 6. Animation System

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Quick interactions |
| `duration-base` | 300ms | Default transitions |
| `duration-slow` | 500ms | Page transitions |
| `duration-slower` | 700ms | Complex animations |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Elements moving |
| `ease-spring` | Spring animation | Interactive elements |

### Named Animations

| Token | Effect | Usage |
|-------|--------|-------|
| `fade-in` | Opacity 0 → 1 | Content entering |
| `slide-up` | Translate Y + fade | Sheets, modals |
| `scale-in` | Scale 0.95 → 1 | Buttons, cards |
| `pulse-slow` | Breathing effect | Live indicators |
| `spin` | 360° rotation | Loaders |

---

## 7. Breakpoint System

### Device Breakpoints

| Token | Value | Target Device |
|-------|-------|---------------|
| `xs` | 375px | Small mobile |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large desktop |
| `3xl` | 1920px | TV / Ultra-wide |
| `4k` | 2560px | 4K TV |

### Semantic Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `mobile` | 0-767px | Mobile-first styles |
| `tablet` | 768px+ | Tablet+ styles |
| `desktop` | 1024px+ | Desktop+ styles |
| `tv` | 1920px+ | TV-specific styles |

### Split-Screen Mode

At **768px+**, the app enters split-screen mode where Radio and News are displayed side-by-side in a 16:9 layout.

---

## 8. Component Library

### Button Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `primary` | Solid cyan, glassmorphic | Primary actions |
| `secondary` | Outlined, glassmorphic | Secondary actions |
| `ghost` | Transparent | Tertiary actions |
| `danger` | Red accent | Destructive actions |

### Button Sizes

| Size | Height | Padding | Text Size |
|------|--------|---------|-----------|
| `sm` | 2rem | 0.75rem x 1rem | `text-sm` |
| `md` | 2.5rem | 1rem x 1.5rem | `text-base` |
| `lg` | 3rem | 1.25rem x 2rem | `text-lg` |
| `xl` | 4rem | 1.5rem x 2.5rem | `text-xl` |

### Card Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `glass` | Glassmorphic, blur | Default cards |
| `elevated` | Glass + shadow | Prominent cards |
| `flat` | Minimal, no blur | Subtle containers |

---

## 9. Accessibility

### Focus States

- All interactive elements have visible focus states
- Focus ring: `0 0 0 4px rgba(0, 191, 255, 0.6)`
- TV focus: Larger ring + scale transform

### Keyboard Navigation

- Tab order follows visual layout
- Arrow keys for TV navigation
- Enter/Space for activation
- Escape to close modals

### Screen Readers

- Semantic HTML elements
- ARIA labels for icon buttons
- Live regions for dynamic content
- Skip links for navigation

### Touch Targets

| Device | Minimum Size | Notes |
|--------|--------------|-------|
| Mobile | 44x44px | iOS/Android standard |
| Tablet | 48x48px | Comfortable touch |
| Desktop | 32x32px | Mouse precision |
| TV | 80x80px | Remote control |

---

## 10. Glassmorphism Style

### Base Glass Effect

```css
background: rgba(31, 31, 31, 0.7);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Intensity Levels

| Level | Background | Blur | Border | Usage |
|-------|------------|------|--------|-------|
| `subtle` | `rgba(255,255,255, 0.05)` | 5px | `rgba(255,255,255, 0.05)` | Backgrounds |
| `base` | `rgba(255,255,255, 0.10)` | 10px | `rgba(255,255,255, 0.10)` | Cards |
| `strong` | `rgba(255,255,255, 0.15)` | 15px | `rgba(255,255,255, 0.20)` | Modals |
| `intense` | `rgba(255,255,255, 0.20)` | 20px | `rgba(255,255,255, 0.30)` | Active states |

---

## 11. Grid & Layout

### Container Widths

| Breakpoint | Max Width | Notes |
|------------|-----------|-------|
| Mobile | 480px | Centered |
| Tablet+ | 100% | Full width for split-screen |

### Grid System

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile | 1 | 1rem |
| Tablet | 2 | 1.5rem |
| Desktop | 3 | 1.5rem |
| TV | 3 | 2rem |

---

## 12. Usage Guidelines

### Do's ✅

- Use CSS variables for all typography sizes
- Use semantic components (Heading, Body, Button)
- Maintain consistent spacing multiples (4px base)
- Test on all device sizes (mobile, tablet, desktop, TV)
- Ensure focus states are visible
- Use glassmorphic effects consistently

### Don'ts ❌

- Don't hardcode text sizes with Tailwind classes
- Don't mix different button styles in same context
- Don't use arbitrary values without design system reference
- Don't skip responsive variants
- Don't forget accessibility attributes
- Don't create one-off component styles

---

## 13. File Structure

```
src/
├── components/
│   ├── ui/              # Base UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Heading.jsx
│   │   ├── Body.jsx
│   │   ├── Caption.jsx
│   │   └── ResponsiveContainer.jsx
│   ├── RadioPlayer.jsx
│   ├── NewsList.jsx
│   ├── NewsArticle.jsx
│   ├── BottomNav.jsx
│   └── Loader.jsx
├── styles/
│   ├── globals.css      # Global styles, CSS variables
│   └── tokens.js        # Design tokens as JS
└── hooks/
    ├── useDeviceDetection.js
    └── useArticleMedia.js
```

---

## Version

- **Version**: 1.0.0
- **Last Updated**: 2025-11-08
- **Author**: Claude Code
