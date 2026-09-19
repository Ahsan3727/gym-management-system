# Ironline: Per-Gym Themes & Layouts, Final Implementation Task List

Repo: `Ahsan3727/gym-management-system`. Supersedes the spec and the earlier plan.
Each task has an ID and a "done when".
Legend: `[ ]` to do. `dep:` = must finish first.

## Locked decisions

| # | Decision | Reason found in the code |
|---|---|---|
| D1 | Super admin owns all branding. Gym `themeColor` is left alone (install icon, legacy manifest). | `updateAdminSchema` already lets super admin edit `themeColor`. |
| D2 | Theme `ember` = **no overrides** (writes no CSS variables). | Guarantees a pixel-identical default, including light-mode ember and the admin app's `iron`. |
| D3 | `memberApp` themes override `--c-ember*`. `adminApp` themes override `--c-iron*`. Trainer uses `adminApp`. Super admin app is never themed. | `DashboardShell accent` = ember (member), iron (admin, trainer), chalk (super admin). |
| D4 | New fixed colours `danger`, `success`, `warning`. Defaults equal today's `ember-dark` values. | Errors and overdue banners use `text-ember-dark` / `bg-ember/10` today. |
| D5 | `defaultMode` applies only if the user never toggled light/dark (`ironline_theme_explicit`). | `ThemeProvider` saves `ironline_theme` on first mount. |
| D6 | Required blocks: member = `checkin`, `membership`; admin = `billingBanner`. | Platform-dues banner is your revenue mechanism. |
| D7 | `DashboardShell.jsx` stays as a thin selector. Its body moves to `layouts/SidebarShell.jsx`. `App.jsx` is untouched. | `DashboardShell` is imported only by `App.jsx`. |
| D8 | Role string is `super_admin`. | `router.use(protect, authorize('super_admin'))`. |
| D9 | Themes change dark `bg`/`panel` + accent. Light mode keeps the existing palette (accent only). | Avoids inventing 11 light palettes. |
| D10 | **Contrast is computed, not hand-tuned.** Themes store only `primary`, `bg`, `panel`. Code derives a text-safe accent and `on-primary` for each mode. | Lime/Amber/Teal/Cyan would fail on light backgrounds and with white text. |
| D11 | The `ember` theme card is labelled **"Default (current)"** in the admin-app picker and shows the admin default swatch. | In the admin app, "no override" means iron, not orange. |

## Facts confirmed from the code (no longer assumptions)

- Login and `/auth/me` user object is built in **`backend/routes/authRoutes.js`** (inline handlers). Find it with `grep -n "gymSlug" backend/routes/authRoutes.js`.
- `AuditLog` fields: `actor, actorRole, action` (free string, **not an enum**), `targetType, targetId, metadata` (Mixed). No model change is needed. Use `logAction(req, ...)`. Copy the argument order from an existing call (the suspend route).
- Public branding: `GET /public/branding/:slug`. Manifests: `/public/manifest/:slug` and `/public/manifest/staff`.
- Backend tests use `node:test`. Some tests re-implement logic locally, so every **new** test must `require` the real module.
- `updateProfileSchema` in `customerSchemas.js` is the **member** profile schema. The gym-admin `PUT /profile` route in `adminRoutes.js` has no schema I could find, so Task 0.4 checks it directly.

---

## Phase 0: Recon. Fill this table before any code

- [ ] **T0.1** Open `frontend/src/index.css` and `frontend/tailwind.config.js`. Record the values below.

| Item | Value |
|---|---|
| Variable names for ember / ember-light / ember-dark / iron / chalk / bone / panel / ink / steel | |
| Variable format (space-separated RGB triplet?) | |
| Light-mode `bone` and `panel` hex | |
| Default `--c-iron` hex (admin default swatch, D11) | |
| Default `ember-dark` hex (used for `--c-danger` default, D4) | |
| Do `.page-header` and `.hero-card` exist? | |
| Does `.card--tint` exist, and what does it do? | |

