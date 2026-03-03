# @isardsat/create-editorial

## 6.15.0

### Minor Changes

- 7ff5f4d: - Adds a new /api/v1/meta-schema endpoint that returns the JSON Schema for the Editorial configuration.
  - Includes optional `allowedExtraFields` parameter to allow additional fields not defined in the meta-schema.
  - - Updated the CLI `init` command to automatically add the line `# yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema` to schema.yml

## 6.14.0

### Minor Changes

- 61cb350: This PR adds:
  - select and multiselect (with maxSelectedItems and 'minSelectedItems` optional fields) field types.
  - Support for dynamic options via $field_name references to populate from other data types.
  - resolve param to /api/v1/data /api/v1/data/{itemType} /api/v1/data/{itemType}/{id} GET endpoints which resolve referenced fields to full objects.

## 6.13.2

### Patch Changes

- bf07080: Fix upload types

## 6.13.1

### Patch Changes

- 9d96ec7: Fix file management

## 6.13.0

### Minor Changes

- b9794dd: Improved file picker. Now shows file info and a preview version for images.

## 6.12.2

### Patch Changes

- 53c1b5d: Fix css export

## 6.12.1

### Patch Changes

- 27ffefe: Fix react-toolkit exports

## 6.12.0

### Minor Changes

- 63c528e: Add react-toolkit package to export useful react components

## 6.11.1

### Patch Changes

- fe2f6df: Fix sidebar footer action to stay visible on overflow
  Fix hiding id and set default value when creating a new singleton
  Fix missing collections entries error and clean up deleted editorial item messages on publish

## 6.11.0

### Minor Changes

- 144ab5c: Added a favicon and displayed the Editorial version in the sidebar.

  Introduced table filtering by a specific element defined in the schema.filterBy.

  Added column sorting support for tables.

## 6.10.0

### Minor Changes

- 7383e37: Ui changes and vulnerability fix

## 6.9.0

### Minor Changes

- 1a359f9: Fixes

## 6.8.1

### Patch Changes

- 5d48cdb: Fix validation issues

## 6.8.0

### Minor Changes

- 57be6b3: UI updates

## 6.7.0

### Minor Changes

- 170aed9: Return empty object for valid empty collections

## 6.6.4

### Patch Changes

- 2bcdf70: Hotfix language caching

## 6.6.3

### Patch Changes

- 2b5c123: Simple caching solution for data routes

## 6.6.2

### Patch Changes

- 0166adc: Fix loadHook errors
- e2aa063: Add author email handling to onPush

## 6.6.1

### Patch Changes

- a09a4ba: Initial JS client version

## 6.6.0

### Minor Changes

- 86b73ad: Improved UI

## 6.5.1

### Patch Changes

- b1fd4db: onPublish hook fix

## 6.5.0

### Minor Changes

- ce5bda1: Fix preview data

## 6.4.4

### Patch Changes

- bd3d115: Fix preview urls

## 6.4.3

### Patch Changes

- 293ea77: Fix vite base path in production

## 6.4.2

### Patch Changes

- 31f3669: Fix base path in vite

## 6.4.1

### Patch Changes

- 100d974: Fix build errors

## 6.4.0

### Minor Changes

- 34be523: Add large file handling

## 6.3.3

### Patch Changes

- 1c24053: Build fix

## 6.3.2

### Patch Changes

- a34991f: Fix admin panel file picker url

## 6.3.1

### Patch Changes

- f6e9203: Fix admin error

## 6.3.0

### Minor Changes

- 0e815f9: Fix admin panel auth

## 6.2.0

### Minor Changes

- ab4aea4: Admin panel firebase rework

## 6.1.2

### Patch Changes

- d5ecd27: Re-release

## 6.1.1

### Patch Changes

- 0aaf9cf: Fix hardcoded url

## 6.1.0

### Minor Changes

- 7f98a4e: Release bump

## 6.0.6

### Patch Changes

- 24fb391: Add url to zod types

## 6.0.5

### Patch Changes

- bcb0c8a: Fix admin URLs

## 6.0.4

### Patch Changes

- 4936462: Fix broken release

## 6.0.3

### Patch Changes

- 0c196b0: Fix build errors

## 6.0.2

## 6.0.1
