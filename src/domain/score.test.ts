import { describe, expect, it } from 'vitest';
import { clampFit, rankThemes, scoreThemes } from './score';
import type { ClassifiedMessage, Severity, ThemeGroup } from './types';

let nextId = 0;
function msg(sender: string | null, severity: Severity): ClassifiedMessage {
  return { id: nextId++, text: 't', sender, themeId: 'x', severity };
}

function group(themeId: string, messages: ClassifiedMessage[]): ThemeGroup {
  return { themeId, label: themeId, messages };
}

describe('clampFit', () => {
  it('clamps to the 0–1.5 range', () => {
    expect(clampFit(-1)).toBe(0);
    expect(clampFit(9)).toBe(1.5);
    expect(clampFit(1.2)).toBe(1.2);
  });

  it('falls back to the default for non-finite input', () => {
    expect(clampFit(NaN)).toBe(1.0);
  });
});

describe('scoreThemes', () => {
  it('counts distinct senders, not messages (the squeaky wheel)', () => {
    // One person sending three messages is reach 1, volume 3.
    const g = group('loud', [
      msg('dana', 'wish'),
      msg('dana', 'wish'),
      msg('dana', 'friction'),
    ]);
    const [scored] = scoreThemes([g], {});
    expect(scored.volume).toBe(3);
    expect(scored.reach).toBe(1);
  });

  it('treats unattributed messages as distinct anonymous senders', () => {
    const g = group('anon', [msg(null, 'friction'), msg(null, 'friction')]);
    const [scored] = scoreThemes([g], {});
    expect(scored.reach).toBe(2);
  });

  it('averages severity and computes reach × avgSeverity × fit', () => {
    const g = group('t', [msg('a', 'blocked'), msg('b', 'friction')]); // (3+2)/2 = 2.5
    const [scored] = scoreThemes([g], { t: 1.2 });
    expect(scored.avgSeverity).toBe(2.5);
    expect(scored.reach).toBe(2);
    expect(scored.priority).toBeCloseTo(2 * 2.5 * 1.2);
  });

  it('defaults fit to 1.0 when none is set', () => {
    const g = group('t', [msg('a', 'friction')]);
    const [scored] = scoreThemes([g], {});
    expect(scored.fit).toBe(1.0);
  });
});

describe('rankThemes', () => {
  // A loud, low-value theme vs. a quiet, high-value one — the core scenario.
  const loud = group('loud', [
    msg('solo', 'wish'),
    msg('solo', 'wish'),
    msg('solo', 'wish'),
    msg('solo', 'wish'),
    msg('solo', 'wish'),
  ]); // volume 5, reach 1, avgSev 1  -> priority 1
  const important = group('important', [
    msg('a', 'blocked'),
    msg('b', 'blocked'),
  ]); // volume 2, reach 2, avgSev 3  -> priority 6

  it('ranks by volume in volume mode (loudest first)', () => {
    const scored = scoreThemes([important, loud], {});
    const order = rankThemes(scored, 'volume').map((t) => t.themeId);
    expect(order).toEqual(['loud', 'important']);
  });

  it('flips the ranking in priority mode', () => {
    const scored = scoreThemes([important, loud], {});
    const order = rankThemes(scored, 'priority').map((t) => t.themeId);
    expect(order).toEqual(['important', 'loud']);
  });

  it('parks a theme with fit 0 at the end of the priority ranking but keeps it visible', () => {
    const scored = scoreThemes([important, loud], { important: 0 });
    const ranked = rankThemes(scored, 'priority');
    expect(ranked.map((t) => t.themeId)).toEqual(['loud', 'important']);
    // Still present in the list — not dropped.
    expect(ranked).toHaveLength(2);
    expect(ranked.find((t) => t.themeId === 'important')?.priority).toBe(0);
  });

  it('breaks priority ties deterministically (reach, then volume, then id)', () => {
    // Both priority 6, but different reach.
    const highReach = group('bbb', [msg('a', 'friction'), msg('b', 'friction'), msg('c', 'friction')]); // reach 3, avg 2 -> 6
    const lowReach = group('aaa', [msg('x', 'blocked'), msg('y', 'blocked')]); // reach 2, avg 3 -> 6
    const scored = scoreThemes([lowReach, highReach], {});
    const order = rankThemes(scored, 'priority').map((t) => t.themeId);
    expect(order).toEqual(['bbb', 'aaa']); // higher reach wins the tie
  });

  it('does not mutate the input array', () => {
    const scored = scoreThemes([important, loud], {});
    const before = scored.map((t) => t.themeId);
    rankThemes(scored, 'priority');
    expect(scored.map((t) => t.themeId)).toEqual(before);
  });
});
