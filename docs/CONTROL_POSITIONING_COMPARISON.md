# Control Positioning Comparison - Visual Guide

This document provides detailed visual comparisons of control positioning across different views and screen sizes.

---

## 1. Top App Bar Anatomy

### Current Implementation

```
┌─────────────────────────────────────────────────────────────┐
│ [<] Title                                    [Timer] [•••]   │ 56px height
│     Subtitle (optional)                                      │
├─────────────────────────────────────────────────────────────┤
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 45% progress   │ 2px height
└─────────────────────────────────────────────────────────────┘
```

### Comparison Across Views

| View | Back | Title | Subtitle | Actions | Progress |
|------|------|-------|----------|---------|----------|
| Dashboard | ❌ | "Week X" | - | ❌ | ❌ |
| Workout | ✅ | "Day X" | - | Timer | ✅ |
| History | ❌ | "History" | - | ❌ | ❌ |
| Library | ❌ | "Exercise Library" | - | ❌ | ❌ |
| Settings | ❌ | "Settings" | - | ❌ | ❌ |

### Recommended Improvements

```
┌─────────────────────────────────────────────────────────────┐
│ [<] Title                            [🔍] [Timer] [•••]     │ 56px height
│     Subtitle / SearchBar / FilterChips                       │
├─────────────────────────────────────────────────────────────┤
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 60% progress   │ 4px height
└─────────────────────────────────────────────────────────────┘
```

Add search icon, increase progress bar thickness, utilize subtitle space.

---

## 2. Bottom Navigation Bar Comparison

### Mobile (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [🏋️ ]  [📚]   [📊]   [⚙️ ]                                 │ 80px height
│  Train  Lib    Hist   Settings                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Active Indicator**: Animated pill background (sys-secondaryContainer)

### Desktop (Current)

```
┌──────┐
│ [💪] │ Logo/Brand 56px
├──────┤
│      │
│ [🏋️]│ Train
│      │
│ [📚]│ Library
│      │
│ [📊]│ History  80px width
│      │
│ [⚙️ ]│ Settings
│      │
└──────┘
```

**Active Indicator**: Static rounded background

### Issue: Inconsistent Active States

Mobile has smooth animated pill, desktop has static background.

### Recommendation: Align Desktop with Mobile

```tsx
// Desktop navigation - add animated pill
{isActive && (
    <motion.div
        layoutId="nav-pill-desktop"
        className="absolute inset-0 bg-sys-secondaryContainer rounded-2xl"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
)}
```

---

## 3. Exercise Card Control Positioning

### Card View (Current)

```
┌─────────────────────────────────────────────────────────────┐
│ Exercise Name                                    [⌄]         │
│ 3x8 reps • 60s rest                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Weight: [____________] kg                                    │
│                                                               │
│ [[✓]] [2] •  (2/3)                    [Rest 60s]            │ Set controls
│                                                               │
│ RPE: [6] [7] [8] [9] [10]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Issues**:
- RPE selector too large for importance
- Weight input not aligned with set buttons
- Prescription text (3x8 reps) low contrast

### Compact List View (Current)

```
┌─────────────────────────────────────────────────────────────┐
│ Exercise Name                    [[✓]] [2] •  (2/3)  [⌄]   │
│ 3x8 reps                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Good**: Efficient use of space, clear hierarchy

### Focus View (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                      Exercise Name                            │
│                      3x8 reps • 60s rest                      │
│                                                               │
│         Weight: [____________] kg                             │
│                                                               │
│              [[✓]] [[✓]] [3] • •  (3/5)                     │
│                                                               │
│              RPE: [6] [7] [8] [9] [10]                       │
│                                                               │
│                     [Rest 60s]                                │
│                                                               │
│              ← Previous    Next →                             │
└─────────────────────────────────────────────────────────────┘
```

**Good**: Clear focus, centered layout, large touch targets

---

## 4. Set Control Comparison (Progressive Reveal)

### State Progression

#### No Sets Completed
```
[1] • •  (0/3)
```
- Shows: First set button, 2 dots for future sets, progress counter
- Can tap: Set 1 button

#### 1 Set Completed
```
[[✓]] [2] •  (1/3)
```
- Shows: Last completed set (sliding left), current set, 1 dot, progress
- Can tap: Set 2 button (Set 1 to undo)

#### 2 Sets Completed
```
[[✓]] [3]  (2/3)
```
- Shows: Last completed set, current set, progress
- Can tap: Set 3 button (Set 2 to undo)

#### All Complete
```
[[✓]]  ✓ Complete
```
- Shows: Last completed set with success color, completion message
- Can tap: Last set to undo

### Alternative: Ghost Buttons (Not Implemented)

#### No Sets Completed
```
[1] [2̶] [3̶]  (0/3)
```

#### 1 Set Completed
```
[✓] [2] [3̶]  (1/3)
```

#### All Complete
```
[✓] [✓] [✓]  ✓ Complete
```

**Decision**: Progressive reveal chosen for cleaner UI and fewer mistakes.

---

## 5. Timer Control Positioning

### Floating Timer Button (Bottom Right)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                      [⏱️]     │ 56px FAB
│                                                               │
│  [🏋️]  [📚]   [📊]   [⚙️ ]                                 │ 80px nav
└─────────────────────────────────────────────────────────────┘
```