- [ ] **T0.2** Read the **full** `CustomerOverview.jsx`, `AdminOverview.jsx` and `TrainerOverview.jsx`. List every section in order. **This list defines the blocks in Phase 8.** Done when: block tables in T8.3 have no "verify" left.
- [ ] **T0.3** Read `frontend/package.json` (ESM `"type"`, Vite version, test tooling), `frontend/public/sw.js` (does it cache `/public/branding/*`?), and `frontend/index.html` (the existing blocking theme script).
- [ ] **T0.4** Open the `PUT /profile` handler in `backend/routes/adminRoutes.js`. Can a gym admin change `gymName`? Record yes/no. (Yes means the flyer XSS is a privilege escalation, so T1.1 is urgent.)
- [ ] **T0.5** Open the `admin.suspend` audit call in `superAdminRoutes.js`. Record the `logAction` argument order.

Gate: the table is filled. Everything below uses these values.

---

## Phase 1: Security fix, ship immediately (independent)

- [ ] **T1.1** Create `frontend/src/utils/escapeHtml.js`:
  ```js
  const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  export const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
  ```
- [ ] **T1.2** Escape every interpolated value in the `document.write` templates:
  - `Admins.jsx` `printMemberFlyer`: `gymName`, `installUrl`
  - `Customers.jsx` `printReceiptSlip`: `gymName, memberName, phone, receiptNumber, paymentMethod`
  - `AdminPlatformBilling.jsx` `printInvoiceSlip`: `invoiceNumber, billingCycle, paymentMethod, transactionReference, status`
- [ ] **T1.3** Defence in depth: add `.regex(/^[^<>]*$/, 'Invalid characters')` to `gymName` in `createAdminSchema` and `updateAdminSchema`.
- [ ] **T1.4** Test: create a gym named `<img src=x onerror=alert(1)>`. Open the flyer, receipt and invoice. Nothing executes and the text shows literally.

Done when: PR merged and deployed.

---

## Phase 2: Visual safety net. Must finish before Phase 3

Goal: make "no visible change" a machine-checked fact, not a manual eyeball.

- [ ] **T2.1** `cd frontend && npm i -D @playwright/test && npx playwright install chromium`. Add scripts `"test:visual": "playwright test"` and `"test:visual:update": "playwright test --update-snapshots"`.
- [ ] **T2.2** Create `frontend/playwright.config.js`:
  ```js
  import { defineConfig } from '@playwright/test';
  export default defineConfig({
    testDir: './e2e',
    snapshotPathTemplate: '{testDir}/__shots__/{arg}{ext}',
    use: { baseURL: 'http://localhost:5173', reducedMotion: 'reduce' },
    expect: { toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide' } },
    webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
    projects: [
      { name: 'phone',   use: { viewport: { width: 390,  height: 844 } } },
      { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    ],
  });
  ```
- [ ] **T2.3** Deterministic data. Create a **seeded** local backend (seed script with fixed names, dates and amounts). Record HAR files once, one per role (`e2e/fixtures/{customer,trainer,admin,superadmin}.har`), using `page.routeFromHAR(path, { update: true })`. Replay from HAR in tests. Route image requests (Cloudinary logos) to one fixed placeholder.
- [ ] **T2.4** `frontend/e2e/visual.spec.js`. For each role, seed `localStorage` (`gym_token`, `gym_user`, `ironline_theme`), freeze time with `page.clock.setFixedTime('2026-01-15T10:00:00Z')`, then loop over every route and both modes, calling `expect(page).toHaveScreenshot(...)`.
  - customer: `/customer`, `checkin`, `workouts`, `diet`, `weight`, `analytics`, `notifications`, `account`
  - trainer: `/trainer`, `clients`, `schedule`
  - admin: `/admin`, `attendance`, `customers`, `trainers`, `branches`, `fees`, `billing`, `profile`
  - super admin: `/superadmin`, `admins`, `billing`, `audit-log`, `settings`
  - plus `/login` and `/login?gym=<slug>`
