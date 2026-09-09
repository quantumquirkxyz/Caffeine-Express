# Mobile-first app with a local-first web dashboard

Status: accepted
Date: 2026-09-09

## Context

QVAC's JS/TS SDK runs on Node.js, Bare, and Expo (Android/iOS). There is no browser runtime for the inference engines — they are native (llamacpp, Whisper/Parakeet, ONNX OCR, vision). A future reader might assume a plain website or a cloud-hosted web app, or might try to call inference APIs directly from a browser. The interface was left free by the problem statement, so the form factor had to be chosen explicitly.

## Decision

The solution ships as a **Web/Mobile app (Android/iOS)**:
- A **field app** built on Expo + the QVAC SDK (native engines) runs on the collaborator's phone and handles all capture and inference fully offline.
- A **web dashboard** (local Node/Electron host, or pure UI hosting) renders the installed-base view, confidence, and renewal analytics. Its inference (natural-language queries) runs on the user's device via QVAC.

Cloud usage is restricted to non-inference concerns (the rules permit interface hosting); the data itself stays local-first because observations are sensitive client information.

## Consequences

- Positive: offline capture in the hospital; the two surfaces (phone capture, desktop analytics) match how the product is actually used; no inference ever needs a cloud endpoint.
- Negative: QVAC engines do not run on emulators — a physical device is required for development and demo; the field app must download and cache models on first use, which needs a visible download lifecycle.
- Follow-up: prove the Expo + QVAC smoke test on a physical device on day 1; keep the dashboard's data path recomputable from Observations so rule changes do not strand materialized state.