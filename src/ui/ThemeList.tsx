import type { ScoredTheme, SortMode } from '../domain/types';

interface Props {
  themes: readonly ScoredTheme[];
  sortMode: SortMode;
  selectedThemeId: string | null;
  onSetSort: (mode: SortMode) => void;
  onSelect: (themeId: string) => void;
}

export function ThemeList({
  themes,
  sortMode,
  selectedThemeId,
  onSetSort,
  onSelect,
}: Props) {
  return (
    <section className="panel themes" aria-label="Ranked themes">
      <div className="panel__head">
        <h2>Themes</h2>
        <div className="themes__toggle" role="group" aria-label="Ranking mode">
          <button
            type="button"
            className={sortMode === 'volume' ? 'is-active' : ''}
            aria-pressed={sortMode === 'volume'}
            onClick={() => onSetSort('volume')}
          >
            Rank by volume
          </button>
          <button
            type="button"
            className={sortMode === 'priority' ? 'is-active' : ''}
            aria-pressed={sortMode === 'priority'}
            onClick={() => onSetSort('priority')}
          >
            Rank by priority
          </button>
        </div>
      </div>

      <p className="themes__caption">
        {sortMode === 'volume'
          ? 'Loudest first — ranked purely by message count.'
          : 'Ranked by distinct reach × severity × your fit. fit = 0 parks a theme at the bottom.'}
      </p>

      {themes.length === 0 ? (
        <p className="app__hint">No themes yet.</p>
      ) : (
        <ol className="themes__list">
          {themes.map((theme, i) => {
            const parked = sortMode === 'priority' && theme.fit === 0;
            return (
              <li key={theme.themeId}>
                <button
                  type="button"
                  className={
                    'theme-row' +
                    (theme.themeId === selectedThemeId ? ' is-selected' : '') +
                    (parked ? ' is-parked' : '')
                  }
                  onClick={() => onSelect(theme.themeId)}
                >
                  <span className="theme-row__rank">{parked ? '—' : i + 1}</span>
                  <span className="theme-row__label">{theme.label}</span>
                  <span className="theme-row__metric">
                    {sortMode === 'volume'
                      ? `${theme.volume} msg`
                      : parked
                        ? 'not doing it'
                        : `score ${theme.priority.toFixed(1)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