**Position**: bottom-24 (96px from bottom), right-4 (16px from right)  
**States**:
- Inactive: 56×56px circle, timer icon
- Active: 80×56px pill, timer icon + countdown
- Urgent: Red background, pulsing animation

### Workout Action Bar (Contextual)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                      Workout content                          │
│                                                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [−] Rest Timer: 0:45 [+]              [⛶ Fullscreen]       │ 64px
│                                                               │
│  [🏋️]  [📚]   [📊]   [⚙️ ]                                 │ 80px
└─────────────────────────────────────────────────────────────┘
```

**Shows when**: Rest timer or EMOM timer active  
**Position**: Above navigation bar  
**Actions**: Adjust time, go fullscreen, stop timer

---

## 6. Modal & Bottom Sheet Positioning

### Bottom Sheet (Recommended Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                       Main View                               │
│                                                               │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Scrim (60% black, blur) ▓▓▓▓▓▓│
├═════════════════════════════════════════════════════════════┤ 28dp radius
│                          ━━━                                  │ Drag handle
│                                                               │
│                    Bottom Sheet Title                         │
│                                                               │
│                       Content here                            │
│                                                               │
│                     [Primary Action]                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Usage**:
- Exercise options
- Quick timer
- History preview
- Exercise selector

### Full Modal (For Complex Content)

```
┌═════════════════════════════════════════════════════════════┐
│ [X] Modal Title                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                                                               │
│                      Full Modal Content                       │
│                                                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                     [Cancel]  [Confirm]                       │
└─────────────────────────────────────────────────────────────┘
```

**Usage**:
- Exercise detail (with tabs for info, history, stats)
- Settings sub-pages
- Workout summary

---

## 7. Action Button Hierarchy

### Dashboard Day Card

```
┌─────────────────────────────────────────────────────────────┐
│                         DAY 1                                 │
│                       Upper Body                              │
│                                                               │
│  Pull-Ups, Press, Rows                                       │
│                                                               │
│                    [▶ Start Workout]                         │ Primary
└─────────────────────────────────────────────────────────────┘
```

**Primary Action**: Start Workout (gradient button)  
**Secondary Actions**: None visible (swipe for more info)

### Workout Player Exercise Card

```
┌─────────────────────────────────────────────────────────────┐
│ Exercise Name                      [History] [Options] [⌄]  │ Tertiary
│ 3x8 reps                                                     │
├─────────────────────────────────────────────────────────────┤
│ Weight: [__________] kg                                      │
│                                                               │
│ [[✓]] [2] •  (2/3)              [Rest 60s]                  │ Primary/Secondary
└─────────────────────────────────────────────────────────────┘
```

**Primary Action**: Set buttons (complete sets)  
**Secondary Action**: Rest timer  
**Tertiary Actions**: History, Options, Collapse (icon buttons)

### Hierarchy Rules

1. **Primary**: Filled gradient button (btn-gradient-primary)
2. **Secondary**: Tonal button (btn-tonal) or filled accent
3. **Tertiary**: Icon buttons or text buttons
4. **Destructive**: Outlined red or text red

---

## 8. Touch Target Size Comparison

### Current Implementation

| Element | Current Size | WCAG 2.5.5 | Status |
|---------|--------------|------------|--------|
| Set Buttons | 32×32px | 48×48px min | ❌ Fail |
| Icon Buttons | 40×40px | 48×48px min | ❌ Fail |
| Chevrons | 40×40px | 48×48px min | ❌ Fail |
| Nav Items | 80px height | 48px min | ✅ Pass |
| Primary Buttons | 56px height | 48px min | ✅ Pass |
| FAB | 56×56px | 48×48px min | ✅ Pass |

### Visual Comparison

```
Current Icon Button (40×40px):
┌────────────┐
│            │
│    [⚙️ ]   │ 40px
│            │
└────────────┘
   40px