- [ ] **T2.5** On the **unchanged `main` branch**, run `test:visual:update`, commit the snapshots, and run `test:visual` twice. Done when: two consecutive runs are green (proves it is not flaky).
- [ ] **T2.6** Add a CI job that runs `test:visual` on every PR.
- [ ] **T2.7** Create `frontend/scripts/check-tokens.mjs` (CI step `"check:tokens"`). It fails the build if it finds any of:
  1. `text-white` in the same `className` string as `bg-ember|bg-iron|bg-chalk` (after Phase 3)
  2. `text-ember-dark|bg-ember/..|border-ember/..` used for errors or overdue (list the allowed files explicitly)
  3. `meta[name="theme-color"]` written anywhere except `src/theme/applyTheme.js` (after Phase 5)

Gate: baseline committed and stable. This is the reference for every later phase.

---

## Phase 3: Token refactor, zero visible change. dep: Phase 2

- [ ] **T3.1** `index.css`: add `--c-danger`, `--c-success`, `--c-warning`, `--c-on-primary` for **both** dark and light, set to today's values from T0.1 (danger = current `ember-dark`).
- [ ] **T3.2** `tailwind.config.js`: add colours `danger`, `success`, `warning`, `on-primary` as `rgb(var(--c-…) / <alpha-value>)`. Do **not** rename existing tokens.
- [ ] **T3.3** `text-white` sweep. Run `grep -rn "text-white" frontend/src`. Every hit that sits on `bg-ember|iron|chalk` becomes `text-on-primary`. Known files: `DashboardShell.jsx` (logo tile, avatar), `SegmentedControl.jsx`. Add `--c-on-primary` default = white so nothing changes.
- [ ] **T3.4** Danger migration. Run `grep -rn "ember-dark\|bg-ember/\|border-ember/" frontend/src`. For each hit decide brand vs danger. Errors, overdue, "Critical" banners, fee-due chips become `danger`. Known files: `CustomerOverview`, `AdminOverview`, `Notifications.jsx` (`fee_due`).
- [ ] **T3.5** `chartTheme.js`: `useChartColors()` reads accent and grid colours from CSS variables via `getComputedStyle(document.documentElement)`, recomputed on mode or branding change. Keep `PALETTE` as fallback.
- [ ] **T3.6** Email templates and print slips keep their hard-coded colours. Add a comment saying so (out of scope).
- [ ] **T3.7** Run `test:visual` and `check:tokens`. Fix diffs.

Done when: **zero pixel diff** in all snapshots. Merge only then.

---

## Phase 4: Backend foundation. Can run in parallel with Phase 3

- [ ] **T4.1** `backend/constants/branding.js`:
  ```js
  const THEMES = ['ember','ocean','forest','royal','crimson','teal','amber','rose','slate','lime','midnight','cyan'];
  const SHELLS = ['sidebar','bottom-tabs','top-bar'];
  const DASHBOARDS = ['classic','focus','compact'];
  const SURFACES = ['accent','tinted','bold'];
  const MODES = ['dark','light'];
  const APP_DEFAULT = { theme:'ember', shell:'sidebar', dashboard:'classic', surface:'accent', defaultMode:'dark' };
  const THEME_MANIFEST = { /* id: { primary, bg }, same hexes as frontend themes.js; 'ember' omitted */ };
  module.exports = { THEMES, SHELLS, DASHBOARDS, SURFACES, MODES, APP_DEFAULT, THEME_MANIFEST };
  ```
- [ ] **T4.2** `backend/schemas/brandingSchemas.js`:
  ```js
  const { z } = require('zod');
  const C = require('../constants/branding');
  const app = z.object({
    theme: z.enum(C.THEMES), shell: z.enum(C.SHELLS), dashboard: z.enum(C.DASHBOARDS),
    surface: z.enum(C.SURFACES), defaultMode: z.enum(C.MODES),
  }).strict();
  const brandingSchema = z.object({ memberApp: app, adminApp: app }).strict();
  module.exports = { brandingSchema };
  ```
