# Caffeine-Express

The project turns what a field collaborator observes in a hospital into structured, reliable data about installed medical equipment, with conversational capture as simple as a conversation and inference running on the device.

## Language

### Field observation

**Apunte de campo**
: The free-text report a collaborator speaks or types after a visit, in natural language. It is the raw evidence and the link to voice and photo capture; it yields one or more Observaciones.
_Use when_: referring to the uncleaned input utterance.
_Avoid_: Reporte, nota de visita (unless the visit-level grouping is meant, not the utterance).

**Observación**
: A persisted structured record for one mentioned equipment group, carrying modalidad, marca, modelo, antigüedad, cantidad, and a state. The Apunte de campo renders into 1..n Observaciones.
_Use when_: referring to the structured, state-carrying data record.
_Avoid_: Item, registro suelto — each Observación is the unit that carries a state.

**Modalidad**
: The normalized equipment category from a controlled vocabulary (MRI, CT, ecografía, …); aliases like "resonador" resolve to the canonical term. The stable dimension queries, dedup, and aggregation compare against.
_Use when_: referring to the normalized equipment type of an Observación or Equipo instalado.
_Avoid_: Tipo de equipo (if a brand-specific line is meant), equipo genérico — conserve Modalidad for the controlled category.

### Institutions and locations

**Cliente**
: The health organization/account that owns equipment — the row dimension of the installed-base view. May hold one or more Sitios.
_Use when_: referring to the organization that buys and owns the equipment.
_Avoid_: Hospital (un Campus specific location), cuenta (unless the commercial account is meant).

**Sitio**
: The physical building or campus where a collaborator observes equipment; the anchor of each Observación, which inherits the Cliente, ciudad, and país.
_Use when_: referring to the concrete place a visit happened.
_Avoid_: Sede, sucursal, hospital (unless the building itself is meant) — conserve Sitio for the visit anchor.

### Observation state

**Estado**
: Provenance of an Observación, not its quality. One of Reportado, Estimado, Confirmado, or Desconocido; by precedence the least firm of its fields (Confirmado > Reportado > Estimado > Desconocido).
_Use when_: referring to the record-level state of an Observación.
_Avoid_: Status, calidad, validez — the state says where the data came from, not how good it is.

**Reportado**
: Stated directly by the collaborator in a single Apunte de campo; the initial state of a new Observación.
_Use when_: the value was seen or said, without independent corroboration.

**Estimado**
: At least one value was inferred by the model (e.g. age "parece de…", guessed brand) rather than stated directly.
_Use when_: the collaborator approximated or the model filled a gap by inference.

**Confirmado**
: Corroborated by an independent source: a second collaborator in a separate Apunte de campo, or a plate/label photo read.
_Use when_: dedup found a matching report, or a photo confirmed the record.

**Desconocido**
: A required value is an open hole: not captured and not resolved by the automatic follow-up prompt.
_Use when_: the Observación exists but a field could not be determined.

### Installed base

**Equipo instalado**
: The resolved identity of equipment at a Sitio, keyed by Sitio × Modalidad × marca × modelo (group level, not serial number), carrying the best current cantidad. Resolved from 1..n Observaciones that reconcile; created on the first unmatched report, strengthened to Confirmado by independent matching reports, and updated by pointed references ("uno de los resonadores").
_Use when_: referring to the deduplicated device/group that appears in the installed-base view.
_Avoid_: Item, activo, unidad física serializada (unless distinct beyond the group key), inventario.

**Confirmación independiente**
: A corroboration of an Equipo instalado from a separate source: a second collaborator in a different Apunte de campo, or a plate/label photo read. The evidence that raises a record to Confirmado.
_Use when_: counting what corroborates a record.
_Avoid_: Match (the reconciliation act is not the corroboration itself), like, double-check (casual reading).

**Base instalada**
: The resolved, live view of Equipos instalados per Cliente, Sitio, and geography, with aggregate quantities — the dataset queries, dedup, and renewal opportunities run against.
_Use when_: referring to the product-level dataset, not a single report.
_Avoid_: Inventario (implies physical audit), registro (implies single records).

**Puntaje de confianza**
: A product signal (0–100) for an Equipo instalado composed of completitud, frescura (time since the last confirmation), and confirmaciones independientes; its weights are tuning parameters, not part of the domain model.
_Use when_: referring to how reliable a record is believed to be.
_Avoid_: Calidad (implies intrinsic merit, not provenance), validez.

**Oportunidad de renovación**
: A renewal candidate: an Equipo instalado whose antigüedad reaches a tuning threshold (default 8 years). Estimated age counts; unknown age does not.
_Use when_: referring to a device the model flags as replaceable.
_Avoid_: Churn, upsell (commercial actions, not the candidate itself).