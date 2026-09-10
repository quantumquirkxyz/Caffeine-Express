# FieldSight

A greenfield project with the **quirk Skills** workflow bundle installed for AI-agnostic work.

## quirk Skills

Canonical skills live in `.agents/skills/`, exposed through the `.claude/skills/` compatibility view. `skills-lock.json` pins the installed bundle hashes.

- Read `CONTEXT.md` for this repository's local vocabulary and setup.
- Read `docs/agents/` for issue-tracker, work-item, and triage conventions.
- Validate the bundle from the repo root:

```bash
node .agents/skills/platform/check-all.mjs
```

Route work through `ask-to` or `work-item-router` to get started.
