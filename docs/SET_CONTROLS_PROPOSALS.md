# Set Controls Design Proposals

## Problem Statement
The current set control implementation shows all set buttons as clickable from the start, which can lead to:
- Users accidentally clicking/skipping sets out of order
- Unclear indication of which set should be done next
- No clear visual feedback about progress through the sets

## Current Behavior
![Current Implementation](https://github.com/user-attachments/assets/aaedf60b-5058-4c97-add1-86b45bd28443)

All three set buttons (1, 2, 3) are shown and clickable immediately. Users can complete sets in any order.

## Proposed Solutions

### Visual Comparison
![Both Proposals](https://github.com/user-attachments/assets/8ba1e893-ee27-400b-8589-0604011dc78d)

---

## Proposal 1: Progressive Reveal ⭐ RECOMMENDED

### Concept
Show only the next incomplete set as a full button. Future sets are represented by minimal dot indicators.

### Visual States
- **No sets completed**: `[1] • •  (1/3)`
- **1 set completed**: `[✓] [2] •  (2/3)`
- **2 sets completed**: `[✓] [✓] [3]  (3/3)`
- **All complete**: `[✓] [✓] [✓]  ✓ Complete`

### Key Features
1. **Progressive disclosure** - Only show what's needed now
2. **Clear progress** - Text indicator shows current position
3. **No mistakes** - Impossible to skip sets accidentally
4. **Clean UI** - Minimal visual clutter, especially with many sets
5. **Clear focus** - User knows exactly which set to do next

### Pros
✅ Cleanest UI, minimal clutter  
✅ Impossible to skip sets accidentally  
✅ Clear visual hierarchy  
✅ Works great with many sets (5+)  
✅ Reduces cognitive load  
✅ Modern, progressive disclosure pattern  

### Cons
❌ Can't see exact number of remaining sets (need to count dots)  
❌ More radical change from current design  
❌ May feel restrictive to power users  

---

## Proposal 2: Ghost Buttons

### Concept
Show all set buttons, but future sets are dimmed/disabled until previous ones are completed.

### Visual States
- **No sets completed**: `[1] [2̶] [3̶]  (0/3)`
- **1 set completed**: `[✓] [2] [3̶]  (1/3)`
- **2 sets completed**: `[✓] [✓] [3]  (2/3)`
- **All complete**: `[✓] [✓] [✓]  ✓ Complete`

### Key Features
1. **Familiar layout** - Similar to current design
2. **Visual preview** - See total number of sets at all times
3. **Progressive enablement** - Sets unlock as you complete previous ones
4. **Clear indication** - Visual distinction between available, completed, and locked states

### Pros
✅ Less radical change from current design  
✅ Users can see total set count at a glance  
✅ Maintains spatial consistency (buttons don't shift)  
✅ Still prevents accidental set skipping  
✅ Familiar interaction pattern  

### Cons
❌ More visual clutter with many sets (5+)  
❌ Takes up more horizontal space  
❌ Disabled buttons might be confusing at first  
❌ Not as clean/minimal as Proposal 1  

---

## Recommendation

**Proposal 1 (Progressive Reveal)** is recommended because:

1. **Better UX for focused workouts** - Users doing exercises don't need to see all future sets; they need to focus on the next one
2. **Scales better** - Works well with exercises that have 5+ sets without cluttering the UI
3. **Modern pattern** - Progressive disclosure is a well-established UX pattern
4. **Less cognitive load** - Simpler visual presentation helps users focus on the task at hand
5. **Cleaner aesthetics** - Maintains the app's modern, minimal design language

The main concern (can't see exact remaining count) is mitigated by:
- The progress text indicator `(2/3)` shows exactly where you are
- The dots give a visual sense of remaining work
- Users focus on "next set" rather than "total remaining"

## Implementation Details

Both proposals will be implemented in:
- `src/components/CompactExerciseRow.tsx` - Compact list view
- `src/components/ExerciseCard.tsx` - Card view

Changes include:
- Modify set button rendering logic based on completion state
- Add progress text display (X/Y format)
- Update button states and styling
- Add accessibility labels
- Update related tests

## Decision Required

Please choose which proposal to implement, or suggest modifications to either approach.
