---
name: glossary-protocol
description: How to use docs/GLOSSARY.md — grep the ticket's domain nouns at planning, synonym fallback before concluding a term is absent, never invent a meaning. Use at PLANNING.
---

# Glossary Protocol

`docs/GLOSSARY.md` owns domain language. The PM owns meanings; lines marked `[dev]` (code
mappings) are dev-owned.

At planning (ticket intake / spec drafting):

1. **Grep the GLOSSARY for the ticket's domain nouns**; load matching entries.
2. **If grep returns nothing**, scan the section headings and try synonyms/singulars
   before concluding a term is absent.
3. If still unclear: **ask — never invent a meaning.**

Load entries selectively (grep, not the whole file — targeted reads beat dumps).

Precedence on conflict: GLOSSARY wins on domain meaning, AGENTS.md wins on architecture,
code wins on facts. A change to what a term denotes routes per `decision-routing` — the
trailer AND the GLOSSARY, same commit.
