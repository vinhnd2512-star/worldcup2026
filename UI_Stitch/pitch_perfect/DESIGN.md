---
name: Pitch Perfect
colors:
  surface: '#0b1229'
  surface-dim: '#0b1229'
  surface-bright: '#323851'
  surface-container-lowest: '#060d24'
  surface-container-low: '#141a32'
  surface-container: '#181e36'
  surface-container-high: '#222941'
  surface-container-highest: '#2d344c'
  on-surface: '#dce1ff'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#dce1ff'
  inverse-on-surface: '#292f48'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#ffb4a8'
  on-secondary: '#690000'
  secondary-container: '#920703'
  on-secondary-container: '#ff9a8a'
  tertiary: '#dbffe3'
  on-tertiary: '#00391f'
  tertiary-container: '#84efaf'
  on-tertiary-container: '#006d41'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#920703'
  tertiary-fixed: '#8df8b7'
  tertiary-fixed-dim: '#70db9d'
  on-tertiary-fixed: '#002110'
  on-tertiary-fixed-variant: '#00522f'
  background: '#0b1229'
  on-background: '#dce1ff'
  surface-variant: '#2d344c'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  score-display:
    fontFamily: Anybody
    fontSize: 36px
    fontWeight: '900'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for the high-stakes, high-energy environment of international football. It targets a global audience of passionate fans, emphasizing the thrill of the match and the precision of the prediction. The emotional response is one of **anticipation, dynamism, and competitive prestige**.

The visual direction is a fusion of **Corporate Modern** and **Glassmorphism**. It utilizes structured layouts to handle complex data (scores, odds, leaderboards) while layering translucent "glass" surfaces over evocative stadium imagery to create depth and a premium "live broadcast" feel. The aesthetic is "Elite Sport"—clean, fast, and authoritative.

## Colors

The palette draws directly from the prestige of the World Cup trophy and the intensity of the pitch.

- **Primary (Trophy Gold):** Used exclusively for high-value actions, winning states, and first-place leaderboard rankings.
- **Secondary (Stadium Red):** Applied to live match indicators, urgent alerts, and decorative accents that evoke passion.
- **Tertiary (Pitch Emerald):** Used for "success" states, confirmed predictions, and positive trend lines in charts.
- **Neutral (Midnight Navy):** The core background color, providing a deep, high-contrast canvas that allows the gold and emerald to pop.
- **Surface:** A semi-transparent white (10-15% opacity) is used for glassmorphic cards to maintain legibility against dark backgrounds.

## Typography

This design system uses a triple-font strategy to balance impact with utility.

- **Anybody** is the voice of the brand: wide, aggressive, and variable. It is used for scores, headlines, and big moments.
- **Hanken Grotesk** handles the heavy lifting of UI text, providing a sharp, contemporary feel that remains legible in dense data tables.
- **JetBrains Mono** is reserved for technical data—match minutes, odds, and historical statistics—lending a precise, analytical character to the prediction experience.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for rapid data scanning.

- **Desktop:** 12-column grid with a maximum content width of 1280px. Sidebars are used for global navigation and social feeds, centering the match data.
- **Mobile:** Single column with high-density stacking. Match fixtures use a horizontal scroll (carousel) to preserve vertical space for leaderboards.
- **Rhythm:** A strict 8px baseline grid ensures vertical alignment. Use "sm" (12px) for internal card padding and "md" (24px) for section breathing room.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than traditional shadows.

1.  **Background Level:** Deep Midnight Navy, optionally overlaid with a low-opacity (5%) blurred stadium photograph.
2.  **Surface Level:** Semi-transparent containers (`rgba(255, 255, 255, 0.05)`) with a `backdrop-filter: blur(12px)`.
3.  **Accent Level:** High-contrast borders (1px solid Gold or Emerald at 30% opacity) define the edges of active cards.
4.  **Floating Level:** Interactive elements (buttons, inputs) use a slight inner glow to appear "etched" into the glass surface.

## Shapes

The shape language is **Rounded**, balancing the aggressive typography with a modern, accessible interface.

- **Standard Elements:** Match cards and input fields use a 0.5rem radius.
- **Interactive Prompts:** Buttons and "Predict" CTA's use a 1rem (rounded-lg) radius to distinguish them from static content.
- **Indicators:** Live status dots and group-stage badges are fully circular (pill-shaped).

## Components

### Match Fixture Cards
The core component. Features a glassmorphic background with a 1px subtle border. Team flags are circular. The "Score" is centered using **Anybody** at `score-display` size. When a match is live, the border pulses in `secondary_color` (Red).

### Leaderboards
Tables use alternating row fills of Midnight Navy and a slightly lighter navy. The "Top 3" users receive Gold, Silver, and Bronze badges. Use `label-caps` for table headers to ensure a clean, analytical look.

### Interactive Prediction Inputs
Steppers for score entry should be large and tactile. Use high-contrast background colors for the "-" and "+" buttons. Once a prediction is locked, the input container transforms into a solid `tertiary_color` (Emerald) outline.

### Progress Charts
Use a vector-based line chart for user rank history. The line should use a Gold gradient. Data points on hover show a glassmorphic tooltip with `jetbrainsMono` text for precise coordinates.

### Progress Bars
Used for "Prediction Consensus" (e.g., 60% predict a Win). Use a dual-tone bar: Emerald for the favorite, Neutral-light for the underdog, separated by a sharp diagonal cut.