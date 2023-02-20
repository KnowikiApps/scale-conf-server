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

# Logging
`POST <base-url>/logs`

In the header
Authorization: `Bearer {token}`

In the request body
```
{
    "message": "Message to be logged"
}
```

Note: You will need the JWT to be able to post logs.  Check the app repository for more information. 