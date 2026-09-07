import React from 'react';

/**
 * FIX: The app had zero error boundaries anywhere. In React, an error
 * thrown during render (a bad API response shaped differently than
 * expected, a null field the component didn't guard, a third-party lib
 * hiccup, etc.) unmounts the ENTIRE tree above it — with no boundary, that
 * means the whole app, all the way up to <div id="root">. The user is left
 * looking at a blank white page with no message, and the only trace is a
 * stack trace in the browser console they'll never open.
 *
 * This boundary is mounted once, at the very top (see main.jsx), so any
 * render error anywhere in the app is caught here instead of blanking the
 * screen. It shows a real message and a "Reload" button instead of nothing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Centralized place to wire up real error reporting later
    // (Sentry, LogRocket, etc.) if/when this project adds one.
    console.error('[ErrorBoundary] caught a render error:', error, info?.componentStack);
  }

  handleReload = () => {
    // A hard reload (not just resetting state) is deliberate: whatever
    // threw may have left localStorage/context in a half-updated state,
    // and a fresh load is the safest way to recover.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember/15 text-ember">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.93 21h16.14a2 2 0 0 0 1.82-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="mb-1 text-lg font-semibold text-ink">Something went wrong</h1>
            <p className="max-w-sm text-sm text-steel">
              This page hit an unexpected error. Reloading usually fixes it — if it keeps
              happening, please let us know what you were doing.
            </p>
          </div>
          <button onClick={this.handleReload} className="btn-primary">
            Reload page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-xl overflow-auto rounded-xl bg-ink/5 p-4 text-left text-xs text-steel">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
