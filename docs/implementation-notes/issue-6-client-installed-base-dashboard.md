# Issue 6: Client Installed Base Dashboard

## Changed

- Added `dashboardView`, a renderer-neutral projection of `InstalledBase`.
- Grouped records by Client and Site while preserving Modality, brand, model, quantity, Age, Use, State, and evidence IDs.
- Added cross-Client/Site aggregation for selected filters.
- Added explicit loading, offline, empty, and no-result view states.

## Verified

- `npm run typecheck`
- `npm test -- src/dashboard/dashboard.test.ts`
- `npm test`
