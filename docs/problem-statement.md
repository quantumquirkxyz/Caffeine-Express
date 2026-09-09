# Problem Statement — Field Equipment Capture

Build a prototype that turns what a field collaborator observes in a hospital into structured, reliable data about installed medical equipment, with capture as simple as a conversation and inference running on the device.

## The problem

Service engineers, sales people, and specialists visit hospitals and clinics every day. They see how many MRI scanners, CT scanners, or ultrasound machines each client has, which brands, and how old the equipment looks. Today that knowledge stays in personal notes, conversations, or memory: capturing it by hand takes time, descriptions are inconsistent, several people report the same equipment, and observations are usually partial. The result is an organization with little visibility into the real technological landscape of its clients.

## Why on-device

The collaborator is inside a hospital, frequently without stable connectivity, and what they see is sensitive client information. Capture and extraction must work without the internet and without sending the content to an external service. That is exactly what QVAC enables. This constraint is recorded as an accepted decision in `docs/adr/0001-on-device-qvac-inference.md`.

## The mission

After a visit, the collaborator opens the app and says or types something like:

> "I'm at Hospital DemoCare Pacific in Panama. There's a CT scanner. One of the MRIs looks about eight years old."

The MVP must interpret the typed message; extract client, city, country, modality, quantity, brand, model, Age, and Use when present; persist unresolved required Age as `Unknown`; and store the Observation in a structured repository. Over time those observations compose a live view of the installed base per Client and per geography. Follow-up questions, voice, and photo-assisted capture are post-MVP extensions.

## Minimum viable prototype

The current implementation focus is this MVP. Post-MVP goals are intentionally deferred until the MVP is complete.

- Natural-language capture of an observation.
- AI extraction of structured equipment information, tolerating incomplete data.
- Storage in a structured dataset, with a state per observation: Confirmed, Reported, Estimated, or Unknown.
- Installed-base view at the client level.
- Basic aggregation or visualization across several clients.

## Post-MVP goals

- Dictation with Parakeet speech-to-text.
- Camera capture of equipment plates.
- OCR and VisionPsy extraction of brand, model, and manufacturing year.
- Automatic follow-up questions for Unknown fields.
- Independent confirmation, conflict handling, and peer-to-peer synchronization.
- Natural-language queries, freshness, Age and Use analytics, and renewal opportunity identification.

## Binding technical requirement

The solution must use **QVAC** with inference on the device or delegated peer-to-peer. Solutions that send inference to a cloud API do not qualify for this challenge or the general ranking, regardless of result quality. ISD verifies this requirement before handing deliveries over to Philips. The MVP interface is the mobile/web app; voice and camera capture are post-MVP capabilities.

## Domain decisions

The shared domain model behind this statement is captured in the **Language — Field equipment capture** glossary in `CONTEXT.md` (Field note, Observation, Modality, Age, Comment, Client, Site, State, Installed equipment, Conflicting observation, Independent confirmation, Installed base, Confidence score, Renewal opportunity) and the architecture decisions in `docs/adr/`.
