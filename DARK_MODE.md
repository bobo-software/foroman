# How Dark Mode is Applied

This document describes how dark mode is implemented and applied across the Foro application.

## Overview

The app uses a **class-based dark mode** strategy with Tailwind CSS, combined with:

1. **Theme state** stored in Zustand (persisted to localStorage)
2. **Tailwind `dark:` variants** for styling most UI
3. **MUI theme** for Material React Table (MRT) components
4. **Selective explicit checks** in some components for theme-specific styling

---

## 1. Theme State (ThemeStore)

**File:** `src/stores/state/ThemeStore.ts`

Theme is managed via Zustand with persistence:

```typescript
type Theme = 'light' | 'dark';

// State: theme, toggleTheme(), setTheme(theme)
// Persisted to localStorage under key 'theme-storage'
```

- Default: `'light'`
- Persisted across page reloads via `zustand/middleware` `persist`
- Components read `theme` and call `toggleTheme()` or `setTheme()` to change it

---

## 2. Applying the `dark` Class to the DOM

For Tailwind’s `darkMode: 'class'` to work, the `dark` class must be on an ancestor of elements using `dark:` variants.

### Primary: `document.documentElement` (AppNavbar)

**File:** `src/components/elements/AppNavbar.tsx`

```tsx
useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return () => {
    document.documentElement.classList.remove('dark');
  };
}, [theme]);
```

- Runs when `AppNavbar` is mounted (admin `/app` pages only)
- Adds/removes `dark` on `<html>` so all descendants can use `dark:` classes
- **Cleanup on unmount** removes `dark` when navigating to landing/auth, so those pages stay light

### Secondary: Layout wrapper (AppLayout)

**File:** `src/layouts/AppLayout.tsx`

```tsx
<div className={`flex min-h-screen bg-slate-100 dark:bg-slate-900 ... ${theme === 'dark' ? 'dark' : ''}`}>
```

- Adds `dark` on the main layout wrapper
- Ensures layout content is scoped to dark mode when appropriate

### Tertiary: AppSidebar

**File:** `src/components/elements/AppSidebar.tsx`

```tsx
<aside className={`... ${theme === 'dark' ? 'dark' : ''}`}>
```

- Sidebar also adds `dark` on its container
- Provides dark-mode context for sidebar descendants

---

## 3. Tailwind Configuration (v4)

**File:** `src/index.css`

Tailwind v4 uses `@custom-variant` for class-based dark mode (the config `darkMode: 'class'` no longer applies):

```css
@custom-variant dark (&&:where(.dark, .dark *));
```

- Without this, `dark:` utilities use `prefers-color-scheme` media query instead of the `.dark` class
- This override makes `dark:` apply when an ancestor has the `dark` class
- Components use `dark:` variants, e.g. `bg-white dark:bg-slate-800`, `text-slate-900 dark:text-slate-100`

---

## 4. Where Dark Styles Are Used

### Tailwind `dark:` variants

Most components use Tailwind’s `dark:` prefix:

- Layout: `bg-white dark:bg-gray-800`, `dark:bg-gray-900`
- Text: `text-gray-900 dark:text-white`, `text-gray-600 dark:text-gray-400`
- Borders: `border-gray-200 dark:border-gray-700`
- Hover: `hover:bg-emerald-50 dark:hover:bg-emerald-900`

### Global utility classes (`index.css`)

**File:** `src/index.css`

Shared utilities use `dark:` for dark mode:

- Buttons: `.btnPrimary`, `.btnGreen`, `.btnWhite`, etc.
- Text: `.mediumText`, `.formText`, `.errorText`
- Inputs: `.loginInput`, `.longTextInput`, etc.
- Modals: `.largeModal`, `.mediumModal`, `.modalHeader`, etc.

---

## 5. MUI / Material React Table (MRT)

**File:** `src/components/providers/MRTThemeProvider.tsx`

MRT tables use MUI’s theme, which is driven by the same `theme` state:

```tsx
const muiTheme = createTheme({
  palette: {
    mode: theme === 'dark' ? 'dark' : 'light',
    background: { default: '...', paper: '...' },
    text: { primary: '...', secondary: '...' },
  },
  components: {
    MuiTableHead: { ... },
    MuiTableBody: { ... },
    MuiTableCell: { ... },
  },
});
```

- `MRTThemeProvider` wraps table components that use MRT
- MUI theme switches based on `theme`, so tables follow light/dark consistently

---

## 6. Theme Toggle UI

**File:** `src/components/elements/AppProfileComponent.tsx`

```tsx
<button onClick={handleThemeToggle} className="...">
  {theme === 'dark' ? <LuSun size={16} /> : <LuMoon size={16} />}
  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
</button>
```

- Sun icon in dark mode (to switch to light), moon icon in light mode (to switch to dark)
- Clicking calls `toggleTheme` from `ThemeStore`

---

## 7. Explicit Theme Checks (Not Tailwind `dark:`)

Some components read `theme` and apply classes manually instead of using `dark:` variants.

### AppText

**File:** `src/components/text/AppText.tsx` (lines 72–78)

```tsx
const colorVariantMap = {
  primary: theme === 'dark' ? 'text-white' : 'text-black',
  secondary: 'text-gray-600 dark:text-gray-400',
  // ...
};
```

- Uses `theme` for primary color; other variants still use `dark:` where appropriate.

### ItemPageHeaderLayout

**File:** `src/components/elements/ItemPageHeaderLayout.tsx`

- Uses `theme === 'dark'` for conditional class names (e.g. background, text)
- Combines `theme` checks with explicit `dark` class strings in some places

---

## 8. Flow Summary

```
User clicks theme toggle in AppProfileComponent
    → toggleTheme() in ThemeStore
    → theme state updates (persisted to localStorage)
    → AppNavbar useEffect runs
    → document.documentElement gains/removes 'dark' class
    → Tailwind dark: variants apply / unapply
    → MRTThemeProvider re-renders with updated MUI palette
    → Components using useThemeStore() re-render with new theme

User navigates from /app to /login
    → AppLayout (and AppNavbar) unmount
    → useEffect cleanup runs → document.documentElement.classList.remove('dark')
    → Landing/auth pages stay light (no dark class on document)
```

---

## 9. Notes

1. **Scope:** The DOM `dark` class is set from `AppNavbar`, which only renders on admin (`/app`) routes. **Landing and auth pages are unaffected:** when navigating away from admin, the useEffect cleanup removes the `dark` class from `document.documentElement`, so Login, Register, Forgot Password, etc. always remain light.
2. **Hydration:** Zustand `persist` loads the stored theme on init, so the chosen theme is restored across reloads.
3. **tailwind.config.js:** `darkMode: 'class'` must be set for `dark:` variants to work.
