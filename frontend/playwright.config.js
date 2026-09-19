import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/__shots__/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:5173',
    reducedMotion: 'reduce',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide' },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'phone',   use: { viewport: { width: 390,  height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
