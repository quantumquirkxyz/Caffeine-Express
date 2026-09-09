# Issue 6: Client Installed Base Dashboard

## Changed

- Added `dashboardView`, a renderer-neutral projection of `InstalledBase`.
- Grouped records by Client and Site while preserving Modality, brand, model, quantity, Age, Use, State, and evidence IDs.
- Added cross-Client/Site aggregation for selected filters.
- Added explicit loading, offline, empty, and no-result view states.
- Added an Expo (React Native) renderer (`src/App.tsx`) seeded from the synthetic fixtures: renders all four view states via demo controls, plus the ready view with Modality filter chips and the cross-Client/Site aggregation panel. Cross-platform web + mobile per the QVAC seam decision.
- Scoped Standards fixes from review pass 1: `toEquipmentRow` + `InstalledEquipment` typing, unified `sumQuantity`, `Modality`/`Provenance`/`DashboardSiteGroup` types, Map-keyed grouping.
- Added expo/react/react-native dev toolchain (Expo SDK 57, TypeScript 6.0.3, `@types/react` aligned).

## Verified

- `npm run typecheck`
- `npm test -- src/dashboard/dashboard.test.ts`
- `npm test` (62 tests)
- `npx expo-doctor` (21/21 checks)
- `npx expo export --platform web` (bundles and serves the demo)
- Skipped: RN-instance unit tests — the pure `dashboardView` logic is covered by the vitest suite and the repo has no Jest/RN test harness; demoability is proven by the web export.
