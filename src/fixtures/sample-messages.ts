// Synthetic sample data. None of this is from a real person or a real product.
// It is shaped to demonstrate the tool's whole argument: the loudest theme
// (notifications — 7 messages) is NOT the most important once you rank by
// distinct reach × severity (login failures — fewer messages, more people,
// higher severity). Note the notifications volume is inflated by one power user
// sending the same complaint repeatedly — exactly the squeaky wheel the reach
// metric is designed to discount.
//
// Attribution uses the "sender | text" convention the parser understands.

export const SAMPLE_MESSAGES = `dana@example.com | Way too many notification emails. I get one for every single comment.
dana@example.com | Seriously please let me turn off notifications, my inbox is unusable.
dana@example.com | Still getting notification spam. Can we batch these into a digest?
priya@example.com | The notification settings are confusing, I couldn't find where to unsubscribe.
sam@example.com | Would be nice to have a weekly notification digest instead of per-event alerts.
lee@example.com | Too many alerts, it's annoying. A quiet-hours setting would help.
morgan@example.com | Notifications are a bit much but not a huge deal, just fyi.

alex@example.com | I can't log in at all since this morning, password reset does nothing.
jordan@example.com | Locked out of my account, the 2FA code never arrives. This is urgent.
riley@example.com | Sign in is broken for our whole team, nobody can get in.
casey@example.com | Unable to log in — it just spins and then errors out.

taylor@example.com | Charged twice for my subscription this month, need a refund.
jamie@example.com | My invoice shows the wrong amount, I think I was overcharged.
quinn@example.com | Payment card keeps getting declined even though it's valid.

robin@example.com | The dashboard is really slow to load, takes forever every morning.
avery@example.com | App crashes when I open the reports tab, happens every time.

skyler@example.com | Would love a dark mode someday, easy on the eyes.
drew@example.com | Feature request: please add CSV export for the reports.

parker@example.com | Just wanted to say the new onboarding flow is lovely, thank you!
`;

/** How many messages the sample contains, for the "load sample" hint. */
export const SAMPLE_MESSAGE_COUNT = SAMPLE_MESSAGES.trim().split(/\r?\n/).filter(
  (l) => l.trim() !== '',
).length;