- [ ] **T4.3** `backend/utils/branding.js`: `resolveBranding(adminDoc)` merges stored values over `APP_DEFAULT` and replaces any unknown id with its default, per field. `publicMemberBranding(adminDoc)` returns `{ ...memberApp, version }` only.
- [ ] **T4.4** `backend/models/Admin.js`: add `branding` with `memberApp` and `adminApp` sub-objects (`_id: false`, five String fields with `APP_DEFAULT`) and `version: { type: Number, default: 1 }`. **Do not touch `themeColor`.** No migration.
- [ ] **T4.5** `backend/routes/authRoutes.js`: add `branding: resolveBranding(adminDoc)` to the user object in **both** login and `/me`, for `admin`, `trainer` and `customer`. Not for `super_admin`. For customers and trainers, load the `Admin` by `user.admin`.
- [ ] **T4.6** `backend/routes/publicRoutes.js`, `GET /branding/:slug`: add `branding: publicMemberBranding(admin)`.
- [ ] **T4.7** `buildManifest()`: if the member theme is not `ember`, use `THEME_MANIFEST[theme].primary` for `theme_color` and `.bg` for `background_color`. Otherwise keep `admin.themeColor || DEFAULT_THEME_COLOR` and the current background. Existing gyms are unchanged.
- [ ] **T4.8** `backend/routes/superAdminRoutes.js`, new route (match how other routes call `validate`; use the T0.5 argument order):
  ```js
  router.put('/admins/:id/branding', validate(brandingSchema), asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Gym not found.' });
    const before = resolveBranding(admin);
    admin.branding = { ...req.body, version: (admin.branding?.version ?? 1) + 1 };
    await admin.save();
    await logAction(req, 'admin.branding_update', 'Admin', admin._id, { before, after: resolveBranding(admin) });
    res.json(admin);
  }));
  ```
  (`authorize('super_admin')` is already on the router.)
- [ ] **T4.9** Tests, each importing **real** modules:
  - `branding.schema.test.js`: valid passes. Unknown enum, extra key, raw CSS, missing field all fail.
  - `branding.parity.test.js`: read `frontend/src/theme/themes.js` and assert theme ids and `THEME_MANIFEST` hexes equal the backend constants (same repo, so CI can read both).
  - `branding.route.test.js`: non-`super_admin` gets 403. Unknown gym id gets 404. `version` increments. An audit entry with before and after exists. Gym A's token cannot read or change gym B's branding. A gym with no `branding` resolves to defaults. `/public/branding/:slug` returns no fields other than the five plus `version`.

Gate: `node --test backend/tests`. Deploy the backend first (additive, frontend ignores the new fields).

---

## Phase 5: Frontend theme engine. dep: Phase 3, T4.5 and T4.6

- [ ] **T5.1** `frontend/src/theme/themes.js`: pure ESM. `THEMES` entries are `{ label, primary, bg, panel }`, with `ember: { label: 'Ember', primary: null }` (no overrides). Use the hexes from the spec §6.1. Export `THEME_IDS`, `SHELL_IDS`, `DASHBOARD_IDS`, `SURFACE_IDS`, `MODE_IDS`, `DEFAULT_APP`.
- [ ] **T5.2** `frontend/src/theme/derive.js`: pure functions.
  ```js
  export const hexToRgb = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16));
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  export const luminance = (h) => { const [r, g, b] = hexToRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  export const mix = (a, b, t) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  export function ensureContrast(fg, bg, min = 4.5) {
    const toward = luminance(bg) > 0.5 ? '#000000' : '#ffffff';
    let c = fg;
    for (let t = 0.05; contrast(c, bg) < min && t <= 1; t += 0.05) c = mix(fg, toward, t);
    return c;
  }
  export const pickOnPrimary = (p) => (contrast('#ffffff', p) >= contrast('#000000', p) ? '#ffffff' : '#000000');
  ```
