# Implementation Plan: Customer "Something went wrong" Crash

**Project:** `Ahsan3727/gym-management-system` (analyzed at commit `ba25ff4`)
**Date:** 21 September 2026
**Status:** Root cause confirmed and fix verified locally (build passes, no undefined identifiers remain in `frontend/src`)

---

## 1. Summary

Customers can log in, but their account then shows "Something went wrong" and cannot be used. Reloading does not help because the login token is still saved, so every visit crashes in the same place.

| | |
|---|---|
| **Root cause** | `frontend/src/layouts/BottomTabShell.jsx` line 139 uses a variable, `accentText`, that is never defined. The bottom tab bar crashes the whole page when it renders. |
| **Evidence** | Browser console: `ReferenceError: accentText is not defined`, with the component stack ending in `nav` > `div` > the shell component. |
| **Who is affected** | Users of any gym app (member or admin) whose shell is set to `bottom-tabs`. The default shell is `sidebar`, which is why the gym owner and super admin logins work. |
| **Why it slipped through** | Vite does not check for undefined variables, the project has no ESLint, and the only CI job (visual regression) does not cover the `bottom-tabs` shell. |
| **Second bug found** | `backend/jobs/markOverdueFees.js` has a syntax error (a missing `}`), so the daily overdue-fee cron fails on every run. |

### What is *not* the problem

- Login itself works. The `401` on `/api/auth/me` in the Vercel log is a normal session check.
- The `DEP0169` Node warning is harmless (a dependency uses the old `url.parse()`).
- The `manifest.json` CORS error and `sw.js` "Failed to fetch" come from Vercel's deployment protection on the per-deployment URL (`...-kk9zeeyda-groxo.vercel.app`). They are unrelated to the crash (see Phase 4).

---

## 2. Phase 0: Stop the bleeding (about 5 minutes, no deploy)

- [ ] In the super admin panel, switch the affected gym's **member app shell** from `bottom-tabs` to `sidebar` or `top-bar`.
- [ ] Confirm a customer can now log in and see the dashboard.
- [ ] If any gym owner's **admin app** is also set to `bottom-tabs`, switch that too.

Customers can use their accounts again immediately. Do this before anything else.

---

## 3. Phase 1: Hotfix (about 30 minutes)

### 3.1 Steps

- [ ] Create a branch: `git checkout -b hotfix/bottom-tab-shell`
- [ ] Apply **Fix A** and **Fix B** below.
- [ ] Verify locally (see 3.2).
- [ ] Open a PR, merge to `main`, and let Vercel deploy.
- [ ] Verify in production (see 3.3).

### 3.2 The two fixes

**Fix A: `frontend/src/layouts/BottomTabShell.jsx`**

The component already gets `colorStyle` from `useAccentStyles()`. Use it the same way `TopBarShell` does:

```diff
@@ -136,9 +136,10 @@ export default function BottomTabShell({ navItems, accent = 'ember', roleLabel }
             end={item.end}
             className={({ isActive }) =>
               `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
-                isActive ? `${accentText} font-bold` : 'text-steel hover:text-ink'
+                isActive ? 'font-bold' : 'text-steel hover:text-ink'
               }`
             }
+            style={({ isActive }) => (isActive ? colorStyle : {})}
           >
```

**Fix B: `backend/jobs/markOverdueFees.js`**

The first `for (const fee of overdueFees) {` loop is never closed. Add one closing brace after the email block:

```diff
@@ -69,6 +69,7 @@ async function markOverdueFees() {
           console.error(`[overdue-cron] Failed to email overdue notice to ${recipientEmail}:`, mailErr.message);
         }
       }
+    }
   }
 
   // Also scan unpaid GymBillingFee (platform fees for gym owners)
```

### 3.3 Verification checklist

**Locally, before merging**

- [ ] `node --check backend/jobs/markOverdueFees.js` prints nothing (no error).
- [ ] `npm --prefix frontend run build` succeeds.
- [ ] Run the app and log in as a **customer** with the member shell set to each of the three shells: `sidebar`, `top-bar`, `bottom-tabs`. All three must load the dashboard.
- [ ] Repeat for the **gym owner** app on `bottom-tabs`.
- [ ] Tap through several tabs and the "More" button on `bottom-tabs`. The active tab should be highlighted in the accent colour.

**In production, after deploy** (use your **production domain**, not the `...-kk9zeeyda-groxo` deployment URL)

