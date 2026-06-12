# Future demo narrative

This is a future 60-90 second demo narrative. It is not a real execution script and must not be presented as capsule execution.

## Narrative

### 0-10 seconds: open the repo

Show the TransformIA Capsule Launcher README. Explain that this is the public source-available distribution and onboarding surface for TransformIA Capsule.

Say clearly: this repo documents and validates the launcher path, but it does not include the private runtime.

### 10-25 seconds: show quickstart validation

Show the quickstart command that validates repository readiness:

```bash
npm run -s quality
```

Explain that the command checks the public repo boundaries. It does not request API keys, create a real `.env` file, connect providers or execute capsules.

### 25-45 seconds: show template manifests

Open the public template manifest catalog. Explain that manifests preview future template directions, business jobs and safety boundaries.

Say clearly: these are manifest-only previews, not executable templates.

### 45-60 seconds: show local/BYOK config scaffold

Open `config/local-byok.config.example.json` and the local/BYOK config scaffold documentation. Explain that the scaffold shows where future local configuration will live.

Say clearly: no provider is configured and no local execution is enabled by this scaffold.

### 60-75 seconds: explain private core and Cloud handoff

Show the private core boundary and Cloud handoff boundary docs. Explain that the private runtime remains private and Cloud is a future handoff path, not an active sync path in this repo.

### 75-90 seconds: position the product

Explain how this fits TransformIA Capsule: the launcher makes adoption, boundaries and future distribution legible, while governed execution remains a separate private-runtime responsibility until implemented and approved.

End with a feedback ask: review the README, manifests, config scaffold and claim-safe matrix before future launcher execution work lands.
