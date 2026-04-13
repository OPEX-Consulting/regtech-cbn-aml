

## Plan: Make Color Scheme Consistent Across the App

### Problem
The `ReportLoadingScreen` component uses **hardcoded hex colors** and **inline `<style>` tags** instead of the Tailwind CSS variable-based design system used by every other component. This creates visual inconsistency and makes theme changes (e.g., dark mode) impossible for that screen.

**Inconsistent colors found in `ReportLoadingScreen.tsx`:**
- `#1D9E75` / `#0F6E56` (greens) -- should use `hsl(var(--primary))` / `hsl(var(--primary-dark))`
- `#0D1F3C` / `#1A3560` (dark navy background) -- hardcoded gradient, no equivalent CSS variable
- `rgba(255,255,255,...)` variants -- should use foreground/muted-foreground variables
- `#ff8080` (error) -- should use `hsl(var(--destructive))`

All other components (`AssessmentForm`, `FormFields`, `GovAndRiskFields`, `NotFound`) correctly use Tailwind utility classes with the CSS variable system.

### Changes

**1. Refactor `src/components/ReportLoadingScreen.tsx`**
- Replace the inline `<style>` block with Tailwind utility classes
- Map all hardcoded colors to the existing design token system:
  - Green accents (`#1D9E75`) → `bg-primary`, `text-primary`, `border-primary`
  - Dark greens (`#0F6E56`) → `bg-primary-dark`
  - Error red (`#ff8080`) → `text-destructive`
  - White text → `text-foreground`, `text-muted-foreground` with opacity
  - Card backgrounds → `bg-card` with opacity or `bg-muted`
- Keep the gradient overlay background but use CSS variables for the colors
- Maintain all animations (spinner, card entrance, fact cycling) using Tailwind's `@keyframes` in `src/index.css`

**2. Add custom keyframes to `src/index.css`**
- Move the `cardIn` animation keyframe into the global CSS or `tailwind.config.ts` so it follows the same pattern as `accordion-down`/`accordion-up`

**3. Add overlay background gradient CSS variable to `src/index.css`**
- Add a `--loading-bg` variable (or similar) for the dark navy-to-green gradient, scoped to both light and dark themes

### What Won't Change
- Component logic, props, and behavior remain identical
- The visual appearance stays the same (same green/navy palette)
- All other components are already consistent -- no changes needed

