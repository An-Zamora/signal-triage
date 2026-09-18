import { describe, expect, it } from 'vitest';
import { DATASETS } from './datasets';
import { groupByTheme, parseMessages } from '../domain/classify';
import { rankThemes, scoreThemes } from '../domain/score';

// The samples exist to make one thing visible: the loudest theme is not the most
// important. These tests pin that in so a future edit to the fixtures can't
// quietly break the demo.
const EXPECTED = {
  saas: { loud: 'cosmetic', critical: 'auth' },
  clinic: { loud: 'portal-ux', critical: 'reminders' },
} as const;

describe('sample datasets demonstrate the volume/priority flip', () => {
  for (const dataset of DATASETS) {
    const expected = EXPECTED[dataset.id as keyof typeof EXPECTED];

    describe(dataset.label, () => {
      const messages = parseMessages(dataset.messages);
      const groups = groupByTheme(messages, dataset.lexicon);
      const scored = scoreThemes(groups, {});
      const byVolume = rankThemes(scored, 'volume').map((t) => t.themeId);
      const byPriority = rankThemes(scored, 'priority').map((t) => t.themeId);

      it('nothing lands in Unsorted-only confusion (loud theme classified)', () => {
        expect(byVolume).toContain(expected.loud);
        expect(byPriority).toContain(expected.critical);
      });

      it('the loud theme is #1 by volume', () => {
        expect(byVolume[0]).toBe(expected.loud);
      });

      it('the critical theme is #1 by priority', () => {
        expect(byPriority[0]).toBe(expected.critical);
      });

      it('the loud theme collapses several places under priority', () => {
        const volumePos = byVolume.indexOf(expected.loud); // 0 (top)
        const priorityPos = byPriority.indexOf(expected.loud);
        expect(priorityPos - volumePos).toBeGreaterThanOrEqual(3);
        // ...and ends up near the very bottom of the ranking.
        expect(priorityPos).toBeGreaterThanOrEqual(byPriority.length - 2);
      });
    });
  }
});
