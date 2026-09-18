import type { ScoredTheme } from '../domain/types';
import { MAX_FIT, MIN_FIT } from '../domain/score';

interface Props {
  theme: ScoredTheme;
  onSetFit: (value: number) => void;
}

const SEVERITY_CLASS: Record<string, string> = {
  blocked: 'sev sev--blocked',
  friction: 'sev sev--friction',
  wish: 'sev sev--wish',
};

export function ThemeDetail({ theme, onSetFit }: Props) {
  return (
    <section className="panel detail" aria-label={`Theme detail: ${theme.label}`}>
      <div className="panel__head">
        <h2>{theme.label}</h2>
      </div>

      <dl className="detail__metrics">
        <div>
          <dt>Volume</dt>
          <dd>{theme.volume} messages</dd>
        </div>
        <div>
          <dt>Reach</dt>
          <dd>{theme.reach} distinct senders</dd>
        </div>
        <div>
          <dt>Avg. severity</dt>
          <dd>{theme.avgSeverity.toFixed(2)} / 3</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{theme.priority.toFixed(1)}</dd>
        </div>
      </dl>

      <div className="detail__fit">
        <label htmlFor="fit-slider">
          Strategic fit: <strong>{theme.fit.toFixed(1)}</strong>
          {theme.fit === 0 && <span className="detail__parked"> — not doing it</span>}
        </label>
        <input
          id="fit-slider"
          type="range"
          min={MIN_FIT}
          max={MAX_FIT}
          step={0.1}
          value={theme.fit}
          onChange={(e) => onSetFit(Number(e.target.value))}
        />
        <p className="detail__fit-help">
          Fit is a human judgment, not a computed value. Reach and severity are
          countable; whether this belongs in the product is your call. Set it to
          0 to park the theme.
        </p>
      </div>

      <h3 className="detail__msgs-head">Messages ({theme.messages.length})</h3>
      <ul className="detail__msgs">
        {theme.messages.map((m) => (
          <li key={m.id}>
            <span className={SEVERITY_CLASS[m.severity]}>{m.severity}</span>
            <span className="detail__msg-text">{m.text}</span>
            {m.sender && <span className="detail__msg-sender">{m.sender}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