Compliant Icon Button (48×48px):
┌────────────────┐
│                │
│      [⚙️ ]     │ 48px
│                │
└────────────────┘
     48px
```

### Recommended Fixes

```css
/* Minimum touch target utility */
.touch-target-min {
    min-width: 48px;
    min-height: 48px;
}

/* Update existing classes */
.btn-icon {
    @apply touch-target-min;
    /* Change from h-10 w-10 to h-12 w-12 */
}

.set-button {
    @apply touch-target-min;
    /* Change from h-8 w-8 to h-12 w-12 */
}
```

---

## 9. Spacing & Padding Standards

### Container Padding

```
Mobile:
┌────┐
│ ↔  │ 20px (px-5)
└────┘

Tablet/Desktop:
┌──────┐
│  ↔   │ 24px (px-6)
└──────┘
```

### Vertical Spacing

```
Between Sections:
│
│ 24px gap (gap-6)
│
├─────────────────
│
│ 16px gap (gap-4)
│
├─────────────────
│
│ 8px gap (gap-2)
│
```

**Usage**:
- 24px: Between major sections (Warmup → Skill → Main Work)
- 16px: Between exercises within a section
- 8px: Between elements within a card (title → prescription)

### Component Internal Spacing

```
Card Padding:
┌─────────────────────────┐
│ ↕ 20px (p-5)            │
│  ↔ 20px                 │
│      Content            │
│                         │
└─────────────────────────┘

List Item Padding:
┌─────────────────────────┐
│ ↕ 12px (py-3)           │
│  ↔ 20px (px-5)          │
│      List Item          │
└─────────────────────────┘
```

---

## 10. Responsive Breakpoints

### Mobile (< 800px)

```
┌───────────────────────┐
│    Top App Bar        │ 56px
├───────────────────────┤
│                       │
│    Full Width         │
│    Content            │
│    px-5               │
│                       │
│                       │
│                       │
│                       │
├───────────────────────┤
│   Bottom Nav Bar      │ 80px
└───────────────────────┘
```

### Desktop (≥ 800px)

```
┌─────┬─────────────────────────────┐
│     │    Top App Bar              │ 56px
│ Nav ├─────────────────────────────┤
│ Rail│                             │
│ 80px│    Content with Side        │
│     │    Margin (ml-20)           │
│     │    px-6                     │
│     │                             │
│     │                             │
│     │                             │
└─────┴─────────────────────────────┘
```

**Key Difference**: Navigation moves from bottom to left rail

---

## 11. Animation & Transition Comparison

### Navigation Active Indicator

**Mobile**: Shared layout animation with framer-motion
```tsx
<motion.div
    layoutId="nav-pill"
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
/>
```

**Desktop**: Static background (no animation) ⚠️
```tsx
<div className="bg-sys-secondaryContainer" />
```

**Issue**: Inconsistent experience  
**Fix**: Add same framer-motion animation to desktop

### Set Button Completion

**Current**:
```tsx
transition-all active:scale-90
```

**Recommendation**: Add celebration effect
```tsx
// On completion
<motion.div
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
/>

// Add confetti effect for workout completion
<Confetti active={allSetsComplete} />
```

### Modal/Bottom Sheet Entry

**Bottom Sheet**: Slide up from bottom
```tsx
initial={{ y: "100%" }}
animate={{ y: 0 }}
exit={{ y: "100%" }}
transition={{ type: "spring", damping: 25, stiffness: 300 }}
```

**Modal**: Fade in with slight scale
```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.2 }}
```

---

## Summary of Key Findings

### Positioning Issues

1. ❌ Desktop navigation lacks animated active indicator
2. ❌ Top App Bar doesn't utilize subtitle/action space effectively
3. ❌ Touch targets below 48px minimum in multiple components
4. ❌ Inconsistent button hierarchy in some views

### Recommended Fixes

1. ✅ Align desktop nav animation with mobile
2. ✅ Add search/filter to Top App Bar subtitle area
3. ✅ Increase all interactive elements to 48px minimum
4. ✅ Standardize button styles with btn-md3 classes
5. ✅ Implement consistent spacing system
6. ✅ Add animation consistency across views

### Priority

**P0 (Critical)**: Touch target sizes, ARIA labels  
**P1 (Important)**: Desktop nav animation, Top App Bar improvements  
**P2 (Nice-to-have)**: Additional animations, visual polish

---

**Next Steps**: Implement P0 fixes first (touch targets, accessibility), then move to P1 improvements.