- [ ] **T5.3** `frontend/src/theme/applyTheme.js`. Use variable names from T0.1.
  - `computeVars({ theme, mode }, app)`: returns `{}` for `ember`. Otherwise `bg`/`panel` = theme values in dark, or the T0.1 light values in light. `p = ensureContrast(ensureContrast(primary, bg), panel)`. `light = mix(p, '#ffffff', .25)`. `dark = ensureContrast(mix(p, '#000000', .2), panel)`. `onPrimary = pickOnPrimary(p)`. Keys: `--c-ember*` if `app === 'memberApp'`, `--c-iron*` if `adminApp`, plus `--c-on-primary`, plus `--c-bone` and `--c-panel` **in dark mode only** (D9).
  - `applyTheme(settings, app, el = document.documentElement)`: first `removeProperty` on every owned variable, then set the computed ones as RGB triplets, then `dataset.theme` and `dataset.surface`. If `el` is the document root, save the vars to `localStorage['ironline_theme_vars']` (for the early script) and call `setThemeColorMeta`.
  - `setThemeColorMeta(hex)`: **the only writer** of the meta tag. For `ember` use today's values (`#ff4e1f` dark, `#E1553A` light), which matches what `ThemeProvider` does after mount today.
- [ ] **T5.4** `frontend/src/theme/branding.js`: `resolveBranding(role, tenant, user)` returns `{ app, settings }` (`customer`→`memberApp`, `admin`/`trainer`→`adminApp`, `super_admin`→`null`; prefer `user.branding`, else `tenant.branding`, else defaults). `fetchTenantBranding(slug)` uses `API_BASE`, a 4s abort, and on failure returns the cached tenant.
- [ ] **T5.5** `frontend/src/components/BrandingApplier.jsx`: renders `null`. Effect: `resolveBranding` → `applyTheme` → `setDefaultMode(settings.defaultMode)`. Re-runs on `branding.version`, `mode` or `role` change. Mount it in `main.jsx` inside `AuthProvider`.
- [ ] **T5.6** `context/ThemeContext.jsx`: delete the hard-coded `theme-color` block. Persist `ironline_theme` and set `ironline_theme_explicit` **only** on a user toggle. Add `setDefaultMode(mode)`, a no-op if explicit.
- [ ] **T5.7** `main.jsx`: replace the three direct meta writes (`resolveTenantBranding`, `applyBrandingTags`, `applyStaffBranding`) with `setThemeColorMeta`. Make `resolveTenantBranding` stale-while-revalidate: apply the cached tenant first, fetch in the background (4s abort), and **never** fall back to defaults if a cache exists. Staff path: neutral default theme.
- [ ] **T5.8** `frontend/index.html`: extend the existing blocking script (about 10 lines, in try/catch) to replay `ironline_theme_vars` onto `<html>` before first paint.
- [ ] **T5.9** `Login.jsx`: replace the raw `fetch('/api/public/branding/...')` with `fetchTenantBranding(slug)`.
- [ ] **T5.10** **Contrast tests**, `frontend/src/theme/__tests__/themes.contrast.test.js` (`node:test`, import the real modules). For every theme × mode (dark, light) × app, using the **derived** values, assert ≥ 4.5:1 for all of:

  | Pair | Where it appears |
  |---|---|
  | `on-primary` on `primary` | filled buttons, avatar, active `SegmentedControl` |
  | `primary` (as text) on `bg` and on `panel` | `text-ember`, `text-iron`, links |
  | `primary-dark` on `panel` mixed with 10% primary | active nav item, chips |
  | `ink` on `bg`, `panel`, and `mix(panel, primary, 8%)` | body text, `tinted` surface |
  | `steel` on `bg` and `panel` | secondary text |
  | `danger` on `bg` and `panel` | error text |
  | `on-primary` on `primary` for `bold` surface | `bold` headers |

  Add `"test": "node --test src/theme"` to `package.json`.

