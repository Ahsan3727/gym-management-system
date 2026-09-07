import { lazy } from 'react';

/**
 * FIX (blank-page bug): every route in App.jsx is loaded with React.lazy(),
 * which fetches a separate JS chunk the first time a route is visited.
 * Those chunk files are named with a content hash (e.g. Customers-a1b2c3.js)
 * that changes on every deploy. If a user has an old tab open — or an old
 * cached index.html — from BEFORE a new deploy, their browser still has the
 * OLD chunk URLs. When they click into a route whose old chunk no longer
 * exists on the server (Vercel only keeps the latest build's files), the
 * dynamic import() rejects with "Failed to fetch dynamically imported
 * module" / ChunkLoadError. React.lazy has no built-in recovery for this,
 * and with no error boundary around it (now fixed, see ErrorBoundary.jsx)
 * that unhandled rejection used to just leave the page blank forever.
 *
 * This wraps every lazy() import: if the import fails, it reloads the page
 * ONCE (a fresh load always fetches the current index.html + current chunk
 * hashes, which fixes it). A sessionStorage flag stops a real, persistent
 * network failure from reload-looping the tab forever.
 */
export function lazyWithReload(importFn, chunkName) {
  return lazy(async () => {
    const storageKey = `chunk-reload:${chunkName}`;
    try {
      const mod = await importFn();
      // Successful load — clear any stale retry flag for this chunk.
      sessionStorage.removeItem(storageKey);
      return mod;
    } catch (error) {
      const alreadyRetried = sessionStorage.getItem(storageKey);
      if (!alreadyRetried) {
        sessionStorage.setItem(storageKey, '1');
        window.location.reload();
        // Return a never-resolving promise: the reload is already in
        // flight, so there's no meaningful component to render.
        return new Promise(() => {});
      }
      // Already retried once and it's still failing — this is a real
      // network/server problem, not a stale-chunk problem. Let it
      // surface to the ErrorBoundary instead of reload-looping forever.
      throw error;
    }
  });
}
