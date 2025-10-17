# AlmanaqueLuso Design Guidelines

## Design Approach: Cultural Reference-Based

**Primary Inspiration**: Portuguese azulejo tiles + Apple Calendar + Astronomy.com
**Rationale**: This platform blends Portuguese cultural identity with functional calendar utility. The design draws from traditional Portuguese ceramic patterns for visual warmth while maintaining the clean, scannable interface of modern calendar applications.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 215 75% 45% (Deep Portuguese blue - evokes ocean and azulejos)
- Secondary: 205 85% 55% (Bright sky blue for astronomy elements)
- Accent: 35 85% 50% (Warm terracotta - subtle Portuguese tile reference)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text: 215 20% 15%

**Dark Mode:**
- Primary: 215 70% 60%
- Secondary: 205 75% 65%
- Accent: 35 75% 60%
- Background: 220 15% 8%
- Surface: 220 12% 12%
- Text: 210 10% 95%

**Semantic Colors:**
- Success: 145 65% 45%
- Warning: 40 85% 55%
- Error: 355 75% 50%
- Info: 205 85% 55%

### B. Typography

**Font Stack:**
- Headers: 'Inter', system-ui (weights: 600, 700, 800)
- Body: 'Inter', system-ui (weights: 400, 500, 600)
- Accent/Cultural: 'Playfair Display' for Portuguese event titles (weights: 500, 700)

**Scale:**
- Hero: text-6xl (3.75rem) / text-5xl mobile
- Section Headers: text-4xl / text-3xl mobile
- Event Titles: text-2xl / text-xl mobile
- Body: text-base (1rem)
- Small: text-sm (0.875rem)
- Micro: text-xs (0.75rem)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Card gaps: gap-4, gap-6, gap-8
- Container max-width: max-w-7xl

**Grid System:**
- Event cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Calendar views: Full-width responsive with gap-4
- Dashboard widgets: grid-cols-1 lg:grid-cols-3

### D. Component Library

**Navigation:**
- Top nav: Sticky with backdrop-blur-lg, logo left, auth/profile right
- Mobile: Slide-out drawer with event type filters
- Secondary nav: Horizontal scrollable pill tabs for event categories

**Event Cards:**
- Elevated cards (shadow-md) with hover:shadow-lg transition
- Event type badge (top-left): Colored pill matching event category
- Date/time: Large, bold typography with moon phase icon for astronomy
- Location pin icon with truncated text
- Portuguese flag micro-icon for PT-specific events

**Calendar Components:**
- Month view: Subtle grid with rounded corners, hover states on dates
- Event dots: Colored indicators stacked max 3, "+N more" tooltip
- Day cells: p-2, highlight today with primary color ring
- Lunar phase indicator: Small icon in calendar header

**Forms & Inputs:**
- Input fields: rounded-lg border-2, focus:ring-2 primary color
- Time picker: Custom Portuguese timezone-aware selector
- Event type dropdown: Icon + label with hover:bg-surface
- Toggle switches: Smooth animated with primary color when active

**Data Displays:**
- Tide chart: Gradient area chart (blue to transparent)
- Moon phase: Large circular visual with percentage text
- Match scores: Bold numbers with team crests/flags
- Astronomy events: Timeline with celestial illustrations

**Overlays:**
- Modals: backdrop-blur-md with centered card max-w-2xl
- Event detail drawer: Slide from right, full-height
- Notification toasts: Top-right, auto-dismiss, icon + message

### E. Visual Elements

**Decorative Patterns:**
- Subtle azulejo-inspired corner decorations on hero (SVG)
- Gradient overlays on event category banners
- Dotted constellation patterns in astronomy sections (subtle, opacity-10)

**Iconography:**
- Heroicons for UI elements
- Custom celestial icons for astronomy (moon phases, eclipses)
- Flag/crest icons for sports events
- Weather/tide icons for maritime data

**Animations:**
- Card hover: transform scale-105 + shadow increase (200ms ease)
- Page transitions: Fade (150ms)
- Loading states: Subtle pulse on skeleton screens
- NO scroll animations or parallax effects

### F. Images

**Hero Section:**
- Large hero image: Portuguese coastal landscape at golden hour (Algarve cliffs or Lisbon sunset)
- Gradient overlay: linear-gradient(to-br, primary/60, secondary/40)
- Hero text: White with backdrop-blur buttons

**Event Categories:**
- Astronomy: Night sky with stars (header background)
- Sports: Stadium atmosphere (Liga Portugal context)
- Cultural: Portuguese architecture or festival scenes
- Tides: Ocean waves and marina imagery

**Placement Strategy:**
- Hero: Full-width, h-96 lg:h-[500px]
- Category headers: Aspect-ratio 3:1, rounded-lg
- Event cards: Optional thumbnail, aspect-ratio 16:9
- Background accents: Subtle pattern overlays at 5% opacity

## Page-Specific Guidelines

**Landing Page:**
- Hero with coastal image + app value proposition
- Event type showcase: 3-column grid with icons + descriptions
- Featured upcoming events: Horizontal scroll cards
- Portuguese cultural highlights: Image grid with location tags
- CTA section: Gradient background with subscription form

**Dashboard:**
- Top: Today's overview with lunar phase widget
- Main: Calendar month view
- Sidebar: Upcoming events list + tide chart widget
- Quick filters: Pill navigation for event types

**Event Detail:**
- Full-width image header (if available)
- Event metadata cards: Date, location, type, source
- Description with rich text
- Related events carousel
- "Add to Calendar" + "Set Reminder" CTAs