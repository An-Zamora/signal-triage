// The scoring model (§7). Pure. This — and the fit control in the UI — is where
// the actual argument of the tool lives, so it is the most heavily tested part
// alongside classify.
//
//   priority(theme) = reach × avgSeverity × fit
//
// reach       — distinct senders (one person emailing five times is one person)
// avgSeverity — mean per-message severity weight (blocked 3, friction 2, wish 1)
// fit         — human judgment, 0–1.5, default 1.0. fit = 0 parks the theme.

import type { ScoredTheme, SortMode, ThemeGroup } from './types';
import { SEVERITY_WEIGHT } from './types';

export const DEFAULT_FIT = 1.0;
export const MIN_FIT = 0;
export const MAX_FIT = 1.5;

/** Fit is user input, so clamp it and reject non-finite values defensively. */
export function clampFit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FIT;
  return Math.min(MAX_FIT, Math.max(MIN_FIT, value));
}

/**
 * Distinct senders. Messages with no attributed sender each count as their own
 * distinct anonymous sender, so an unattributed batch reads reach == volume.
 */
function distinctSenders(group: ThemeGroup): number {
  const seen = new Set<string>();
  for (const m of group.messages) {
    seen.add(m.sender ?? `__anon_${m.id}`);
  }
  return seen.size;
}

function meanSeverity(group: ThemeGroup): number {
  if (group.messages.length === 0) return 0;
  const total = group.messages.reduce((sum, m) => sum + SEVERITY_WEIGHT[m.severity], 0);
  return total / group.messages.length;
}

export function scoreThemes(
  groups: readonly ThemeGroup[],
  fitValues: Readonly<Record<string, number>>,
): ScoredTheme[] {
  return groups.map((group) => {
    const reach = distinctSenders(group);
    const avgSeverity = meanSeverity(group);
    const fit = clampFit(fitValues[group.themeId] ?? DEFAULT_FIT);
    return {
      themeId: group.themeId,
      label: group.label,
      messages: group.messages,
      volume: group.messages.length,
      reach,
      avgSeverity,
      fit,
      priority: reach * avgSeverity * fit,
    };
  });
}

/** Deterministic tie-breaker so ordering never depends on input order. */
function byLabel(a: ScoredTheme, b: ScoredTheme): number {
  return a.themeId < b.themeId ? -1 : a.themeId > b.themeId ? 1 : 0;
}

/**
 * Rank scored themes for the active sort mode. Returns a new array; does not
 * mutate the input.
 *
 * - "volume": loudest first (message count). This is the naive ranking the tool
 *   exists to argue against.
 * - "priority": reach × avgSeverity × fit, highest first. Themes with fit == 0
 *   ("not doing it") are removed from the ranking but kept at the end so they
 *   stay visible in the list.
 */
export function rankThemes(themes: readonly ScoredTheme[], mode: SortMode): ScoredTheme[] {
  const copy = [...themes];
  if (mode === 'volume') {
    return copy.sort(
      (a, b) => b.volume - a.volume || b.priority - a.priority || byLabel(a, b),
    );
  }

  const ranked = copy.filter((t) => t.fit > 0);
  const parked = copy.filter((t) => t.fit === 0);
  ranked.sort(
    (a, b) =>
      b.priority - a.priority ||
      b.reach - a.reach ||
      b.volume - a.volume ||
      byLabel(a, b),
  );
  parked.sort((a, b) => b.volume - a.volume || byLabel(a, b));
  return [...ranked, ...parked];
}
