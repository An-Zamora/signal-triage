// Domain types. This module is pure data — no DOM, no network, no React.
// Everything downstream (classify, score) is a pure function over these.

/** Severity tiers, inferred from wording. See lexicon.ts for the patterns. */
export type Severity = 'blocked' | 'friction' | 'wish';

/** Numeric weight per severity tier, used by the scoring model (§7). */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocked: 3,
  friction: 2,
  wish: 1,
};

/** A single parsed support message. */
export interface Message {
  /** Stable index in the parsed batch, used as a React key and for de-dup. */
  readonly id: number;
  /** The message text as pasted (never mutated). */
  readonly text: string;
  /**
   * Who sent it. Reach counts *distinct senders*, so attribution matters.
   * `null` means the batch gave us no sender; the parser then treats each
   * unattributed message as its own distinct anonymous sender.
   */
  readonly sender: string | null;
}

/** One theme definition from the (user-editable) lexicon. */
export interface ThemeDef {
  /** Stable slug, e.g. "billing". Used as the theme id everywhere. */
  readonly id: string;
  /** Human label shown in the UI. */
  readonly label: string;
  /** Lowercase keywords/phrases; a message matches on any substring hit. */
  readonly keywords: readonly string[];
}

/** Severity is matched the same way: lowercase phrases per tier. */
export interface SeverityLexicon {
  readonly blocked: readonly string[];
  readonly friction: readonly string[];
  readonly wish: readonly string[];
}

/** The full, editable rule set that drives classification. */
export interface Lexicon {
  readonly themes: readonly ThemeDef[];
  readonly severity: SeverityLexicon;
}

/** A message after classification: which theme, which severity. */
export interface ClassifiedMessage extends Message {
  readonly themeId: string;
  readonly severity: Severity;
}

/** Messages grouped by theme, before scoring. */
export interface ThemeGroup {
  readonly themeId: string;
  readonly label: string;
  readonly messages: readonly ClassifiedMessage[];
}

/** A theme with its computed metrics and the user-set fit value. */
export interface ScoredTheme {
  readonly themeId: string;
  readonly label: string;
  readonly messages: readonly ClassifiedMessage[];
  /** Number of messages in the group ("volume" / loudness). */
  readonly volume: number;
  /** Distinct senders in the group. */
  readonly reach: number;
  /** Mean per-message severity weight. */
  readonly avgSeverity: number;
  /** User-set strategic fit, 0–1.5, default 1.0. */
  readonly fit: number;
  /** reach × avgSeverity × fit. */
  readonly priority: number;
}

/** The two ways the list can be ranked. */
export type SortMode = 'volume' | 'priority';
