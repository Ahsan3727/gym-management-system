# Ironline Branding, Themes & Layouts Architecture Guide

This document describes the multi-tenant branding, dynamic WCAG AA theme derivation, modular shell layouts, and dashboard block system in Ironline.

---

## 1. System Overview & Core Architecture

Ironline delivers complete white-label branding for gyms without sacrificing performance, security, or visual consistency.

### Architectural Decisions
- **SuperAdmin Ownership (D1):** All theme and layout configurations are owned and governed strictly by `super_admin` in the SuperAdmin Branding Control Center (`/superadmin/admins` -> **Branding**). Gym owners cannot tamper with their layout presets or override brand colors arbitrarily.
- **Zero-Override Default (D2):** The default gym theme (`ember`) writes **zero CSS variable overrides**. The default stylesheet (`index.css`) renders directly without dynamic variable injection, guaranteeing 100% pixel-identical behavior and zero regressions for standard gyms.
- **Role Isolation (D3):**
  - `memberApp` themes override `--c-ember`, `--c-ember-light`, `--c-ember-dark`, `--c-ember-rgb`.
  - `adminApp` themes override `--c-iron`, `--c-iron-light`, `--c-iron-dark`, `--c-iron-rgb`.
  - Personal Trainers inherit their gym's `adminApp` branding.
  - The SuperAdmin portal is never themed, remaining strictly neutral slate/chalk.
- **Decoupled Semantic Fixed Tokens (D4):**
  - Status indicators use dedicated semantic tokens: `--c-danger`, `--c-success`, `--c-warning`, and `--c-on-primary`.
  - Overdue dues, error alerts, and destructive actions stay vivid red across all themes (e.g., in `ocean` blue or `forest` green gyms).
- **Explicit Mode Respect (D5):** If a user explicitly clicks the light/dark toggle, their explicit choice (`ironline_theme_explicit`) overrides the gym's `defaultMode`.
- **Enforced Revenue & Invariant Blocks (D6):**
  - Member app presets must always include `checkin` and `membership`.
  - Admin app presets must always include `billingBanner` (platform dues collection).

---

## 2. Dynamic WCAG 2.1 AA Contrast Math Engine

Colors are mathematically derived rather than hand-tuned (`frontend/src/theme/derive.js`):
1. **Relative Luminance Calculation:**
   $$L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
   where each gamma-corrected channel $C \in [0, 1]$ is:
   $$C = \begin{cases} \frac{C_{\text{srgb}}}{12.92}, & C_{\text{srgb}} \le 0.03928 \\ \left(\frac{C_{\text{srgb}} + 0.055}{1.055}\right)^{2.4}, & \text{otherwise} \end{cases}$$
2. **Contrast Ratio:**
   $$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 \ge L_2)$$
3. **Derived Contrast Variants:**
   - **`on-primary`:** Determines whether `#ffffff` or `#0b0f17` achieves $\ge 4.5:1$ contrast on top of the theme's primary button/accent background.
   - **`primary-dark` / Text-Safe Primary:** Lightens or darkens primary color in 5% steps until achieving $\ge 4.5:1$ contrast against the background surface.
   - **Tinted & Bold Surfaces:** Computes background tints using dynamic `color-mix()` with fallback solid shades.

Every theme across dark and light modes is verified by automated contrast tests (`frontend/src/theme/__tests__/themes.contrast.test.js`).

---

## 3. Zero-Flash Boot & Multi-Tenant PWA Lifecycle

### Offline & Cold Boot Replay
1. When a gym theme is resolved, the computed CSS variable map is stored in `localStorage.ironline_theme_vars`.
2. In `frontend/index.html`, an inline, synchronous, blocking `<script>` reads `localStorage.ironline_theme_vars` before the first DOM paint.
3. If valid theme variables exist for the active tenant, they are stamped directly onto `document.documentElement.style` before React mounts. This guarantees **zero flash of orange** on reload, navigation, or PWA launch.

### Version-Aware Focus Polling
In `frontend/src/components/BrandingApplier.jsx`, when the user refocuses the application tab or PWA window, a lightweight check queries `/api/auth/me`. If `user.branding.version` has incremented, fresh branding is fetched and applied seamlessly without full page reload.

---

## 4. How to Add a 13th Theme

To add a new theme (e.g. `violet`):

