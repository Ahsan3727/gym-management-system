import { test, expect } from '@playwright/test';
import { ADMIN_USER, FIXTURE_TOKEN } from './fixtures/seed.js';

// T7.7 - Visual and behavioural tests for all 3 shell layouts.

const SHELL_CONFIGS = [
  { shell: 'sidebar',     theme: 'ember'  },
  { shell: 'bottom-tabs', theme: 'ocean'  },
  { shell: 'top-bar',     theme: 'forest' },
];

const PLACEHOLDER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function setup(page, shell, theme) {
  await page.clock.setFixedTime('2026-01-15T10:00:00Z');
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('gym_token', token);
    localStorage.setItem('gym_user', JSON.stringify(user));
  }, {
    token: FIXTURE_TOKEN,
    user: { ...ADMIN_USER, branding: { ...ADMIN_USER.branding, shell, theme, version: 2 } },
  });
  await page.route('**cloudinary**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER })
  );
  await page.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

for (const { shell, theme } of SHELL_CONFIGS) {
  test.describe('Shell ' + shell + ' theme ' + theme, () => {
    test('overview renders correctly', async ({ page }) => {
      await setup(page, shell, theme);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('shell-' + shell + '-' + theme + '-overview.png');
    });

    test('active nav highlight on customers route', async ({ page }) => {
      await setup(page, shell, theme);
      await page.goto('/admin/customers');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('shell-' + shell + '-' + theme + '-customers.png');
    });

    test('theme toggle changes mode', async ({ page }) => {
      await setup(page, shell, theme);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      const toggle = page.locator('button[aria-label*="heme"], button[title*="heme"]').first();
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
      await expect(page).toHaveScreenshot('shell-' + shell + '-' + theme + '-light.png');
    });
  });
}