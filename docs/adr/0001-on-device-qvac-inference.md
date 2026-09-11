# On-device inference via QVAC (no cloud inference)

Status: accepted
Date: 2026-09-09

## Context

The field collaborator captures observations while inside a hospital, frequently without stable connectivity, and the captured content is sensitive client data. The product requires capture and extraction to work without the internet and never send content to an external service; QVAC enables on-device and peer-to-peer inference. A future reader might otherwise assume the easier path of calling a cloud API.

## Decision

All capture and extraction inference — interpreting the free-text Field note, speech-to-text dictation, and plate/label photo reading — runs on the device via QVAC or is delegated peer-to-peer. No inference is sent to a cloud API.

## Consequences

- Positive: the app works offline in the field; sensitive client data never leaves the device; the solution preserves its core privacy and availability constraint.
- Negative: constrained to the on-device and peer-to-peer capabilities QVAC offers (speech recognition and the vision model are limited to what runs locally); more integration effort than calling a cloud API.
- Follow-up: prototype the structured extraction on QVAC early to validate latency and model quality on limited hardware.
