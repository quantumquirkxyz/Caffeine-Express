# Per-field provenance with worst-case record State

Status: accepted
Date: 2026-09-09

## Context

An Observation carries modality, brand, model, age, and quantity, each of which may be stated directly, inferred by the model, confirmed independently, or left open. Intuitively one might label the whole record with a single provenance label. But fields arrive from different channels with different certainty: a plate photo reads brand and model literally while age is derived from a manufacturing year; an age "about eight years old" is an estimate while quantity is stated directly.

## Decision

Each field of an Observation carries its own provenance (Confirmed, Reported, Estimated, Unknown), and the record-level State is the least firm of its fields, by precedence Confirmed > Reported > Estimated > Unknown. The record State is not stored independently of the fields; it is derived as the worst-case provenance across them.

## Consequences

- Positive: the record State is honest about its weakest link — a fully Confirmed record with an Estimated age reads Estimated; a record that never resolves model reads Unknown — and the provenance of each field stays traceable for the confidence score.
- Negative: provenance must be modelled per field, which is more granular than a single record label and adds bookkeeping whenever a field is updated by a new source.
- Follow-up: the confidence score's completeness component is computed from non-Unknown fields, so per-field provenance feeds it directly; confirm the derivation is recomputed when any field updates.
