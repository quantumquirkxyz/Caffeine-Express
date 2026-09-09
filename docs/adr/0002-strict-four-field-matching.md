# Strict four-field matching for Installed equipment

Status: accepted
Date: 2026-09-09

## Context

A Field note yields Observations keyed by Site × Modality × brand × model, and these Observations reconcile into Installed equipment. Independent confirmation — what raises a record to Confirmed — depends on whether two reports refer to the same physical equipment. A future reader might assume matching by a looser key (e.g. Site × Modality × brand only), because in the field collaborators rarely state the exact model. It would be cheaper, and would group "NovaMed MRI" reports even when the model is never named.

## Decision

Installed equipment is matched and reconciled strictly on all four key fields: Site × Modality × brand × model. A report missing any of the four creates a new Installed equipment entry until the gap is filled (by follow-up or a plate/label photo). A report that names a different model is treated as a distinct device, not grouped under a shared brand.

## Consequences

- Positive: precision — "NovaMed Vanta" and "NovaMed Lumina" are correctly kept apart; the system leverages QVAC's model extraction to distinguish distinct physical devices.
- Negative: a partial Field note ("a NovaMed MRI") does not match an existing entry that lacks a model, so reconciliation can lag until the model is captured; the same device may appear as duplicate entries when collaborators never state the model.
- Follow-up: the automatic follow-up prompt (and photo capture) becomes the mechanism for filling the missing model field so strict matches can eventually consolidate; prototype the dedup UX to confirm partial reports do not strand records in an un-mergeable state.
