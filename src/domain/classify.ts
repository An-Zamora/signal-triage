// Deterministic classification (ADR-002). Pure functions, no side effects.
// message list -> classified messages -> groups. Inspectable and testable.

import type {
  ClassifiedMessage,
  Lexicon,
  Message,
  Severity,
  ThemeGroup,
} from './types';
import { UNSORTED_ID, UNSORTED_LABEL } from './lexicon';

/**
 * Parse pasted text into messages.
 *
 * Rule (documented in the UI): one message per non-empty line. To attribute a
 * line to a sender — which sharpens the reach signal — prefix it with an
 * identifier and " | ", e.g.  `sarah@clinic.com | the export button is broken`.
 * Lines without a sender are each treated as a distinct anonymous sender.
 */
export function parseMessages(raw: string): Message[] {
  const messages: Message[] = [];
  let id = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    const sep = trimmed.indexOf(' | ');
    let sender: string | null = null;
    let text = trimmed;
    if (sep !== -1) {
      sender = trimmed.slice(0, sep).trim() || null;
      text = trimmed.slice(sep + 3).trim();
    }
    if (text === '') continue;

    messages.push({ id: id++, text, sender });
  }
  return messages;
}

/** How many of a theme's keywords appear in the text (as substrings). */
function themeHits(lowerText: string, keywords: readonly string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (lowerText.includes(kw)) hits++;
  }
  return hits;
}

/**
 * Assign a theme id. The theme with the most keyword hits wins; ties break
 * toward the theme that appears first in the lexicon (stable). No hits at all
 * lands in `unsorted` rather than being forced into a bucket.
 */
export function classifyTheme(text: string, lexicon: Lexicon): string {
  const lower = text.toLowerCase();
  let bestId = UNSORTED_ID;
  let bestHits = 0;
  for (const theme of lexicon.themes) {
    const hits = themeHits(lower, theme.keywords);
    if (hits > bestHits) {
      bestHits = hits;
      bestId = theme.id;
    }
  }
  return bestId;
}

/**
 * Infer severity from wording. Checked strongest-first: any "blocked" phrase
 * makes it blocked, else friction, else wish. A message with no severity signal
 * defaults to `friction` (the neutral middle).
 *
 * Known weakness (documented in the README): a polite report of a real outage
 * can score below an irritated complaint about a font. Severity-from-wording is
 * a heuristic, not a measurement.
 */
export function classifySeverity(text: string, lexicon: Lexicon): Severity {
  const lower = text.toLowerCase();
  const has = (phrases: readonly string[]) => phrases.some((p) => lower.includes(p));
  if (has(lexicon.severity.blocked)) return 'blocked';
  if (has(lexicon.severity.wish) && !has(lexicon.severity.friction)) return 'wish';
  if (has(lexicon.severity.friction)) return 'friction';
  if (has(lexicon.severity.wish)) return 'wish';
  return 'friction';
}

export function classifyMessage(msg: Message, lexicon: Lexicon): ClassifiedMessage {
  return {
    ...msg,
    themeId: classifyTheme(msg.text, lexicon),
    severity: classifySeverity(msg.text, lexicon),
  };
}

/**
 * Classify a batch and group it by theme. Only themes with at least one message
 * appear. `unsorted` (if present) is always last.
 */
export function groupByTheme(messages: readonly Message[], lexicon: Lexicon): ThemeGroup[] {
  const classified = messages.map((m) => classifyMessage(m, lexicon));

  const labelOf = new Map<string, string>(lexicon.themes.map((t) => [t.id, t.label]));
  labelOf.set(UNSORTED_ID, UNSORTED_LABEL);

  const buckets = new Map<string, ClassifiedMessage[]>();
  for (const m of classified) {
    const bucket = buckets.get(m.themeId);
    if (bucket) bucket.push(m);
    else buckets.set(m.themeId, [m]);
  }

  // Stable ordering: lexicon order, then unsorted last.
  const order = [...lexicon.themes.map((t) => t.id), UNSORTED_ID];
  const groups: ThemeGroup[] = [];
  for (const id of order) {
    const msgs = buckets.get(id);
    if (msgs && msgs.length > 0) {
      groups.push({ themeId: id, label: labelOf.get(id) ?? id, messages: msgs });
    }
  }
  return groups;
}
