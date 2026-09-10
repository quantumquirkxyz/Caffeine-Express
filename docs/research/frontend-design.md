# Frontend Design Research

Date: 2026-09-09

## Scope

Research for the Caffeine Express MVP: a Collaborator captures a Field note during a Visit, reviews structured Observations, and explores the Installed base by Client and Site. The interface must work on web and mobile, with local-first loading and offline states.

## Findings

### 1. Interaction states must be explicit

The primary flow should visibly distinguish idle, processing, success, error, offline, empty, and no-results states. A Field note is not just a text form: it is the input to an extraction step and then a reviewable Observation.

This follows the WCAG guidance that state information must remain perceivable and must not rely on color alone. Source: [W3C WCAG 2.2, Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### 2. Controls need a visible, high-contrast affordance

The capture action, filters, and selected states need a visible shape or boundary and a clear focus treatment. WCAG 2.2 requires meaningful control and state indicators to reach at least 3:1 non-text contrast against adjacent colors.

Source: [W3C WCAG 2.2, Success Criterion 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### 3. Motion should communicate progress, not decorate the screen

Animation is most useful at the seam where a Field note becomes an Observation: processing feedback, a concise result transition, and a visible Installed base update. Avoid continuous motion or animation that competes with field work.

Source: [Material Design 3, Motion](https://m3.material.io/styles/motion/overview) (first-party design guidance; the page may require JavaScript in text-only clients).

### 4. The product needs task hierarchy rather than more widgets

The screen should lead with the current Visit task: capture a Field note. Installed base exploration follows as a separate workspace region with filters and summary values. This avoids treating the dashboard as a generic collection of cards and keeps the domain vocabulary visible: Field note, Observation, Client, Site, Age, Use, and State.

## Applied direction

- Use a calm medical-tool palette: warm neutral canvas, dark ink, one high-energy action accent, and explicit State labels.
- Make `ObservationCapturePanel` the primary seam: Field note input -> extraction -> review -> saved Observation.
- Make Installed base records scannable: Client and Site hierarchy first, then Modality, brand/model, quantity, Age, Use, and State.
- Keep filters compact and horizontally usable on mobile; make the active filter visibly different by shape, contrast, and text.
- Use short transitions only for extraction, save confirmation, and dashboard refresh.
- Treat Unknown as an honest domain state, not as an error or a visually hidden value.
- Provide text equivalents for every visual state and ensure focus/contrast survives web rendering.

## Sources

- W3C, [Understanding WCAG 2.2 Success Criterion 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Material Design, [Motion overview](https://m3.material.io/styles/motion/overview)
- Apple Developer, [Human Interface Guidelines: Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) (platform reference for touch interaction; content is client-rendered)
