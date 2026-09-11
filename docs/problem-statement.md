# Problem Statement — Field Equipment Capture

## Challenge

Build a prototype that turns what a field collaborator observes during a customer-site visit into structured, reliable data about installed equipment, with capture as simple as a conversation and AI inference running locally on the device.

## Problem

Service engineers, salespeople, and specialists visit hospitals and clinics every day. They see how many MRI scanners, CT scanners, ultrasound systems, and other devices each client has, which brands and models are installed, how old equipment appears to be, and how intensely it is used.

That knowledge is valuable but difficult to operationalize. It commonly remains in personal notes, messages, spreadsheets, or memory. Manual capture is slow, descriptions are inconsistent, multiple people may report the same equipment, and observations are frequently incomplete. The organization therefore has limited visibility into the real installed technology landscape across its accounts.

## Why local inference matters

The collaborator may be working with unstable connectivity and sensitive customer/site context. Requiring an external AI service would create both an availability dependency and an unnecessary inference boundary.

FieldSight therefore treats **on-device QVAC inference as a system invariant**. The native capture path does not route speech or Field notes to a cloud inference API. This decision is formalized in [`adr/0001-on-device-qvac-inference.md`](adr/0001-on-device-qvac-inference.md) and enforced by the repository's no-cloud guard and CI workflow.

## User mission

A collaborator should be able to say or type a note such as:

> “Estoy en Hospital DemoCare Pacific en Panamá. Hay dos MRI NovaMed N-1. Uno de los equipos parece tener unos ocho años y reportan 1,200 horas de uso.”

FieldSight should then produce structured evidence without inventing what was not stated.

```mermaid
flowchart LR
    A["Voice / typed note"] --> B["Local transcription"]
    B --> C["Reviewable Field note"]
    C --> D["Structured extraction"]
    D --> E["Validated Observation(s)"]
    E --> F["Installed base"]
```

## Minimum challenge path

The deterministic core of the solution is:

- natural-language Field note capture;
- QVAC structured extraction on-device;
- extraction of Client/Site, geography when present, Modality, brand, model, quantity, Age, Use, and Comment;
- explicit `Unknown` handling for unresolved required data;
- typed validation before persistence;
- Observation persistence;
- reconciliation into an Installed base;
- Client/Site/geography filtering and basic portfolio aggregation.

## Hackathon enhancement: multilingual dictation

The submission branch extends the minimum typed path with **multilingual on-device dictation**:

1. `expo-audio` captures microphone PCM on the physical mobile device.
2. QVAC Parakeet TDT transcribes the audio locally.
3. The local QVAC text model cleans speech disfluencies and improves ordering while preserving facts, numbers, negations, uncertainty, brands, models, and locations.
4. The collaborator reviews/edits the Field note.
5. The normal structured-extraction pipeline runs.

Voice is therefore an additional capture mechanism, not a separate source of truth. The structured contract and domain validation remain unchanged.

See [`qvac/dictation.md`](qvac/dictation.md) for implementation details.

## Acceptance principles

A successful FieldSight flow should satisfy all of the following:

| Principle | Expected behavior |
| --- | --- |
| Local AI | QVAC performs AI inference on the device |
| No silent cloud fallback | Unsupported runtimes fail closed rather than calling a remote model |
| Incomplete data tolerated | Missing facts remain Unknown/null according to the domain contract |
| No false precision | Approximate Age remains a range/estimate rather than becoming an invented exact value |
| Human review | Dictated text is visible/editable before structured extraction |
| Deterministic system of record | Model output must pass validation before persistence |
| Reconciliation | Multiple Observations contribute to a resolved Installed base |

## Synthetic fixture

`hackathon_rules/Dummy_Installed_Base_Hackathon.xlsx` is the deterministic challenge seed and acceptance reference. Its 20 fictional rows cover multiple countries, Sites, modalities, quantities, approximate ages, installation-year evidence, missing models, and provenance states.

The workbook is **synthetic** and must not be represented as production customer data. Import normalization follows ADR 0007.

## Out of the submission-critical path

The following remain product extensions rather than requirements for the final demo:

- camera capture of equipment plates;
- OCR/VisionPsy-assisted brand/model/manufacturing-year evidence;
- automatic follow-up dialogue for unresolved fields;
- peer-to-peer synchronization and distributed confirmation;
- advanced natural-language portfolio queries;
- production authentication, tenancy, fleet/device management, and enterprise synchronization.

## Binding technical requirement

The solution must use **QVAC** with inference on-device or delegated peer-to-peer. A cloud inference API is not an acceptable substitute. The web application exists as a dashboard/review surface; the real AI capture path is demonstrated on a physical Android/iOS device.

## Domain decisions

The canonical product language is defined in [`../CONTEXT.md`](../CONTEXT.md), including Field note, Observation, Modality, Age, Use, Comment, Client, Site, State, Installed equipment, Conflicting observation, Independent confirmation, Installed base, Confidence score, and Renewal opportunity.

System boundaries and trust assumptions are documented in [`architecture.md`](architecture.md).
