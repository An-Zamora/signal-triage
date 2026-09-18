import type { Lexicon } from '../domain/types';
import { SAMPLE_MESSAGES } from '../fixtures/sample-messages';
import { LexiconEditor } from './LexiconEditor';

interface Props {
  rawText: string;
  messageCount: number;
  lexicon: Lexicon;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSetLexicon: (lexicon: Lexicon) => void;
  onResetLexicon: () => void;
}

export function SourcePanel({
  rawText,
  messageCount,
  lexicon,
  onChangeText,
  onClear,
  onSetLexicon,
  onResetLexicon,
}: Props) {
  return (
    <section className="panel source" aria-label="Source messages">
      <div className="panel__head">
        <h2>Messages</h2>
        <span className="source__count">{messageCount} parsed</span>
      </div>

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

      <div className="source__actions">
        <button type="button" onClick={() => onChangeText(SAMPLE_MESSAGES)}>
          Load sample
        </button>
        <button type="button" onClick={onClear} disabled={rawText === ''}>
          Clear
        </button>
      </div>

      <LexiconEditor
        lexicon={lexicon}
        onApply={onSetLexicon}
        onReset={onResetLexicon}
      />
    </section>
  );
}
