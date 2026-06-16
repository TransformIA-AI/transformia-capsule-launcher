# Screenshot and GIF Checklist v0.6

Atlas scope: `v0.6-H02 + v0.6-H07 unified capability pack`.

All visuals must match implemented public surfaces. Do not create fake UI, fake execution logs, fake connector runs, fake payment screens or fake customer data.

## Required visual concepts

### 1. Hero

- Show the repository README header.
- Show source-available and private-core boundary badges.
- Avoid implying a shipped installer or executable product.

### 2. Template selection

- Show manifest filenames or a static manifest catalog.
- Label templates as previews.
- Do not show runnable connector steps.

### 3. Activation checklist

- Show clone, install dependencies and validation commands.
- Label this as readiness validation.
- Do not show real credentials or provider dashboards.

### 4. Launch cockpit

- Show launch-kit docs and checklist items.
- Label copy as draft and human-reviewed.
- Do not imply Product Hunt submission was automated.

### 5. Security / no-live boundary

- Show what the repo does not do.
- Include no secrets, no live connectors, no checkout and no private core.
- Avoid scary or absolute security guarantees.

### 6. Cloud / Launcher comparison

- Show Launcher as public docs, validation and local/BYOK posture.
- Show Cloud Trial as future handoff.
- Do not show Cloud auth, sync, billing or tenant screens.

## GIF acceptance checklist

- Captures only public repo files.
- Shows `npm run -s validate:launch-docs` or `npm run -s quality` passing.
- Contains no credentials, tokens, customer names or private paths.
- Contains no generated binaries or installers.
- Contains no provider library setup or live connector output.
- Includes a visible caption that this is public launcher readiness, not runtime execution.
