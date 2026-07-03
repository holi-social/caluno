# Product

## Register

TO DO 
- add glossary reference 

product

> Split surface, product-primary. The core is a coordination app, but public/marketing
> surfaces exist (invite, public shifts) and will grow. Default to the product register;
> treat those public surfaces as brand per task. Critically: **no brand exists yet**, so any
> brand-flavored choice is provisional and must stay easy to replace (see Design Principles).

## Users

Two balanced audiences sharing one system, working at two different speeds:

- **Coordinators** (org staff and admins): schedule shifts, manage volunteers, org-units, roles,
  and membership requests. They work at a desk, often for long sessions, moving through dense
  management views. They value control, speed, and seeing the whole picture without clutter.
- **Volunteers**: browse and sign up for shifts, accept invites, and check in. They are
  frequently on a phone, sometimes on-site, sometimes first-time users. They span all ages and
  comfort levels with software. They value a short, obvious path and reassurance that they did
  the right thing.

Context: Clippy is multi-tenant volunteer and shift coordination for organisations. The shaping
real-world case is humanitarian aid (the Hanseatic Help experiment), so the audience skews toward
mission-driven, time-constrained people rather than power users chasing efficiency for its own sake.

Roles are not fixed — the same person can hold different roles across their lifecycle. Each audience
contains several roles. The backoffice side must serve every coordinator role equally well; the
volunteer-facing side must serve every volunteer role equally well.

### Coordinators (backoffice side)

**Manager**
- **Role**: makes high-level decisions and supervises all processes in the NGO.
- **Challenges**: little time for specific tasks; needs information at a glance and a fast route to the right part of the product.
- **Tasks**: set up org-wide processes, correct existing ones, oversee compliance and reporting.

**Event Planner**
- **Role**: plans and runs a temporary event.
- **Challenges**: constant last-minute changes; must judge volunteer coverage at a glance; during the event there is no time to focus on one task, so the UI must hold up under interference and distraction.
- **Tasks**: plan an event's shifts, oversee and resolve staffing, aadministrative tasks (making sure hours are recorded correctly, sending timesheets and agreement documents to accounting).

**Shift Supervisor**
- **Role**: keeps a single shift running smoothly.
- **Challenges**: chaotic working environment; tasks often done on mobile; many on-the-spot decisions when things go off-plan.
- **Tasks**: check volunteers in and out, resolve edge cases on the spot, administrative tasks (making sure hours are recorded correctly, sending timesheets and agreement documents to accounting).

### Volunteers (volunteer-facing side)

**Regular**
- **Role**: works with the same organisation for years, usually only one org.
- **Challenges**: reluctant to change; not always tech-native; some have no smartphone.
- **Tasks**: learn when and where a shift happens, check in and out, receive timely updates from the organisation.
- **Motivations**: volunteering at a familiar place, giving back, socialising with people they know.

**Temporarily Engaged**
- **Role**: volunteers seasonally or when free, not necessarily at the same organisation.
- **Challenges**: at event locations, poor internet connection, finding the right times for volunteering in their schedule.
- **Tasks**: check in and out, stay informed about last-minute changes.
- **Motivations**: giving back, doing good while also attending a festival, meeting new people.

**First-Timer**
- **Role**: just starting out, sometimes arriving through aggregators like Serve the City.
- **Challenges**: uncertainty in a new environment; feeling lost.
- **Tasks**: discover when and where they can volunteer, check in and out, get enough instruction to spend the shift productively.
- **Motivations**: giving back, meeting new people, filling free time (especially students and unemployed people).

## Product Purpose

Clippy helps organisations run on volunteer time: defining who is needed, when, and where, then
getting the right people into the right shifts and tracking that it happened. Success is a
coordinator who spends their energy on people instead of spreadsheets, and a volunteer who can go
from "I want to help" to "I'm booked and checked in" without confusion or a support call.

Because the platform is multi-tenant and pre-brand, it also has to look credible and neutral across
many organisations at once. It should feel trustworthy and finished today, while staying ready to
take on a real visual identity later.

## Clients

We have currently three pilot customers (as of mid-2026): 

**Org A** Focuses on providing direct help for people in need, running homeless shelters, providing elderly care, and different programming for integrating people with migration background. People volunteering at this organization can mostly experience direct contact with the “beneficiaries” and see the impact of their volunteering. It is also a higher compliance environment because there is a high sense of responsibility of the organization to protect both sides (people in vulnerable situations) and volunteers. At least in the shelters, the volunteering is shift based and varies between regular and more flexible volunteering. 