Gate: `ember` gym passes `test:visual` with zero diff. In the database set a test gym to `ocean`. Member app on `/g/:slug` is blue with **no flash of orange** on hard reload and on offline relaunch. `npm run check:tokens` passes (single meta writer).

---

## Phase 6: Super admin Branding screen, theme + mode. dep: Phase 5

- [ ] **T6.1** `frontend/src/pages/superadmin/GymBranding.jsx`. Tabs Member app / Admin app. Local draft state. Buttons: Save (calls `PUT /superadmin/admins/:id/branding`, then a toast and reload of the gym list), Reset to default, Copy from another gym (client-side, from the loaded list). Warn on unsaved changes.
- [ ] **T6.2** `components/branding/ThemePicker.jsx`: grid of swatches from `THEMES`. Takes an `app` prop (D11): for `adminApp` the `ember` card reads **"Default (current)"** and shows the T0.1 iron swatch. For `memberApp` it reads "Ember".
- [ ] **T6.3** `components/branding/ModePicker.jsx`.
- [ ] **T6.4** `components/branding/BrandingPreview.jsx`: wrapper `<div ref>` calling `applyTheme(draft, app, ref.current)`. Renders a real `StatCard`, `.panel`, a `.btn-primary`, a nav sample, an error line and a chart. No iframe.
- [ ] **T6.5** `pages/superadmin/Admins.jsx`: add a **Branding** action per gym row that opens `GymBranding`.
- [ ] **T6.6** `pages/admin/GymProfile.jsx`: keep the `themeColor` field, add helper text ("Used for the install icon and browser bar. Your Ironline admin sets the app theme.").

Gate: change a test gym in the UI. Member and admin apps of that gym reload with different themes. The audit log shows before and after.

---

## Phase 7: Shells. dep: Phase 6

- [ ] **T7.1** `layouts/shellParts.jsx`: extract `BrandHeader`, `NavItemLink`, `AccountCard` (with `ThemeToggle` and logout), `useAccentClasses(accent)` from `DashboardShell.jsx`.
- [ ] **T7.2** `layouts/SidebarShell.jsx`: the current body moved as-is, using `shellParts`. `test:visual` must stay at zero diff.
- [ ] **T7.3** `layouts/BottomTabShell.jsx`: fixed bottom bar with at most 5 items (the rest in a "More" sheet), compact header, `<Outlet/>` with bottom padding and `env(safe-area-inset-bottom)`.
- [ ] **T7.4** `layouts/TopBarShell.jsx`: horizontal nav in the header (scrolls on small screens), account menu at the right, `<Outlet/>` below.
- [ ] **T7.5** `components/DashboardShell.jsx` becomes the selector:
  ```jsx
  const SHELLS = { sidebar: SidebarShell, 'bottom-tabs': BottomTabShell, 'top-bar': TopBarShell };
  export default function DashboardShell(props) {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const { app, settings } = resolveBranding(user?.role, tenant, user);
    const Shell = app ? (SHELLS[settings.shell] ?? SidebarShell) : SidebarShell;
    return <Shell {...props} />;
  }
  ```
- [ ] **T7.6** `components/branding/ShellPicker.jsx` (wireframe thumbnails). Add it to `GymBranding`.
- [ ] **T7.7** Tests: Playwright specs per shell at 390px and 1280px checking that active-route highlight, logout, theme toggle and mobile menu work. Visual snapshots for both new shells. Trainer and admin receive the `adminApp` shell. Super admin always gets the sidebar.

Gate: default gym zero diff.

---

## Phase 8: Dashboard blocks and surfaces. dep: Phase 7 and T0.2

