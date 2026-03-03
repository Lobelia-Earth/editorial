---
"@isardsat/editorial-admin": minor
"@isardsat/editorial-cli": minor
"@isardsat/editorial-client": minor
"@isardsat/editorial-common": minor
"@isardsat/create-editorial": minor
"@isardsat/editorial-react-toolkit": minor
"@isardsat/editorial-server": minor
---

- Adds a new /api/v1/meta-schema endpoint that returns the JSON Schema for the Editorial configuration.
- Includes optional `allowedExtraFields` parameter to allow additional fields not defined in the meta-schema.
- - Updated the CLI `init` command to automatically add the line `# yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema` to schema.yml