**Org B** Works indirectly by collecting clothing and hygiene articles and redistributing them to the people in need, often with partner organizations. Here volunteers help indirectly, many of the regulars volunteering at the main storage hall, sorting, packing and preparing donated items. The volunteering is very flexible here, volunteers can just come and go when they would like. They also have more event based volunteering, for example during festivals to collect items or donations. Here the social aspect plays a bigger role for volunteers (eg. connecting with other volunteers), as they don’t experience the direct impact of their work. 

**Org C** More location based, they have a physical building that is a school but also has a community center aspect, where different programming is run for which volunteers are needed (e.g. neighbourhood festivals, cultural events like concerts and exhibits). 

## Brand Personality

Warm and human, without being soft on the work. Three words: **warm, clear, dependable**.

- **Voice**: friendly, plain, respectful of the volunteer's time. Speaks like a helpful colleague,
  not a corporate system or a cheerful mascot.
- **Emotional goals**: coordinators should feel in control and unburdened; volunteers should feel
  welcomed, oriented, and confident they did it right.
- Warmth is carried by tone, spacing, and language, not by decoration. Friendly never means childish.

References (feel, not templates to copy):

- **Notion**: approachable, content-first, calm neutrals, forgiving empty states. The model for
  warmth without kitsch.
- **Calendly**: clean, reassuring, low cognitive load. The model for the volunteer booking and
  check-in flows.
- **Luma (lu.ma)**: gentle, rounded, human event scheduling. The model for the shift and signup side.
- **Linear** (efficiency anchor): crisp, fast, calm-capable. The model for the dense coordinator
  workspace, dialed warmer.

## Anti-references

- **Enterprise admin sludge**: dense gray corporate panels, cluttered toolbars, joyless
  SAP/Jira-style density. Cold and bureaucratic.
- **Charity cliche**: primary-color clipart, ribbons, stock "helping hands" imagery, condescending
  warmth. Cheap and patronizing toward both volunteers and the cause.
- **Trendy SaaS slop**: gradient-text heroes, glassmorphism, identical icon-heading-text card grids,
  big-number hero-metric dashboards. Generic and visibly AI-made.

## Design Principles

1. **Flexibility before identity.** This is the top constraint. There is no brand yet, so treat every
   brand-flavored decision (the green primary, the name, voice flourishes, imagery) as provisional and
   swappable. Build on semantic tokens and roles, never hardcoded brand values; keep brand expression
   non-intrusive so a future identity can drop in without a rewrite.
2. **Two speeds, one system.** Coordinators get density, power, and information completeness;
   volunteers get simplicity, large targets, and a single obvious next step. Same components, tuned
   per audience, never a lowest-common-denominator compromise.
3. **Warmth through restraint.** Human warmth comes from language, rhythm, and generous spacing, not
   from color floods, illustration, or novelty. Reject both corporate coldness and charity kitsch.
4. **Plain over clever.** First-time, all-ages, multilingual users. Use plain words, forgiving flows,
   and no jargon; design layouts that survive long German strings and never assume prior tool fluency.
5. **Earn every element.** Resist the SaaS reflexes in the anti-references. If a section can't justify
   its weight in coordinator focus or volunteer clarity, it doesn't ship.
6. **Same job, same shape.** Screens that share a purpose share a structure, and recurring data renders
   the same way everywhere. A Shift, an Event, and an Org detail page are all read by the same volunteer
   asking the same questions, so they look and behave like kin; a date, a capacity, or an address reads
   identically wherever it appears. Build the pattern once and reuse it. Divergence between similar
   surfaces is a bug, not a variant, unless a variant is explicitely created as such on design system; new structure is earned only when the job is genuinely different.

## Accessibility & Inclusion

- **WCAG 2.2 AA baseline** across the app: AA contrast, always-visible focus, adequate target sizes.
- **All ages, low tech literacy**: plain language, forgiving and reversible flows, minimal assumptions
  about prior software experience. Especially load-bearing on volunteer-facing flows, which are often
  used on a phone and sometimes by first-time users.
- **Multilingual, German-first**: the UI is translated and German strings run long; layouts must flex
  to variable text length without truncation or breakage, and copy must stay translatable (no idioms
  baked into structure).