- [ ] **T8.1** `blocks/useMemberDashboardData.js`: a context and provider that hold `profile, streak, membership, weightLogs, sessions`, one `loadAll()`, and `checkin(qrToken)` (logic moved out of `CustomerOverview`). Blocks read from it, so a check-in still updates the streak card.
- [ ] **T8.2** `blocks/useAdminDashboardData.js`: same for `profile, analytics, billingSummary`, plus `sendAnnouncement()`. Keep the loading and error states in the provider.
- [ ] **T8.3** Extract blocks **one per section, in the order found in T0.2**, into `blocks/member/` and `blocks/admin/`. Start list from the graph (complete it from T0.2):
  - **Member:** `WelcomeBlock`, `StreakBlock`, `LongestStreakBlock`, `LatestWeightBlock`, `MembershipBlock`, `CheckinBlock` (owns the QR modal) + T0.2 remainder
  - **Admin:** `BillingBannerBlock`, `ActiveMembersBlock`, `TotalMembersBlock`, `RevenueBlock`, `RevenueChartBlock`, `MemberGrowthBlock`, `AnnouncementBlock` + T0.2 remainder

  Do it in two steps: first move code into blocks rendered in **today's exact order**, then re-run `test:visual` (zero diff).
- [ ] **T8.4** `blocks/registry.js` and `blocks/dashboards.js`. `classic` = today's order. Add `focus` and `compact`. Add `REQUIRED = { member: ['checkin','membership'], admin: ['billingBanner'] }`.
- [ ] **T8.5** `blocks/DashboardRenderer.jsx`: `{ app }` → preset from branding (fallback `classic`). Grid `grid-cols-1 md:grid-cols-4` matching today's stat grid. Skip unknown ids. Force-insert required blocks missing from a preset.
- [ ] **T8.6** Reduce `CustomerOverview.jsx` and `AdminOverview.jsx` to provider + renderer.
- [ ] **T8.7** Surface CSS in `index.css`: `[data-surface="tinted"] .panel`, `[data-surface="bold"] .page-header, .hero-card`, each with a plain fallback first, then a `color-mix` version inside `@supports`. Create `.page-header` and `.hero-card` if T0.1 says they don't exist, and apply them to page headers. Reconcile with the existing `.card--tint`.
- [ ] **T8.8** `DashboardPicker.jsx` and `SurfacePicker.jsx`, added to `GymBranding`.
- [ ] **T8.9** Tests: every preset is single-column at 360px. Required blocks appear in every preset. An unknown block id is skipped without error. Check-in updates the streak block. Snapshots for each dashboard preset and each surface.

Gate: default gym zero diff. `unit test: REQUIRED blocks ⊂ every preset`.

---

## Phase 9: Hardening and rollout

- [ ] **T9.1** Version check: on window focus, if `user.branding.version` differs from the server's, refetch `/auth/me` and re-apply. Members get a change on next load or focus.
- [ ] **T9.2** Full QA on real devices (iOS Safari, Android Chrome, installed and not installed): 2–3 full theme × shell × dashboard × surface combinations. Do **not** test the whole matrix.
- [ ] **T9.3** Confirm the service worker does not cache `/public/branding/*` stale (T0.3). If it does, add `stale-while-revalidate` or bypass.
- [ ] **T9.4** Docs: a `BRANDING.md` explaining how to add a 13th theme or a 4th layout (edit `themes.js` + `constants/branding.js`, the parity test enforces it).
- [ ] **T9.5** Rollout: deploy backend, then frontend. Change **one test gym** first, then roll out gym by gym.

**Rollback:** revert the frontend PR. The `branding` field is ignored by older code. No data migration is needed either way.

---

## Definition of done

- [ ] Default gyms: zero pixel diff, light and dark, all four roles (Playwright)
- [ ] All 12 themes × 2 modes pass every pair in T5.10
- [ ] Error and overdue states stay red on every theme
- [ ] No wrong-colour flash on cold start or offline relaunch
- [ ] Member and admin apps of one gym theme independently. Trainers follow `adminApp`. Super admin is unthemed
- [ ] Only `super_admin` can write. Gym A cannot touch gym B. Every save is audited with before and after
- [ ] `check:tokens` passes (single `theme-color` writer, no white-on-accent, no ember-as-error)
- [ ] Parity test proves the frontend and backend option lists are identical
- [ ] All three print functions escape their inputs
