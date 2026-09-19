import { test, expect } from '@playwright/test';
import {
  CUSTOMER_USER, ADMIN_USER, TRAINER_USER, SUPERADMIN_USER, FIXTURE_TOKEN,
} from './fixtures/seed.js';

async function seedAuth(page, user) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('gym_token', token);
    localStorage.setItem('gym_user', JSON.stringify(user));
  }, { token: FIXTURE_TOKEN, user });
}

async function freezeTime(page) {
  await page.clock.setFixedTime('2026-01-15T10:00:00Z');
}

async function stubImages(page) {
  const placeholder = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.route('**cloudinary**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: placeholder })
  );
}

async function stubApi(page) {
  await page.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

async function screenshotAll(page, routes, prefix) {
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const slug = route.replace(/\//g, '_').replace(/^_/, '') || 'index';
    await expect(page).toHaveScreenshot(prefix + '--' + slug + '.png');
  }
}

const CUSTOMER_ROUTES = [
  '/customer', '/customer/checkin', '/customer/workouts', '/customer/diet',
  '/customer/weight', '/customer/analytics', '/customer/notifications', '/customer/account',
];
const ADMIN_ROUTES = [
  '/admin', '/admin/attendance', '/admin/customers', '/admin/trainers',
  '/admin/branches', '/admin/fees', '/admin/billing', '/admin/profile',
];
const TRAINER_ROUTES = ['/trainer', '/trainer/clients', '/trainer/schedule'];
const SUPERADMIN_ROUTES = [
  '/superadmin', '/superadmin/admins', '/superadmin/billing',
  '/superadmin/audit-log', '/superadmin/settings',
];

test.describe('Login page', () => {
  test('dark mode', async ({ page }) => {
    await freezeTime(page); await stubImages(page); await stubApi(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login--dark.png');
  });
  test('light mode', async ({ page }) => {
    await freezeTime(page); await stubImages(page); await stubApi(page);
    await page.addInitScript(() => {
      localStorage.setItem('ironline_theme', 'light');
      localStorage.setItem('ironline_theme_explicit', '1');
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login--light.png');
  });
});

test.describe('Customer - dark', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, CUSTOMER_USER);
    await stubImages(page); await stubApi(page);
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, CUSTOMER_ROUTES, 'customer-dark'); });
});

test.describe('Customer - light', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, CUSTOMER_USER);
    await stubImages(page); await stubApi(page);
    await page.addInitScript(() => {
      localStorage.setItem('ironline_theme', 'light');
      localStorage.setItem('ironline_theme_explicit', '1');
    });
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, CUSTOMER_ROUTES, 'customer-light'); });
});

test.describe('Admin - dark', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, ADMIN_USER);
    await stubImages(page); await stubApi(page);
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, ADMIN_ROUTES, 'admin-dark'); });
});

test.describe('Admin - light', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, ADMIN_USER);
    await stubImages(page); await stubApi(page);
    await page.addInitScript(() => {
      localStorage.setItem('ironline_theme', 'light');
      localStorage.setItem('ironline_theme_explicit', '1');
    });
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, ADMIN_ROUTES, 'admin-light'); });
});

test.describe('Trainer - dark', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, TRAINER_USER);
    await stubImages(page); await stubApi(page);
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, TRAINER_ROUTES, 'trainer-dark'); });
});

test.describe('SuperAdmin - dark', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page); await seedAuth(page, SUPERADMIN_USER);
    await stubImages(page); await stubApi(page);
  });
  test('all routes', async ({ page }) => { await screenshotAll(page, SUPERADMIN_ROUTES, 'superadmin-dark'); });
});