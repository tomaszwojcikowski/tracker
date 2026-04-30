# Design System — Brutalist Foundation

> Status: **Phase 1 (foundation)** — token contract & utilities locked.
> Source of truth: [`colors.css`](../colors.css), [`src/main.css`](../src/main.css).

The Tracker UI follows a **plain‑brutalist** language: hairline rules instead
of soft drop shadows, tight square‑leaning radii, tabular numerals everywhere
numbers appear, mono accents for hero stats, and warm neutral surfaces in the
light theme. The reference mockup is
[`mockups/option-a-brutalist.html`](../mockups/option-a-brutalist.html).

---

## Core principles

1. **Hairline over halo.** Elevation is communicated with a 1px outline, not
   a blurred shadow. There are no `backdrop-filter: blur()` rules in the
   shipping styles.
2. **Tabular numerals always.** Weights, reps, timers, dates, and percentages
   are rendered with `font-variant-numeric: tabular-nums` so columns of
   numbers line up vertically. Applied at the `body` level.
3. **Mono for stats.** Hero numerics (timer, current weight, big counters)
   use `JetBrains Mono` via `.text-mono-stat`.
4. **Tight radii.** The full radius scale tops out at `10px`. Pills use
   `--radius-full`; everything else is `2–10px`.
5. **Warm paper for light theme.** The light theme uses cream/oat surfaces
   with near‑black ink, never pure white.
6. **Section colour is an accent, not a fill.** Warm‑up / Skill / Main /
   Accessory / Cool‑down hues are used as 3px accent rails or small chips —
   never as full card backgrounds.
7. **Motion is mechanical.** Transitions move 1–2 properties (opacity,
   border‑color, transform) over 150–250ms with a `cubic-bezier` ease‑out.
   No bouncing, no parallax, no auto‑playing decoration.

---

## Token contract

| Token | Use | Brutalist value |
|---|---|---|
| `--elevation-0` | Resting flat | `none` |
| `--elevation-1` | Cards, inputs | `inset 0 0 0 1px var(--color-outline-variant)` |
| `--elevation-2` | Sticky header, raised | `inset 0 0 0 1px var(--color-outline)` |
| `--elevation-3` | Dialog, sheet | `inset 0 0 0 1px var(--color-outline)` |
| `--elevation-4` | Hover/focus emphasis | `inset 0 0 0 1px var(--color-on-surface-variant)` |
| `--elevation-5` | Active/pressed emphasis | `inset 0 0 0 1px var(--color-on-surface)` |
| `--shadow-primary` | Primary highlight ring | `inset 0 0 0 1px var(--color-primary)` |
| `--shadow-success` | Completed state ring | `inset 0 0 0 1px var(--color-success)` |
| `--radius-xs..3xl` | Corners | `2 / 3 / 4 / 6 / 6 / 8 / 10` px |
| `--radius-full` | Pills, dots | `9999px` |

These tokens are flattened **after every theme block** in `colors.css` so the
override wins regardless of the active theme. Components that historically
referenced `--elevation-*` or `--shadow-*` automatically inherit the new
hairline visuals — no component edits required.

---

## Typography

The MD3 type scale is preserved (`text-display-*`, `text-headline-*`,
`text-title-*`, `text-body-*`, `text-label-*`) for backward compatibility,
but the brutalist additions below should be preferred for new work:

| Class | Use |
|---|---|
| `.text-mono-stat` | Hero numerics (timer, weight, counters). Mono, tabular, slightly tight tracking. |
| `.tabular-nums` | Inline numerals inside otherwise sans‑serif text. |
| `.eyebrow` | Section labels above titles. Uppercase, 0.18em tracking, 11px. |

Inter character variants (`cv11`, `ss01`) are enabled globally for cleaner
single‑story `a` and straight‑sided `1`/`I`.

---

## Surfaces

| Class | Use |
|---|---|
| `.glass-topbar` | Sticky header. Flat surface + hairline divider. |
| `.glass-panel` | Bottom action panel. Flat surface + hairline top border. |
| `.glass-card` | Generic card. Hairline border, flat fill. |
| `.card`, `.card-filled`, `.card-outlined`, `.card-elevated` | MD3 card variants, all using brutalist elevation tokens. |

Despite the legacy `glass-` prefix, **none of these surfaces apply
`backdrop-filter`** — the names are kept for stable selectors only.

---

## Focus & accessibility

- All `button`, `a`, and `input` elements have a global `:focus-visible`
  outline (see `src/main.css` ~line 2783).
- Hit targets target ≥44×44 CSS px (`--m-touch: 48px`).
- Contrast: text ≥4.5:1, large text ≥3:1 in every theme.
- `prefers-reduced-motion` and `prefers-reduced-transparency` are honored
  (transparency is already a no‑op since we removed blurs).

---

## What changed in Phase 1

- ✅ Unified `--elevation-*` and `--shadow-*` tokens to brutalist hairlines
  across **all** themes (classic, modern, ocean, sunset, oled, light).
- ✅ Stripped `backdrop-filter: blur(...)` from `.glass-panel`,
  `.glass-topbar`, `.glass-card`, and the OLED override.
- ✅ Tabular numerals enabled globally on `body`.
- ✅ Added `.text-mono-stat`, `.tabular-nums`, `.eyebrow` utilities.
- ✅ Documented the contract (this file).

No component code was modified — these are pure foundation changes.

---

## Coming in later phases

- **Phase 2** — Workout player redesign (collapsed cards, segmented set bar,
  inline weight stepper, single chip row for flags).
- **Phase 3** — Navigation shell (floating bottom tab pill, contextual top‑bar
  subtitle, nav‑rail desktop layout).
- **Phase 4** — Focus & timer modes (single‑exercise hero, ring timer).
- **Phase 5** — History & dashboard (heatmap calendar, editorial PR cards).
- **Phase 6** — Motion & feedback (skeletons, unified haptic palette).
- **Phase 7** — Accessibility & polish.
- **Phase 8** — Theming (light parity, accent picker).
