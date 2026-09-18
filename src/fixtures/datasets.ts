// Synthetic sample datasets. None of this is from a real person or product.
// Each dataset is shaped to demonstrate the tool's whole argument: the LOUDEST
// theme by message count is a low-severity pile-up from a couple of vocal
// senders, and it collapses toward the bottom the moment you rank by
// distinct reach × severity. Watching the #1 item fall several places when you
// flip the toggle is the pitch — no explanation needed.
//
// Attribution uses the "sender | text" convention the parser understands, so
// reach counts distinct people rather than messages.

import type { Lexicon } from '../domain/types';
import { DEFAULT_LEXICON, DEFAULT_SEVERITY } from '../domain/lexicon';

export interface Dataset {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly lexicon: Lexicon;
  readonly messages: string;
}

// --- Generic SaaS -----------------------------------------------------------
// Loud & trivial: "Cosmetic & polish" — 8 messages, 2 vocal senders, all wishes.
// Critical & quiet: "Login & access" — 4 messages, 4 distinct senders, blocked.
const SAAS_MESSAGES = `greg@acme.io | Any chance of a dark mode? Would be nice on the eyes.
greg@acme.io | The logo feels a bit big, it would help to make it smaller.
greg@acme.io | An accent color option to match our brand would be nice.
greg@acme.io | The default font is a little plain — a nicer typeface someday would be great.
greg@acme.io | An icon next to each row would be nice.
nina@brightlabs.co | Please add a dark theme, staring at a white screen all day.
nina@brightlabs.co | Would be nice to customize the dashboard colors.
nina@brightlabs.co | The empty states look plain; prettier illustrations would be nice.

alex@northwind.com | I can't log in at all since this morning, password reset does nothing.
jordan@vela.io | Locked out of my account, the 2FA code never arrives. This is urgent.
riley@monta.co | Sign in is broken for our whole team, nobody can get in.
casey@lumen.dev | Unable to log in, it just errors and kicks me out.

taylor@peko.com | Charged twice for my subscription this month, I need a refund.
jamie@orbit.io | My invoice shows the wrong amount, I think I was overcharged.
quinn@salt.co | Payment card keeps getting declined even though it's valid, I can't pay.

robin@delta.io | The dashboard is painfully slow every morning and takes forever.
avery@keyline.com | The app crashes every time I open the reports tab.

morgan@finch.co | CSV export times out on large files; it would help to support bigger exports.
devin@harbor.io | Can we get XLSX export alongside CSV?

parker@willow.com | Honestly no complaints, just wanted to say thanks to the team!
`;

// --- Clinic / practice-management ------------------------------------------
// Loud & trivial: "Patient portal polish" — 7 messages, 2 vocal patients, wishes.
// Critical & quiet: "Appointment reminders" — 4 messages, 4 distinct senders,
// the failure that causes no-shows.
const CLINIC_LEXICON: Lexicon = {
  themes: [
    {
      id: 'reminders',
      label: 'Appointment reminders',
      keywords: [
        'reminder', 'reminders', 'no-show', 'no-shows', 'no show', 'missed appointment',
        'missed appointments', 'appointment', 'reschedule', 'sms', 'text reminder',
        'confirm', 'confirmation',
      ],
    },
    {
      id: 'billing',
      label: 'Billing & insurance',
      keywords: [
        'copay', 'co-pay', 'insurance', 'claim', 'deductible', 'statement',
        'bill', 'billed', 'invoice', 'charge', 'charged', 'refund', 'payment',
      ],
    },
    {
      // Before portal-ux so "can't log in to the portal" scores as login.
      id: 'portal-login',
      label: 'Portal login & access',
      keywords: [
        'log in', 'log into', 'login', 'password', 'locked out', '2fa',
        'sign in', "can't access", 'reset',
      ],
    },
    {
      id: 'portal-ux',
      label: 'Patient portal polish',
      keywords: [
        'portal', 'menu', 'layout', 'home screen', 'dark mode', 'font', 'icons',
        'navigate', 'where do i', 'hard to find',
      ],
    },
    {
      id: 'refills',
      label: 'Prescriptions & refills',
      keywords: ['refill', 'refills', 'prescription', 'medication', 'rx', 'pharmacy'],
    },
    {
      id: 'records',
      label: 'Records & results',
      keywords: ['lab results', 'test results', 'records', 'chart', 'x-ray', 'imaging'],
    },
  ],
  severity: DEFAULT_SEVERITY,
};

const CLINIC_MESSAGES = `linda | The portal could be simpler — a cleaner layout would be nice.
linda | Would be nice if the portal remembered my preferred clinic location.
linda | A dark mode for the portal would be nice.
linda | The portal font is a bit small; it would help older patients to enlarge it.
carlos | I wish the portal had a clearer home screen.
carlos | The portal could use nicer icons, just a suggestion.
carlos | Please add a way to see past visits in the portal.

dr.jones@clinic | Three no-shows last week — the reminder texts are broken and never sent.
frontdesk@clinic | Patients say they never got their appointment reminders. This is urgent.
mary.rn@clinic | The SMS reminder system is down, we're getting missed appointments.
dr.patel@clinic | Reminder confirmations aren't reaching patients — can't run the schedule like this.

pat.a@mail.com | My copay was charged twice, I need a refund.
pat.b@mail.com | Insurance claim was denied and I got billed the full amount.
pat.c@mail.com | I can't pay my statement online, the payment page errors out.

pat.d@mail.com | I can't log into the patient portal, password reset does nothing.
pat.e@mail.com | Locked out of the portal after the update, the 2FA never arrives.

pat.f@mail.com | Can I get a refill on my prescription?
pat.g@mail.com | Would be nice to request medication refills through the app.

pat.h@mail.com | So grateful for the care last week — hope you all know it.
`;

export const DATASETS: readonly Dataset[] = [
  {
    id: 'saas',
    label: 'Generic SaaS',
    blurb: 'A software support inbox — the safe default.',
    lexicon: DEFAULT_LEXICON,
    messages: SAAS_MESSAGES,
  },
  {
    id: 'clinic',
    label: 'Clinic software',
    blurb: 'A practice-management inbox — appointments, reminders, insurance.',
    lexicon: CLINIC_LEXICON,
    messages: CLINIC_MESSAGES,
  },
];

export const DEFAULT_DATASET_ID = 'saas';

export function datasetById(id: string): Dataset {
  return DATASETS.find((d) => d.id === id) ?? DATASETS[0];
}
