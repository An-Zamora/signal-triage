import { useState } from 'react';
import type { Lexicon } from '../domain/types';

interface Props {
  lexicon: Lexicon;
  onApply: (lexicon: Lexicon) => void;
  onReset: () => void;
}

// Minimal shape validation. The lexicon is user-editable and domain-agnostic,
// so this guards against malformed JSON without pretending to be a full schema.
function parseLexicon(text: string): Lexicon {
  const raw: unknown = JSON.parse(text);
  if (typeof raw !== 'object' || raw === null) throw new Error('Expected an object.');
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.themes)) throw new Error('"themes" must be an array.');
  for (const t of obj.themes) {
    const theme = t as Record<string, unknown>;
    if (typeof theme.id !== 'string' || typeof theme.label !== 'string') {
      throw new Error('Each theme needs a string "id" and "label".');
    }
    if (!Array.isArray(theme.keywords) || !theme.keywords.every((k) => typeof k === 'string')) {
      throw new Error(`Theme "${String(theme.id)}" needs a "keywords" array of strings.`);
    }
  }

  const sev = obj.severity as Record<string, unknown> | undefined;
  const tiers = ['blocked', 'friction', 'wish'] as const;
  if (!sev || typeof sev !== 'object') throw new Error('"severity" object is required.');
  for (const tier of tiers) {
    if (!Array.isArray(sev[tier]) || !(sev[tier] as unknown[]).every((k) => typeof k === 'string')) {
      throw new Error(`"severity.${tier}" must be an array of strings.`);
    }
  }
  // Lowercase everything so matching is predictable regardless of input casing.
  return {
    themes: (obj.themes as Lexicon['themes']).map((t) => ({
      id: t.id,
      label: t.label,
      keywords: t.keywords.map((k) => k.toLowerCase()),
    })),
    severity: {
      blocked: (sev.blocked as string[]).map((k) => k.toLowerCase()),
      friction: (sev.friction as string[]).map((k) => k.toLowerCase()),
      wish: (sev.wish as string[]).map((k) => k.toLowerCase()),
    },
  };
}

export function LexiconEditor({ lexicon, onApply, onReset }: Props) {
  const [draft, setDraft] = useState(() => JSON.stringify(lexicon, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const apply = () => {
    try {
      onApply(parseLexicon(draft));
      setError(null);
      setApplied(true);
      window.setTimeout(() => setApplied(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON.');
      setApplied(false);
    }
  };

  const reset = () => {
    onReset();
    setDraft(JSON.stringify(lexicon, null, 2));
    setError(null);
  };

  return (
    <details className="lexicon">
      <summary>Edit the lexicon (themes &amp; severity words)</summary>
      <p className="lexicon__note">
        This is the rule set that groups messages and infers severity. It is
        data, not logic — retune it for your product, then re-apply.
      </p>
      <textarea
        className="lexicon__input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        aria-label="Lexicon JSON"
      />
      {error && <p className="lexicon__error" role="alert">{error}</p>}
      <div className="lexicon__actions">
        <button type="button" onClick={apply}>
          {applied ? 'Applied ✓' : 'Apply lexicon'}
        </button>
        <button
          type="button"
          onClick={reset}
          title="Restore the default domain-agnostic lexicon"
        >
          Reset to default
        </button>
      </div>
    </details>
  );
}
