# MVP boundary and post-MVP roadmap

Status: accepted
Date: 2026-09-09

## Context

The challenge requires a minimum end-to-end prototype: natural-language capture, structured extraction, storage, a client-level installed-base view, and basic aggregation across clients. The broader concept also includes dictation, camera capture, OCR, multimodal extraction, follow-up questions, independent confirmation, P2P synchronization, natural-language analytics, freshness, and renewal opportunities. Putting all of those capabilities into the first flow makes the prototype boundary unclear and makes the minimum path difficult to demonstrate.

## Decision

Build and demonstrate the MVP first:

1. The Collaborator types a natural-language Observation.
2. QVAC extracts Client/Site, Modality, brand, model, quantity, Age, and Use when present; required Age can remain `Unknown`.
3. The app validates and persists the Observation.
4. The Observation updates Installed equipment.
5. The dashboard shows the installed base per Client and basic aggregation across Clients.

Only after that path is complete do we add post-MVP capabilities: Parakeet dictation, camera and plate capture, OCR/VisionPsy, automatic follow-up, independent confirmation and conflict handling, P2P synchronization, natural-language queries, freshness, Age/Use analytics, and renewal opportunities.

## Consequences

- Positive: the MVP has a short, demonstrable path from text capture to customer intelligence; optional capabilities cannot obscure whether the minimum challenge is complete.
- Negative: the first demo does not showcase voice or camera capture; those capabilities require a second flow and separate validation.
- Follow-up: keep the MVP and post-MVP diagrams separate, and do not promote a post-MVP capability into the MVP without revisiting this boundary.
