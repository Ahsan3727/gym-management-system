import React from 'react';

/**
 * Icon set ported from apex-elite.html's <symbol> sprite. Mount once
 * (App.jsx does this) then reference anywhere with:
 *   <svg className="icon"><use href="#i-home" /></svg>
 *
 * i-sun / i-moon were added here for the theme toggle — the original
 * mockup was dark-only and didn't need a "switch to dark" icon.
 */
export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h4v-5.5h2V20h4a1 1 0 0 0 1-1v-9" /></symbol>
        <symbol id="i-dumbbell" viewBox="0 0 24 24"><path d="M4 9v6M2.5 10.5v3M20 9v6M21.5 10.5v3" /><rect x="6" y="7.5" width="3" height="9" rx="1" /><rect x="15" y="7.5" width="3" height="9" rx="1" /><path d="M9 12h6" /></symbol>
        <symbol id="i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.3l2.3 2.3 4.7-5" /></symbol>
        <symbol id="i-book-open" viewBox="0 0 24 24"><path d="M12 6.2c-1.6-1.1-4-1.7-6.3-1.7-1 0-1.7.1-1.7.1v13.4s1-.2 2-.2c2 0 4.3.6 6 1.7 1.7-1.1 4-1.7 6-1.7 1 0 2 .2 2 .2V4.6s-.7-.1-1.7-.1c-2.3 0-4.7.6-6.3 1.7Z" /><path d="M12 6.2v13.5" /></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.3" r="3.3" /><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path d="M7 4.7v14.6a1 1 0 0 0 1.5.9l12-7.3a1 1 0 0 0 0-1.8l-12-7.3A1 1 0 0 0 7 4.7Z" fill="currentColor" stroke="none" /></symbol>
        <symbol id="i-chevron-r" viewBox="0 0 24 24"><path d="M9 5.5 15.5 12 9 18.5" /></symbol>
        <symbol id="i-arrow-r" viewBox="0 0 24 24"><path d="M4.5 12h15M13.5 5.5 20 12l-6.5 6.5" /></symbol>
        <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.4-4.6-9.8-9.4C.6 6.7 3 3.4 6.6 3.4c2 0 3.7 1 5.4 3 1.7-2 3.4-3 5.4-3 3.6 0 6 3.3 4.4 7.2C19.4 15.4 12 20 12 20Z" /></symbol>
        <symbol id="i-pencil" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M14.8 8.2 9 14l-.8 2.8L11 16l5.8-5.8-2-2Z" /></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3.5 19 6v6c0 4.6-3 7.6-7 8.5-4-.9-7-3.9-7-8.5V6l7-2.5Z" /><path d="M9 12l2 2 4-4.3" /></symbol>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9" rx="2" /><path d="M8.5 10.5V7.6a3.5 3.5 0 0 1 7 0v2.9" /></symbol>
        <symbol id="i-cloud" viewBox="0 0 24 24"><path d="M6.8 17.5a3.8 3.8 0 0 1-.6-7.5 5 5 0 0 1 9.6-1.6 4.2 4.2 0 0 1-.5 9.1H6.8Z" /></symbol>
        <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14" /></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" /></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></symbol>
        <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 21.5c-4 0-6.5-2.6-6.5-6.2 0-3 1.9-4.7 2.8-7 .5 1.6 1.6 2.5 2.6 2.5-.3-2.9.6-5.3 3-7.3.2 2.7 1.1 4 2.6 5.7 1.7 1.9 2.5 3.6 2.5 6.1 0 3.6-2.6 6.2-6.5 6.2Z" /></symbol>
        <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 3 5 13.2h5.3L11 21l8-10.2h-5.3L13 3Z" /></symbol>
        <symbol id="i-trend" viewBox="0 0 24 24"><path d="M4 16.5 9.5 11l4 3.5L21 6.5" /><path d="M15.5 6.5H21v5.5" /></symbol>
        <symbol id="i-dots" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" /></symbol>
        <symbol id="i-runner" viewBox="0 0 24 24"><circle cx="14.5" cy="5" r="1.9" /><path d="M9 20l2.6-4.3-1.8-3 2-3.6 3 2 2.8-1.3M11.5 12.7 7 14.5M13.4 16.1 17 18.6" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></symbol>
        <symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3.5S6 10.8 6 14.8a6 6 0 0 0 12 0c0-4-6-11.3-6-11.3Z" /></symbol>
        <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v3M15.5 3.5v3" /></symbol>
        <symbol id="i-note" viewBox="0 0 24 24"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M9 10h6M9 13.5h6M9 17h3.5" /></symbol>

        {/* Added in Phase 1 for DashboardShell nav icons */}
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5l1.5-2Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></symbol>
        <symbol id="i-building" viewBox="0 0 24 24"><rect x="4.5" y="3.5" width="10" height="17" rx="1.2" /><path d="M14.5 9h4.5a1 1 0 0 1 1 1v10.5h-5.5" /><path d="M7.5 7h2M7.5 10.5h2M7.5 14h2M7.5 17.5h2" /></symbol>
        <symbol id="i-card" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10.5h17" /><path d="M7 14.5h4" /></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24"><path d="M11.5 4H6a1.5 1.5 0 0 0-1.5 1.5v5.5L13 19.5a1.5 1.5 0 0 0 2.1 0l4.4-4.4a1.5 1.5 0 0 0 0-2.1L11.5 4Z" /><circle cx="8.3" cy="8.3" r="1.3" fill="currentColor" stroke="none" /></symbol>
        <symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="3.5" y="8" width="17" height="11" rx="2" /><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /><path d="M3.5 13.5h17" /></symbol>
        <symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="5.5" y="4.5" width="13" height="16" rx="2" /><path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" /></symbol>
        <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 12h3M9 12h11M4 17h13M20 17h.01" /><circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="none" /><circle cx="7" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="16" cy="17" r="1.6" fill="currentColor" stroke="none" /></symbol>

        {/* Added in Phase 3 — replaces DashboardShell's ad-hoc mobile-header hamburger SVG (§7) */}
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></symbol>
      </defs>
    </svg>
  );
}
