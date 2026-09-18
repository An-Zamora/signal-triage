import { useMemo, useReducer } from 'react';
import type { Lexicon, SortMode } from '../domain/types';
import { groupByTheme, parseMessages } from '../domain/classify';
import { rankThemes, scoreThemes } from '../domain/score';
import { DATASETS, DEFAULT_DATASET_ID, datasetById } from '../fixtures/datasets';
import { SourcePanel } from './SourcePanel';
import { ThemeList } from './ThemeList';
import { ThemeDetail } from './ThemeDetail';
import { Caveats } from './Caveats';

// All app state lives in this one reducer (spec §5). No global store.
interface State {
  rawText: string;
  lexicon: Lexicon;
  datasetId: string | null; // which sample is loaded; null once the user edits
  fitValues: Record<string, number>;
  sortMode: SortMode;
  selectedThemeId: string | null;
}

type Action =
  | { type: 'setText'; text: string }
  | { type: 'loadDataset'; id: string }
  | { type: 'clear' }
  | { type: 'setSort'; mode: SortMode }
  | { type: 'setFit'; themeId: string; value: number }
  | { type: 'selectTheme'; themeId: string | null }
  | { type: 'setLexicon'; lexicon: Lexicon }
  | { type: 'resetLexicon' };

// Open with a sample already loaded (audit: an empty textarea wastes the first
// fifteen seconds). "Clear" is one click away for anyone bringing their own data.
const defaultDataset = datasetById(DEFAULT_DATASET_ID);
const initialState: State = {
  rawText: defaultDataset.messages,
  lexicon: defaultDataset.lexicon,
  datasetId: defaultDataset.id,
  fitValues: {},
  sortMode: 'volume',
  selectedThemeId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setText':
      // Editing the text detaches it from the loaded sample.
      return { ...state, rawText: action.text, datasetId: null };
    case 'loadDataset': {
      const ds = datasetById(action.id);
      return {
        ...state,
        rawText: ds.messages,
        lexicon: ds.lexicon,
        datasetId: ds.id,
        fitValues: {},
        selectedThemeId: null,
      };
    }
    case 'clear':
      return { ...state, rawText: '', datasetId: null, fitValues: {}, selectedThemeId: null };
    case 'setSort':
      return { ...state, sortMode: action.mode };
    case 'setFit':
      return { ...state, fitValues: { ...state.fitValues, [action.themeId]: action.value } };
    case 'selectTheme':
      return { ...state, selectedThemeId: action.themeId };
    case 'setLexicon':
      return { ...state, lexicon: action.lexicon };
    case 'resetLexicon':
      return { ...state, lexicon: defaultDataset.lexicon };
    default:
      return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // The data flow, top to bottom (spec §5):
  // raw text -> parse -> classify+group -> score -> rank by active mode.
  const messages = useMemo(() => parseMessages(state.rawText), [state.rawText]);
  const groups = useMemo(
    () => groupByTheme(messages, state.lexicon),
    [messages, state.lexicon],
  );
  const scored = useMemo(
    () => scoreThemes(groups, state.fitValues),
    [groups, state.fitValues],
  );
  const ranked = useMemo(
    () => rankThemes(scored, state.sortMode),
    [scored, state.sortMode],
  );

  const selected = ranked.find((t) => t.themeId === state.selectedThemeId) ?? null;

  return (
    <div className="app">
      <header className="app__header">
        <h1>signal-triage</h1>
        <p className="app__tagline">
          The loudest theme in a support inbox is usually not the most important
          one. Rank the same messages two ways and watch the order change.
        </p>
        <p className="app__privacy">
          🔒 Your messages never leave your browser. There is no server, no upload,
          no analytics — enforced by the page's Content-Security-Policy.
        </p>
      </header>

      <main className="app__grid">
        <SourcePanel
          rawText={state.rawText}
          messageCount={messages.length}
          lexicon={state.lexicon}
          datasets={DATASETS}
          activeDatasetId={state.datasetId}
          onLoadDataset={(id) => dispatch({ type: 'loadDataset', id })}
          onChangeText={(text) => dispatch({ type: 'setText', text })}
          onClear={() => dispatch({ type: 'clear' })}
          onSetLexicon={(lexicon) => dispatch({ type: 'setLexicon', lexicon })}
          onResetLexicon={() => dispatch({ type: 'resetLexicon' })}
        />

        <ThemeList
          themes={ranked}
          sortMode={state.sortMode}
          selectedThemeId={state.selectedThemeId}
          onSetSort={(mode) => dispatch({ type: 'setSort', mode })}
          onSelect={(themeId) => dispatch({ type: 'selectTheme', themeId })}
        />

        <div className="app__detail">
          {selected ? (
            <ThemeDetail
              theme={selected}
              onSetFit={(value) =>
                dispatch({ type: 'setFit', themeId: selected.themeId, value })
              }
            />
          ) : (
            <p className="app__hint">
              {ranked.length > 0
                ? 'Select a theme to see its messages and adjust its strategic fit.'
                : 'Paste support messages on the left, or load the sample, to get started.'}
            </p>
          )}
          <Caveats />
        </div>
      </main>
    </div>
  );
}
