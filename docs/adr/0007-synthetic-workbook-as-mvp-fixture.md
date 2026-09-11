# Synthetic workbook as MVP fixture

Status: accepted
Date: 2026-09-09

## Context

The project includes `docs/hackathon_rules/Dummy_Installed_Base_Hackathon.xlsx` as a synthetic development and acceptance fixture with 20 fictional installed-base rows, reference lists, follow-up logic, and voice prompts. Its tabular labels do not map one-to-one to the domain: it uses `Customer / Hospital`, `Observer`, scalar `Approx. Age`, optional `Model`, and display confidence buckets.

## Decision

Use the workbook only as a checked-in seed and acceptance fixture for the MVP, through an explicit adapter. Map hospital/customer and geography to Client/Site, observer/date to Collaborator/Visit, normalize `MR` to the canonical Modality, convert scalar approximate age to an inclusive range, and preserve missing brand/model as `Unknown`. Workbook confidence buckets remain presentation fixtures and never replace the derived score.

The rows, reference values, and prompts are synthetic only and must not be presented as real customer or competitive data.

## Consequences

- Positive: the dashboard and tests have deterministic, reproducible data.
- Positive: fixture convenience does not change Observation, State, Age, or matching contracts.
- Negative: an adapter is required, and scalar age must be converted to preserve uncertainty.
- Follow-up: implement fixture loading and extraction cases before post-MVP voice or follow-up automation.