### Step 1: Define Backend Constants
Open `backend/constants/branding.js`:
1. Append `'violet'` to `THEMES`:
   ```javascript
   const THEMES = [
     'ember', 'ocean', 'forest', 'royal', 'crimson', 'teal',
     'amber', 'rose', 'slate', 'lime', 'midnight', 'cyan',
     'violet'
   ];
   ```
2. Add the palette definition to `THEME_MANIFEST`:
   ```javascript
   violet: {
     name: 'Violet',
     primary: '#8b5cf6',
     dark: { bg: '#0d0b14', panel: '#151122' },
   }
   ```

### Step 2: Define Frontend Theme
Open `frontend/src/theme/themes.js`:
1. Add the theme entry to `THEMES`:
   ```javascript
   violet: {
     id: 'violet',
     name: 'Violet',
     primary: '#8b5cf6',
     dark: {
       bg: '#0d0b14',
       panel: '#151122',
     },
   }
   ```

### Step 3: Verify Automated Test Gates
Run backend and frontend tests to ensure schema parity and contrast ratios:
```bash
# 1. Backend parity test (verifies backend and frontend option lists match)
npm --prefix backend test -- tests/branding.parity.test.js

# 2. Frontend contrast test (verifies >= 4.5:1 WCAG AA compliance across both modes)
npm --prefix frontend test -- src/theme/__tests__/themes.contrast.test.js

# 3. Token check (ensures no semantic token regressions)
npm --prefix frontend run check:tokens
```

---

## 5. How to Add a 4th Shell Layout

To add a new shell layout (e.g. `floating-dock`):

### Step 1: Register in Backend & Schemas
In `backend/constants/branding.js`:
```javascript
const SHELLS = ['sidebar', 'bottom-tabs', 'top-bar', 'floating-dock'];
```

### Step 2: Build the Shell Component
Create `frontend/src/layouts/FloatingDockShell.jsx`:
- Import reusable pieces from `frontend/src/layouts/shellParts.jsx` (`BrandHeader`, `NavItemLink`, `AccountCard`, `useAccentClasses`).
- Render `<Outlet />` with proper spacing and mobile safe-area insets (`env(safe-area-inset-bottom)`).

### Step 3: Register in DashboardShell Selector
In `frontend/src/components/DashboardShell.jsx`:
```javascript
import FloatingDockShell from '../layouts/FloatingDockShell.jsx';

const SHELLS = {
  sidebar: SidebarShell,
  'bottom-tabs': BottomTabShell,
  'top-bar': TopBarShell,
  'floating-dock': FloatingDockShell,
};
```

### Step 4: Add UI Wireframe in ShellPicker
In `frontend/src/components/branding/ShellPicker.jsx`, add the new option card with an SVG wireframe representing the layout.

---

## 6. How to Add a Dashboard Block or Preset

### Step 1: Create the Block Component
- Member blocks live in `frontend/src/blocks/member/` and consume data via `useMemberDashboardData()`.
- Admin blocks live in `frontend/src/blocks/admin/` and consume data via `useAdminDashboardData()`.

### Step 2: Register in Block Registry
In `frontend/src/blocks/registry.js`:
```javascript
export const MEMBER_BLOCKS = {
  // ...
  yourBlock: YourBlockComponent,
};
```

### Step 3: Add to Dashboard Presets
In `frontend/src/blocks/dashboards.js`:
- Include your block ID in presets (`classic`, `focus`, `compact`, etc.).
- **Invariant:** Notice that `REQUIRED = { member: ['checkin', 'membership'], admin: ['billingBanner'] }` guarantees critical operational blocks cannot be left out.

---

## 7. Operational & Rollout Checklist

| Step | Action | Verification |
|---|---|---|
| **1. Database** | Safe schema update (`branding` subdocument) | Default is `{}` (falls back to `APP_DEFAULT`) |
| **2. Backend Deploy** | Deploy backend services first | Run `npm test` in `backend/` |
| **3. Frontend Deploy** | Deploy frontend build | Run `npm run build && npm run check:tokens` in `frontend/` |
| **4. Canary Test** | Configure one test gym to a non-default theme (`ocean` / `bottom-tabs`) in `/superadmin/admins` | Verify member app renders blue bottom bar with zero orange flash on reload |
| **5. Audit Verification** | Check `/superadmin/audit-log` | Confirm `admin.branding.update` is logged with before/after diffs |
