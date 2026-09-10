# Git commit and push workflow

Every commit message is written in **English** and each commit contains **one minimal change** (a single logical unit, never a bundle of unrelated edits).

## Commit conventions

- Use a conventional commit prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Add an optional scope in parentheses, e.g. `feat(theme):`.
- Keep the summary line short, imperative, and capitalized like a title.
- Stage only the files that belong to the change being committed.

## Commands

Stage the files of one minimal change, then commit:

```bash
git add <files>
git commit -m "feat(theme): add adaptive light and dark palettes with ThemeProvider"
```

Push the committed changes to `origin/main`:

```bash
git push origin main
```

## Before pushing

Verify the tree is sound:

```bash
npm run typecheck
npm test -- --run
git diff --check
```