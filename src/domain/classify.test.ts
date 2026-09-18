import { describe, expect, it } from 'vitest';
import {
  classifySeverity,
  classifyTheme,
  groupByTheme,
  parseMessages,
} from './classify';
import { DEFAULT_LEXICON, UNSORTED_ID } from './lexicon';

describe('parseMessages', () => {
  it('takes one message per non-empty line and skips blanks', () => {
    const msgs = parseMessages('first\n\n  \nsecond\n');
    expect(msgs).toHaveLength(2);
    expect(msgs.map((m) => m.text)).toEqual(['first', 'second']);
    expect(msgs.map((m) => m.id)).toEqual([0, 1]);
  });

  it('attributes a sender when the "sender | text" convention is used', () => {
    const [m] = parseMessages('sarah@clinic.com | the export button is broken');
    expect(m.sender).toBe('sarah@clinic.com');
    expect(m.text).toBe('the export button is broken');
  });

  it('leaves the sender null when there is no attribution', () => {
    const [m] = parseMessages('just a plain line');
    expect(m.sender).toBeNull();
    expect(m.text).toBe('just a plain line');
  });

  it('only splits on the first " | " so text can contain pipes', () => {
    const [m] = parseMessages('dana | a | b | c');
    expect(m.sender).toBe('dana');
    expect(m.text).toBe('a | b | c');
  });
});

describe('classifyTheme', () => {
  it('lands known messages in the expected theme', () => {
    expect(classifyTheme("I can't log in and my password reset failed", DEFAULT_LEXICON)).toBe('auth');
    expect(classifyTheme('charged twice, I need a refund on my invoice', DEFAULT_LEXICON)).toBe('billing');
    expect(classifyTheme('the dashboard is really slow to load', DEFAULT_LEXICON)).toBe('performance');
  });

  it('sends messages with no keyword hits to unsorted rather than forcing them', () => {
    expect(classifyTheme('hello, just saying hi', DEFAULT_LEXICON)).toBe(UNSORTED_ID);
  });

  it('picks the theme with the most keyword hits', () => {
    // "export" + "csv" + "download" all point at data; only "slow" hints performance.
    expect(
      classifyTheme('the csv export download is slow', DEFAULT_LEXICON),
    ).toBe('data');
  });
});

describe('classifySeverity', () => {
  it('treats blocking language as blocked', () => {
    expect(classifySeverity("I can't log in, this is urgent", DEFAULT_LEXICON)).toBe('blocked');
  });

  it('treats a plain feature request as a wish', () => {
    expect(classifySeverity('would be nice to have dark mode', DEFAULT_LEXICON)).toBe('wish');
  });

  it('treats friction language as friction', () => {
    expect(classifySeverity('this flow is confusing and clunky', DEFAULT_LEXICON)).toBe('friction');
  });

  it('defaults to friction when there is no severity signal', () => {
    expect(classifySeverity('the report shows last month', DEFAULT_LEXICON)).toBe('friction');
  });
});

describe('groupByTheme', () => {
  it('groups classified messages and only returns non-empty themes', () => {
    const msgs = parseMessages(
      [
        "a@x.com | can't log in, urgent",
        'b@x.com | password reset is broken',
        'c@x.com | charged twice, need a refund',
      ].join('\n'),
    );
    const groups = groupByTheme(msgs, DEFAULT_LEXICON);
    const ids = groups.map((g) => g.themeId);
    expect(ids).toContain('auth');
    expect(ids).toContain('billing');
    expect(groups.find((g) => g.themeId === 'auth')?.messages).toHaveLength(2);
  });

  it('always places unsorted last', () => {
    const msgs = parseMessages(['random noise here', "can't log in"].join('\n'));
    const groups = groupByTheme(msgs, DEFAULT_LEXICON);
    expect(groups[groups.length - 1].themeId).toBe(UNSORTED_ID);
  });
});
