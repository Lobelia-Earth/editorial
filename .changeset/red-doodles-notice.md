---
"@isardsat/editorial-admin": minor
"@isardsat/editorial-cli": minor
"@isardsat/editorial-client": minor
"@isardsat/editorial-common": minor
"@isardsat/create-editorial": minor
"@isardsat/editorial-react-toolkit": minor
"@isardsat/editorial-server": minor
---

This PR adds:

- select and multiselect (with maxSelectedItems and 'minSelectedItems` optional fields) field types.
- Support for dynamic options via $field_name references to populate from other data types.
- resolve param to /api/v1/data /api/v1/data/{itemType} /api/v1/data/{itemType}/{id} GET endpoints which resolve referenced fields to full objects.
