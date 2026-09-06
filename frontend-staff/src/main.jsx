import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './index.css';

// Per-gym branding (/g/:slug) and the installable-PWA service worker are
// customer-app-only concerns now (see IMPLEMENTATION_PLAN.md Phase 4/5) —
// staff never see a /g/:slug link, and this is a desk console, not
// something staff install as a home-screen app. No TenantProvider, no
// tenant-branding bootstrap, no service worker registration here.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
