import type { Lexicon } from '../domain/types';
import type { Dataset } from '../fixtures/datasets';
import { LexiconEditor } from './LexiconEditor';

interface Props {
  rawText: string;
  messageCount: number;
  lexicon: Lexicon;
  datasets: readonly Dataset[];
  activeDatasetId: string | null;
  onLoadDataset: (id: string) => void;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSetLexicon: (lexicon: Lexicon) => void;
  onResetLexicon: () => void;
}

export function SourcePanel({
  rawText,
  messageCount,
  lexicon,
  datasets,
  activeDatasetId,
  onLoadDataset,
  onChangeText,
  onClear,
  onSetLexicon,
  onResetLexicon,
}: Props) {
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) ?? null;

  return (
    <section className="panel source" aria-label="Source messages">
      <div className="panel__head">
        <h2>Messages</h2>
        <span className="source__count">{messageCount} parsed</span>
      </div>

      <div className="source__samples" role="group" aria-label="Load a sample dataset">
        <span className="source__samples-label">Sample:</span>
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            className={d.id === activeDatasetId ? 'is-active' : ''}
            aria-pressed={d.id === activeDatasetId}
            title={d.blurb}
            onClick={() => onLoadDataset(d.id)}
          >
            {d.label}
          </button>
        ))}
        <button type="button" onClick={onClear} disabled={rawText === ''}>
          Clear
        </button>
      </div>

      {activeDataset && (
        <p className="source__blurb">
          {activeDataset.blurb} Flip the ranking on the right — the loudest theme
          isn't the one to build.
        </p>
      )}

      <textarea
        className="source__input"
        value={rawText}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={
          'Paste support messages, one per line.\n\n' +
          'Optional: attribute a line to a sender with " | " so reach counts ' +
          'distinct people, e.g.\n\nsarah@clinic.com | the export button is broken'
        }
        spellCheck={false}
      />

      <LexiconEditor
        // Remount when the dataset (and thus lexicon) changes so the editor
        // shows the active rule set.
        key={activeDatasetId ?? 'custom'}
        lexicon={lexicon}
        onApply={onSetLexicon}
        onReset={onResetLexicon}
      />
    </section>
  );
}
