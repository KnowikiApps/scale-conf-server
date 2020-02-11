# Description

Backend server application for the SCaLE Mobile App

# How to run the app locally

```bash
DEBUG=scale-conf-server:* & npm start
```

# Getting Started

Requires [NodeJS](https://nodejs.org/en/).  Recommended minimum version 12.14.

Install dependencies:

```bash
npm install
```

# Dev actions

Run tests: `npm test`

Run lint: `npm run lint`.

Autocorrect lint issues: `npx standard --fix`

Verify json schemas.

    pip install jsonschema
    jsonschema -i __tests__/services/fixtures/schedule_sample.json docs/events-schema.json
    jsonschema -i __tests__/services/fixtures/speaker_sample.json docs/speakers-schema.json