// The lexicon is DATA, not logic. It is the one thing in this repo a reviewer
// can read and disagree with — that visibility is the point (ADR-002).
//
// This default is deliberately domain-agnostic: it covers themes common to
// most software support inboxes. It is editable at runtime (see LexiconEditor),
// so anyone can retune it to their own product without touching code.

import type { Lexicon } from './types';

export const UNSORTED_ID = 'unsorted';
export const UNSORTED_LABEL = 'Unsorted';

export const DEFAULT_LEXICON: Lexicon = {
  themes: [
    {
      id: 'billing',
      label: 'Billing & payments',
      keywords: [
        'invoice', 'charge', 'charged', 'refund', 'payment', 'card', 'declined',
        'subscription', 'price', 'pricing', 'overcharged', 'receipt', 'billing',
      ],
    },
    {
      id: 'auth',
      label: 'Login & access',
      keywords: [
        'login', 'log in', 'sign in', 'signin', 'password', 'locked out',
        'two-factor', '2fa', 'authentication', "can't get in", 'reset', 'account access',
      ],
    },
    {
      id: 'performance',
      label: 'Performance & reliability',
      keywords: [
        'slow', 'lag', 'laggy', 'loading', 'timeout', 'timed out', 'crash',
        'crashed', 'freeze', 'frozen', 'hang', 'down', 'unresponsive',
      ],
    },
    {
      id: 'bugs',
      label: 'Bugs & errors',
      keywords: [
        'error', 'broken', "doesn't work", 'does not work', 'not working', 'bug',
        'glitch', 'fails', 'failed', 'wrong', 'unexpected',
      ],
    },
    {
      id: 'data',
      label: 'Data, import & export',
      keywords: [
        'export', 'import', 'csv', 'download', 'upload', 'sync', 'backup',
        'lost data', 'missing data', 'spreadsheet',
      ],
    },
    {
      id: 'integrations',
      label: 'Integrations & API',
      keywords: [
        'api', 'webhook', 'integration', 'integrate', 'connect', 'zapier',
        'oauth', 'sdk', 'endpoint',
      ],
    },
    {
      id: 'usability',
      label: 'Usability & UX',
      keywords: [
        'confusing', 'confused', 'hard to find', 'unclear', 'complicated',
        'where is', 'how do i', "can't find", 'intuitive', 'clunky',
      ],
    },
    {
      id: 'mobile',
      label: 'Mobile app',
      keywords: ['mobile', 'ios', 'iphone', 'ipad', 'android', 'app store', 'phone app'],
    },
    {
      id: 'notifications',
      label: 'Notifications & email',
      keywords: [
        'notification', 'notifications', 'alert', 'reminder', 'email digest',
        'unsubscribe', 'too many emails', 'spam',
      ],
    },
    {
      id: 'feature',
      label: 'Feature requests',
      keywords: [
        'feature request', 'would be nice', 'please add', 'can you add', 'wish',
        'i wish', 'suggestion', 'it would help', 'hope you', 'roadmap',
      ],
    },
  ],
  severity: {
    // Order matters conceptually, not mechanically: a message that trips a
    // "blocked" phrase is blocked even if it also trips a "wish" phrase.
    blocked: [
      "can't", 'cannot', 'unable', 'blocked', 'broken', 'down', 'crash',
      'crashed', 'lost', 'urgent', 'critical', 'stuck', 'nothing works',
      'not working', 'losing money', 'unusable',
    ],
    friction: [
      'slow', 'confusing', 'annoying', 'difficult', 'frustrating', 'frustrated',
      'hard', 'workaround', 'clunky', 'tedious', 'takes forever', 'wish it were',
    ],
    wish: [
      'would be nice', 'i wish', 'wish', 'hope', 'suggestion', 'please add',
      'feature request', 'someday', 'nice to have', 'it would help',
    ],
  },
};
