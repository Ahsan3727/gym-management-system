// Seeded fixture data for deterministic Playwright screenshots.
// All data is fixed so screenshots are reproducible across runs and machines.

export const FIXTURE_TOKEN = 'fixture-jwt-token';

const BASE_BRANDING = {
  theme: 'ember', shell: 'sidebar', dashboard: 'classic',
  surface: 'accent', defaultMode: 'dark', version: 1,
};

export const CUSTOMER_USER = {
  id: 'fixture-cust-001',
  username: 'fixture_member',
  name: 'Alex Fixture',
  role: 'customer',
  gymSlug: 'fixture-gym',
  branding: { ...BASE_BRANDING },
};

export const ADMIN_USER = {
  id: 'fixture-admin-001',
  username: 'fixture_admin',
  name: 'Sam Fixture',
  role: 'admin',
  gymSlug: 'fixture-gym',
  gymName: 'Fixture Gym',
  branding: { ...BASE_BRANDING },
};

export const TRAINER_USER = {
  id: 'fixture-trainer-001',
  username: 'fixture_trainer',
  name: 'Jo Fixture',
  role: 'trainer',
  gymSlug: 'fixture-gym',
  branding: { ...BASE_BRANDING },
};

export const SUPERADMIN_USER = {
  id: 'fixture-sa-001',
  username: 'fixture_sa',
  name: 'SuperAdmin Fixture',
  role: 'super_admin',
  branding: null,
};
