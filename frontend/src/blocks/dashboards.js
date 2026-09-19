/**
 * Dashboard presets and required block enforcement (Decision D6).
 */

export const REQUIRED_BLOCKS = {
  member: ['checkin', 'membership'],
  admin: ['billingBanner'],
};

export const PRESETS = {
  member: {
    classic: [
      'welcome',
      'streak',
      'longestStreak',
      'latestWeight',
      'membership',
      'checkin',
      'sessions',
      'badges',
      'quickActions',
    ],
    focus: [
      'welcome',
      'checkin',
      'membership',
      'streak',
      'longestStreak',
      'latestWeight',
      'sessions',
      'badges',
      'quickActions',
    ],
    compact: [
      'welcome',
      'checkin',
      'streak',
      'membership',
      'latestWeight',
      'quickActions',
    ],
  },
  admin: {
    classic: [
      'header',
      'billingBanner',
      'activeMembers',
      'totalMembers',
      'revenue',
      'pendingRevenue',
      'revenueChart',
      'memberGrowth',
      'planDistribution',
      'announcement',
    ],
    focus: [
      'header',
      'billingBanner',
      'revenue',
      'pendingRevenue',
      'activeMembers',
      'totalMembers',
      'announcement',
      'revenueChart',
      'memberGrowth',
      'planDistribution',
    ],
    compact: [
      'header',
      'billingBanner',
      'activeMembers',
      'revenue',
      'pendingRevenue',
      'totalMembers',
      'announcement',
    ],
  },
};

/**
 * Resolves an ordered list of block IDs for a preset, guaranteeing
 * that all required blocks are included (Decision D6).
 */
export function resolveDashboardBlocks(appType, presetName = 'classic') {
  const normalizedApp = appType === 'memberApp' || appType === 'member' ? 'member' : 'admin';
  const presetsForApp = PRESETS[normalizedApp];
  const list = presetsForApp[presetName] || presetsForApp.classic;

  const required = REQUIRED_BLOCKS[normalizedApp] || [];
  const result = [...list];

  for (const reqBlock of required) {
    if (!result.includes(reqBlock)) {
      result.push(reqBlock);
    }
  }

  return result;
}