- [ ] Set the member shell back to `bottom-tabs` and confirm the customer dashboard renders.
- [ ] Trigger the cron and expect `"success": true`:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/overdue
  ```
- [ ] Check Vercel runtime logs for errors from `/api/cron/overdue`.
- [ ] Open the browser console as a customer and confirm there is no `[ErrorBoundary]` message.

### 3.4 Rollback

If anything goes wrong: use Vercel's **Instant Rollback** to the previous deployment, then set the member shell back to `sidebar` (Phase 0).

---

## 4. Phase 2: Catch this kind of bug before deploy (same week, 2 to 3 hours)

Right now the only CI job is visual regression (`.github/workflows/visual.yml`). It did not catch a crash in a whole layout. Both bugs above would have failed a basic lint or syntax check.

### 4.1 Add ESLint to the frontend

Install (the `--legacy-peer-deps` flag avoids a peer dependency conflict):

```bash
cd frontend
npm i -D --legacy-peer-deps eslint@9 eslint-plugin-react eslint-plugin-react-hooks globals
```

Add the script to `frontend/package.json`:

```json
"lint": "eslint ."
```

Create `frontend/eslint.config.js`. This config was tested: it reports `'accentText' is not defined` on the original file and passes on the fixed one (the remaining output is only `exhaustive-deps` warnings, which your code already references in `eslint-disable` comments):

```js
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**'] },
  {
    files: ['src/**/*.{js,jsx}', 'e2e/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'no-undef': 'error', // the rule that would have caught `accentText`
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Node-side files: tests and e2e specs may use Node globals (Buffer, process, ...)
    files: ['e2e/**/*.{js,jsx}', 'src/**/__tests__/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
];
```

### 4.2 Add a general CI workflow

Create `.github/workflows/ci.yml`. I checked that the existing tests pass without any environment setup (backend: 142 passing, frontend: 51 passing), so these steps should work as written:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      # Fails on syntax errors like the one in markOverdueFees.js
      - name: Syntax check all backend and api files
        working-directory: .
        run: find backend api -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check
      - run: npm test
```

Then mark both jobs as **required checks** in the repository's branch protection settings for `main`.

### 4.3 Add a shell smoke test

The existing Playwright visual tests did not catch this. Add a spec (for example `frontend/e2e/shells.spec.ts`) that:

- [ ] Logs in as a member and as a gym admin.
- [ ] Runs once for each shell: `sidebar`, `top-bar`, `bottom-tabs`.
- [ ] Asserts the dashboard heading is visible.
- [ ] Fails the test on any `console.error` or on any message starting with `[ErrorBoundary]`.

A useful helper for the last point:

```js
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.text().includes('[ErrorBoundary]')) errors.push(msg.text());
});
// ...at the end of the test:
expect(errors).toEqual([]);
```

---

## 5. Phase 3: Make crashes survivable (next sprint, 3 to 4 hours)

Today one thrown error anywhere blanks the whole app, because there is a single top-level `ErrorBoundary` in `main.jsx`. These three changes limit the damage from future bugs.

### 5.1 Per-block boundaries

In `DashboardRenderer`, wrap each block so one bad block cannot take down the whole dashboard.

Create `frontend/src/components/BlockBoundary.jsx`:

```jsx
import React from 'react';

export default class BlockBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[BlockBoundary] block "${this.props.name}" failed:`, error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-4 text-sm text-steel">
          This section is temporarily unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}
```

Then, where blocks are rendered in `DashboardRenderer.jsx`:

```jsx
<BlockBoundary key={id} name={id}>
  <Component />
</BlockBoundary>
```

### 5.2 Shell fallback

Wrap the selected shell in a boundary that falls back to `SidebarShell` if the chosen shell throws. A bad layout choice then degrades the layout instead of locking users out. In `DashboardShell.jsx`, where `Shell = SHELLS[settings.shell] ?? SidebarShell` is chosen, render:

```jsx
<ShellBoundary fallback={<SidebarShell {...shellProps} />}>
  <Shell {...shellProps} />
</ShellBoundary>
```

`ShellBoundary` is the same pattern as `BlockBoundary`, but it renders its `fallback` prop instead of the message.

### 5.3 Production error logging

`ErrorBoundary.jsx` only logs to the console. Wire `componentDidCatch` to an error-reporting service (for example Sentry) so you see crashes without asking users for console logs. As a minimum, also show the error message (not the stack) on the error screen for admins.

---

## 6. Phase 4: Related small fixes (1 to 2 hours, bundle with Phase 2 or 3)

### 6.1 `AuthContext.jsx`: two fragile spots

Guard the stored-user parse so a corrupted value cannot crash every page load:

```js
const [user, setUser] = useState(() => {
  try {
    const raw = localStorage.getItem('gym_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('gym_user');
    return null;
  }
});
```

In `refreshMe`, only log the user out on a real `401`, not on any network or server error:

```js
} catch (err) {
  if (err.response?.status === 401) {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    localStorage.removeItem('gym_refresh_token');
    setUser(null);
  }
}
```

### 6.2 `public/sw.js`: unhandled fetch errors

The static-asset branch has no `.catch`, which produced the `Uncaught (in promise) TypeError: Failed to fetch` at line 57. Return the cached copy or a clean error response:

```js
return fetch(event.request)
  .then((networkResponse) => {
    /* ...existing caching logic... */
    return networkResponse;
  })
  .catch(() => cachedResponse || Response.error());
```

### 6.3 Member data guards

In the member dashboard data provider, make sure API results are arrays before storing them, so an unexpected response shape cannot crash `CoachingSessionsBlock`:

```js
setWeightLogs(Array.isArray(weightRes.data) ? weightRes.data : []);
setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
```

### 6.4 Vercel deployment protection

The `...-kk9zeeyda-groxo.vercel.app` URL is a per-deployment URL protected by Vercel's login. The browser fetches `manifest.json` without login cookies, so Vercel redirects it to its login page and the browser blocks it. Either:

- test on your **production domain**, or
- turn off deployment protection for previews, or
- keep protection and add `crossorigin="use-credentials"` to the manifest link in `frontend/index.html`.

### 6.5 Optional cleanup found during analysis

- The payment receipt notification hardcodes a `$` sign and a fallback gym name of `'Ironline Gym'`. Use per-gym currency and branding.
- The Stripe webhook's "already paid" check is read-then-write. Use an atomic `findOneAndUpdate({ _id, status: { $ne: 'paid' } })` to avoid duplicate emails if Stripe delivers an event twice.
- Confirm Stripe signature verification exists (I could not find a `constructEvent` call in the graph; it may live in `utils/stripe.js`).

---

## 7. Order and effort

| Phase | Effort | What it gives you |
|---|---|---|
| 0: Switch shell in super admin | 5 min | Customers unblocked now |
| 1: Hotfix (Fix A + Fix B) | 30 min | Root cause and broken cron fixed |
| 2: ESLint, CI, shell smoke test | 2 to 3 hours | Stops this class of bug reaching production |
| 3: Block/shell boundaries, error logging | 3 to 4 hours | Limits the damage from future bugs |
| 4: Auth, service worker, guards, Vercel | 1 to 2 hours | Removes remaining fragile spots |

---

## 8. Definition of done

- [ ] A customer can log in and use their account on all three shells (`sidebar`, `top-bar`, `bottom-tabs`).
- [ ] The overdue cron returns `success: true` and fees are marked overdue with reminders sent.
- [ ] CI fails when a file contains an undefined variable or a syntax error, and both jobs are required checks on `main`.
- [ ] A shell smoke test covers all three shells for member and admin.
- [ ] One failing block or shell no longer blanks the whole app.
- [ ] Render errors are reported somewhere you can see them without asking users.

---

## 9. Appendix: evidence

**Browser console (production, customer login):**

```
ReferenceError: accentText is not defined
    at className (index-CPzRGOZa.js:76:22721)
    ...
    at nav
    at div
    at n1 (...)   <- BottomTabShell
```

**Why `accentText` is undefined:** `shellParts.jsx` defines `accentText` inside the older `useAccentClasses()` helper. `BottomTabShell.jsx` only imports `useAccentStyles()`, which returns `bgStyle`, `activeBgStyle`, `iconBgStyle` and `colorStyle`. There is no `accentText` in scope at line 139.

**Second bug:** `node --check backend/jobs/markOverdueFees.js` reports `SyntaxError: Unexpected end of input`. The job is required by `api/cron/overdue.js`, which Vercel runs daily (`0 0 * * *` in `vercel.json`).

**Limits of this analysis:** the ESLint scan and syntax check ran against a fresh clone of `main` at commit `ba25ff4`. The claim that the affected customer's gym uses the `bottom-tabs` shell is an inference from the component stack; confirm it in the super admin panel.
