# Caffeine-Express

The project turns what a field collaborator observes in a hospital into structured, reliable data about installed medical equipment, with conversational capture as simple as a conversation and inference running on the device.

## Language

### Field observation

**Field note**
: The free-text report a collaborator speaks or types after a visit, in natural language. It is the raw evidence and the link to voice and photo capture; it yields one or more Observations.
_Use when_: referring to the uncleaned input utterance.
_Avoid_: Report, visit note (unless the visit-level grouping is meant, not the utterance).

**Observation**
: A persisted structured record for one mentioned equipment group, carrying modality, brand, model, age, quantity, and a state. The Field note renders into 1..n Observations.
_Use when_: referring to the structured, state-carrying data record.
_Avoid_: Item, loose record — each Observation is the unit that carries a state.

**Modality**
: The normalized equipment category from a controlled vocabulary (MRI, CT, ultrasound, …); aliases like "MR" resolve to the canonical term. The stable dimension queries, dedup, and aggregation compare against.
_Use when_: referring to the normalized equipment type of an Observation or Installed equipment.
_Avoid_: Equipment type (if a brand-specific line is meant), generic equipment — reserve Modality for the controlled category.

### Institutions and locations

**Client**
: The health organization/account that owns equipment — the row dimension of the installed-base view. May hold one or more Sites.
_Use when_: referring to the organization that buys and owns the equipment.
_Avoid_: Hospital (if a specific campus location is meant), account (unless the commercial account is meant).

**Site**
: The physical building or campus where a collaborator observes equipment; the anchor of each Observation, which inherits the Client, city, and country.
_Use when_: referring to the concrete place a visit happened.
_Avoid_: Headquarters, branch, hospital (unless the building itself is meant) — reserve "site" for the visit anchor.

### Observation state

**State**
: Provenance of an Observation, not its quality. One of Reported, Estimated, Confirmed, or Unknown; by precedence the least firm of its fields (Confirmed > Reported > Estimated > Unknown).
_Use when_: referring to the record-level state of an Observation.
_Avoid_: Status, quality, validity — the state says where the data came from, not how good it is.

**Reported**
: Stated directly by the collaborator in a single Field note; the initial state of a new Observation.
_Use when_: the value was seen or said, without independent corroboration.

**Estimated**
: At least one value was inferred by the model (e.g. age "about eight years old", guessed brand) rather than stated directly.
_Use when_: the collaborator approximated or the model filled a gap by inference.

**Confirmed**
: Corroborated by an independent source: a second collaborator in a separate Field note, or a plate/label photo read.
_Use when_: dedup found a matching report, or a photo confirmed the record.

**Unknown**
: A required value is an open hole: not captured and not resolved by the automatic follow-up prompt.
_Use when_: the Observation exists but a field could not be determined.

### Installed base

**Installed equipment**
: The resolved identity of equipment at a Site, keyed by Site × Modality × brand × model (group level, not serial number), carrying the best current quantity. Resolved from 1..n Observations that reconcile; created on the first unmatched report, strengthened to Confirmed by independent matching reports, and updated by pointed references ("one of the MRIs").
_Use when_: referring to the deduplicated device/group that appears in the installed-base view.
_Avoid_: Item, asset, serialized physical unit (unless distinct beyond the group key), inventory.

**Independent confirmation**
: A corroboration of Installed equipment from a separate source: a second collaborator in a different Field note, or a plate/label photo read. The evidence that raises a record to Confirmed.
_Use when_: counting what corroborates a record.
_Avoid_: Match (the reconciliation act is not the corroboration itself), "like", "double-check" (casual reading).

**Installed base**
: The resolved, live view of Installed equipment per Client, Site, and geography, with aggregate quantities — the dataset queries, dedup, and renewal opportunities run against.
_Use when_: referring to the product-level dataset, not a single report.
_Avoid_: Inventory (implies physical audit), registry (implies single records).

**Confidence score**
: A product signal (0–100) for Installed equipment composed of completeness, freshness (time since the last confirmation), and independent confirmations; its weights are tuning parameters, not part of the domain model.
_Use when_: referring to how reliable a record is believed to be.
_Avoid_: Quality (implies intrinsic merit, not provenance), validity.

**Renewal opportunity**
: A renewal candidate: Installed equipment whose age reaches a tuning threshold (default 8 years). Estimated age counts; unknown age does not.
_Use when_: referring to a device the model flags as replaceable.
_Avoid_: Churn, upsell (commercial actions, not the candidate itself).