---
name: design-ideate
description: Optional exploration at PLANNING when feasibility is unclear — references by flow, human-chosen fidelity, validation assessment. Output is disposable; the learning is the artifact.
---

# Design Ideate (PLANNING, optional)

Explore design variations when the direction is unclear. Disposable — no
production-level work. Requires the context file from `design-intake`; **do not explore
without it.**

## Process

1. Read `design/<slug>-context.md`: user flows, user types, project goal.
2. Define the user flow to the stated goal. More than one viable flow → present the
   options, let the human pick.
3. Pull 3–7 UX references via the Mobbin MCP. **Match by flow, not by industry or
   userbase** — any domain is fair game if the flow is similar. DO: domain-agnostic login
   refs for a login flow; finance dashboards for reporting-heavy flows; Google Calendar
   for shift scheduling. DON'T: volunteering-only refs just because Clippy is an NGO tool.
   No Mobbin MCP? Run
   `claude mcp add mobbin --scope user --transport http https://api.mobbin.com/mcp`, then:
   authenticate with tool.mobbin@holi.social; if it fails, contact a human designer.
4. **Get written approval on the references + your understanding.** Ask explicitly what
   the human liked and didn't — no multiple choice, written feedback. "Liked all of them"
   is a bad signal (they didn't pay attention): ask once more.
5. **Let the human choose fidelity**, with a rough token estimate per rung: ASCII
   wireframe (cheapest) → HTML wireframe/mockup → draft design file via Pencil MCP (most
   expensive). Never assume it.
6. Build at the chosen fidelity; collect feedback. If the human is happy on the first go,
   that is not right — stress-test your own decisions with sanity-check questions; ask
   the human to grill you.
7. Assess validation need: **must** for critical lifecycle flows (sign in/up,
   verification, shift discovery) or flows >3 distinct steps; **may** for secondary
   flows; **skip** for minor tweaks aligned with the design system. If needed, write a
   validation plan as a `.md` file.

## Output

No committed artifact. The learning goes to `design/<slug>-context.md`: flow, references,
fidelity, feedback, validation decision. An approved direction proceeds to
`design-craft`.

## Anti-patterns

Production polish on disposable work · references matched by industry instead of flow ·
building before reference approval · skipping the validation assessment.
