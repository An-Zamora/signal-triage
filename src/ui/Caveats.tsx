// "What this does not tell you" (spec §9 item 6). Naming the failure modes in
// the product itself is the point — it reads as judgment, not polish.

export function Caveats() {
  return (
    <section className="caveats" aria-label="Limitations">
      <h3>What this does not tell you</h3>
      <ul>
        <li>
          <strong>Selection bias.</strong> This ranks the people who wrote in.
          The customers who churned silently, or never hit the problem, are not
          in the box.
        </li>
        <li>
          <strong>Severity is inferred from wording.</strong> A polite report of
          a real outage can score below an irritated complaint about a font.
        </li>
        <li>
          <strong>Customers report solutions, not problems.</strong> "Add a
          button here" is a guess at a fix; the underlying need may be different.
        </li>
        <li>
          <strong>Clustering is keyword matching.</strong> It is inspectable and
          editable, not clever. Ambiguous messages land in "Unsorted" on purpose.
        </li>
      </ul>
    </section>
  );
}
