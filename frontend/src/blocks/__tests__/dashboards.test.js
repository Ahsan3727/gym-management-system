import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, REQUIRED_BLOCKS, resolveDashboardBlocks } from '../dashboards.js';

describe('Dashboard Presets & Required Block Invariants', () => {
  it('guarantees required member blocks are present in every member preset', () => {
    const required = REQUIRED_BLOCKS.member;
    for (const [presetName, blocks] of Object.entries(PRESETS.member)) {
      for (const req of required) {
        assert.ok(
          blocks.includes(req),
          `Required block "${req}" must exist in member preset "${presetName}"`
        );
      }
    }
  });

  it('guarantees required admin blocks are present in every admin preset', () => {
    const required = REQUIRED_BLOCKS.admin;
    for (const [presetName, blocks] of Object.entries(PRESETS.admin)) {
      for (const req of required) {
        assert.ok(
          blocks.includes(req),
          `Required block "${req}" must exist in admin preset "${presetName}"`
        );
      }
    }
  });

  it('resolveDashboardBlocks force-inserts missing required blocks if omitted', () => {
    // Member app must include checkin and membership even if absent in a custom list
    const resolved = resolveDashboardBlocks('member', 'customUnknownPreset');
    assert.ok(resolved.includes('checkin'));
    assert.ok(resolved.includes('membership'));

    const adminResolved = resolveDashboardBlocks('admin', 'compact');
    assert.ok(adminResolved.includes('billingBanner'));
  });
});
