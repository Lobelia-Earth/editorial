# @isardsat/editorial-server

## 6.19.5

### Patch Changes

- 5e1246c: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [5e1246c]
  - @isardsat/editorial-admin@6.19.5
  - @isardsat/editorial-common@6.19.5

## 6.19.4

### Patch Changes

- cc2c26a: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [cc2c26a]
  - @isardsat/editorial-admin@6.19.4
  - @isardsat/editorial-common@6.19.4

## 6.19.3

### Patch Changes

- 12d7b41: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [12d7b41]
  - @isardsat/editorial-admin@6.19.3
  - @isardsat/editorial-common@6.19.3

## 6.19.2

### Patch Changes

- 356dd70: Exclude empty preview values from changed fields comparison
- Updated dependencies [356dd70]
  - @isardsat/editorial-admin@6.19.2
  - @isardsat/editorial-common@6.19.2

## 6.19.1

### Patch Changes

- 7619fb6: Fix backward string multiple compatibility
- Updated dependencies [7619fb6]
  - @isardsat/editorial-admin@6.19.1
  - @isardsat/editorial-common@6.19.1

## 6.19.0

### Minor Changes

- 257f21e: Show notifiations and loading state on all user actions

### Patch Changes

- Updated dependencies [257f21e]
  - @isardsat/editorial-admin@6.19.0
  - @isardsat/editorial-common@6.19.0

## 6.18.2

### Patch Changes

- b3b3572: Fix backward select compatibility
- Updated dependencies [b3b3572]
  - @isardsat/editorial-admin@6.18.2
  - @isardsat/editorial-common@6.18.2

## 6.18.1

### Patch Changes

- 2d743c4: Update content fetching to ensure real-time diff without caching
- Updated dependencies [2d743c4]
  - @isardsat/editorial-admin@6.18.1
  - @isardsat/editorial-common@6.18.1

## 6.18.0

### Minor Changes

- dcbc22f: - Inject Firebase token on each request.
  - Verify Firebase token on the server using Google public keys, requiring no extra configuration on Editorial.
  - Add firebaseAuth middleware to protect routes.

### Patch Changes

- Updated dependencies [dcbc22f]
  - @isardsat/editorial-admin@6.18.0
  - @isardsat/editorial-common@6.18.0

## 6.17.0

### Minor Changes

- 74f9fff: - Adds /api/v1/diff endpoint that compares preview and production data.
  - Adds an unpublished changes table on dashboard showing all pending changes with color-coded status badge.
  - Highlight modified fields in ItemForm with yellow ring and "(modified)" label.
  - Adds delete confirmation dialog to prevent accidental deletions.

### Patch Changes

- Updated dependencies [74f9fff]
  - @isardsat/editorial-admin@6.17.0
  - @isardsat/editorial-common@6.17.0

## 6.16.0

### Minor Changes

- 5ae66db: Improves init command to ensure all required files are created even if the editorial directory already exists.

### Patch Changes

- Updated dependencies [5ae66db]
  - @isardsat/editorial-admin@6.16.0
  - @isardsat/editorial-common@6.16.0

## 6.15.0

### Minor Changes

- 7ff5f4d: - Adds a new /api/v1/meta-schema endpoint that returns the JSON Schema for the Editorial configuration.
  - Includes optional `allowedExtraFields` parameter to allow additional fields not defined in the meta-schema.
  - - Updated the CLI `init` command to automatically add the line `# yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema` to schema.yml

### Patch Changes

- Updated dependencies [7ff5f4d]
  - @isardsat/editorial-admin@6.15.0
  - @isardsat/editorial-common@6.15.0

## 6.14.0

### Minor Changes

- 61cb350: This PR adds:
  - select and multiselect (with maxSelectedItems and 'minSelectedItems` optional fields) field types.
  - Support for dynamic options via $field_name references to populate from other data types.
  - resolve param to /api/v1/data /api/v1/data/{itemType} /api/v1/data/{itemType}/{id} GET endpoints which resolve referenced fields to full objects.

### Patch Changes

- Updated dependencies [61cb350]
  - @isardsat/editorial-admin@6.14.0
  - @isardsat/editorial-common@6.14.0

## 6.13.2

### Patch Changes

- bf07080: Fix upload types
- Updated dependencies [bf07080]
  - @isardsat/editorial-admin@6.13.2
  - @isardsat/editorial-common@6.13.2

## 6.13.1

### Patch Changes

- 9d96ec7: Fix file management
- Updated dependencies [9d96ec7]
  - @isardsat/editorial-admin@6.13.1
  - @isardsat/editorial-common@6.13.1

## 6.13.0

### Minor Changes

- b9794dd: Improved file picker. Now shows file info and a preview version for images.

### Patch Changes

- Updated dependencies [b9794dd]
  - @isardsat/editorial-admin@6.13.0
  - @isardsat/editorial-common@6.13.0

## 6.12.2

### Patch Changes

- 53c1b5d: Fix css export
- Updated dependencies [53c1b5d]
  - @isardsat/editorial-admin@6.12.2
  - @isardsat/editorial-common@6.12.2

## 6.12.1

### Patch Changes

- 27ffefe: Fix react-toolkit exports
- Updated dependencies [27ffefe]
  - @isardsat/editorial-admin@6.12.1
  - @isardsat/editorial-common@6.12.1

## 6.12.0

### Minor Changes

- 63c528e: Add react-toolkit package to export useful react components

### Patch Changes

- Updated dependencies [63c528e]
  - @isardsat/editorial-admin@6.12.0
  - @isardsat/editorial-common@6.12.0

## 6.11.1

### Patch Changes

- fe2f6df: Fix sidebar footer action to stay visible on overflow
  Fix hiding id and set default value when creating a new singleton
  Fix missing collections entries error and clean up deleted editorial item messages on publish
- Updated dependencies [fe2f6df]
  - @isardsat/editorial-admin@6.11.1
  - @isardsat/editorial-common@6.11.1

## 6.11.0

### Minor Changes

- 144ab5c: Added a favicon and displayed the Editorial version in the sidebar.

  Introduced table filtering by a specific element defined in the schema.filterBy.

  Added column sorting support for tables.

### Patch Changes

- Updated dependencies [144ab5c]
  - @isardsat/editorial-admin@6.11.0
  - @isardsat/editorial-common@6.11.0

## 6.10.0

### Minor Changes

- 7383e37: Ui changes and vulnerability fix

### Patch Changes

- Updated dependencies [7383e37]
  - @isardsat/editorial-admin@6.10.0
  - @isardsat/editorial-common@6.10.0

## 6.9.0

### Minor Changes

- 1a359f9: Fixes

### Patch Changes

- Updated dependencies [1a359f9]
  - @isardsat/editorial-admin@6.9.0
  - @isardsat/editorial-common@6.9.0

## 6.8.1

### Patch Changes

- 5d48cdb: Fix validation issues
- Updated dependencies [5d48cdb]
  - @isardsat/editorial-admin@6.8.1
  - @isardsat/editorial-common@6.8.1

## 6.8.0

### Minor Changes

- 57be6b3: UI updates

### Patch Changes

- Updated dependencies [57be6b3]
  - @isardsat/editorial-admin@6.8.0
  - @isardsat/editorial-common@6.8.0

## 6.7.0

### Minor Changes

- 170aed9: Return empty object for valid empty collections

### Patch Changes

- Updated dependencies [170aed9]
  - @isardsat/editorial-admin@6.7.0
  - @isardsat/editorial-common@6.7.0

## 6.6.4

### Patch Changes

- 2bcdf70: Hotfix language caching
- Updated dependencies [2bcdf70]
  - @isardsat/editorial-admin@6.6.4
  - @isardsat/editorial-common@6.6.4

## 6.6.3

### Patch Changes

- 2b5c123: Simple caching solution for data routes
- Updated dependencies [2b5c123]
  - @isardsat/editorial-admin@6.6.3
  - @isardsat/editorial-common@6.6.3

## 6.6.2

### Patch Changes

- 0166adc: Fix loadHook errors
- e2aa063: Add author email handling to onPush
- Updated dependencies [0166adc]
- Updated dependencies [e2aa063]
  - @isardsat/editorial-admin@6.6.2
  - @isardsat/editorial-common@6.6.2

## 6.6.1

### Patch Changes

- a09a4ba: Initial JS client version
- Updated dependencies [a09a4ba]
  - @isardsat/editorial-admin@6.6.1
  - @isardsat/editorial-common@6.6.1

## 6.6.0

### Minor Changes

- 86b73ad: Improved UI

### Patch Changes

- Updated dependencies [86b73ad]
  - @isardsat/editorial-admin@6.6.0
  - @isardsat/editorial-common@6.6.0

## 6.5.1

### Patch Changes

- b1fd4db: onPublish hook fix
- Updated dependencies [b1fd4db]
  - @isardsat/editorial-admin@6.5.1
  - @isardsat/editorial-common@6.5.1

## 6.5.0

### Minor Changes

- ce5bda1: Fix preview data

### Patch Changes

- Updated dependencies [ce5bda1]
  - @isardsat/editorial-admin@6.5.0
  - @isardsat/editorial-common@6.5.0

## 6.4.4

### Patch Changes

- bd3d115: Fix preview urls
- Updated dependencies [bd3d115]
  - @isardsat/editorial-admin@6.4.4
  - @isardsat/editorial-common@6.4.4

## 6.4.3

### Patch Changes

- 293ea77: Fix vite base path in production
- Updated dependencies [293ea77]
  - @isardsat/editorial-admin@6.4.3
  - @isardsat/editorial-common@6.4.3

## 6.4.2

### Patch Changes

- 31f3669: Fix base path in vite
- Updated dependencies [31f3669]
  - @isardsat/editorial-admin@6.4.2
  - @isardsat/editorial-common@6.4.2

## 6.4.1

### Patch Changes

- 100d974: Fix build errors
- Updated dependencies [100d974]
  - @isardsat/editorial-admin@6.4.1
  - @isardsat/editorial-common@6.4.1

## 6.4.0

### Minor Changes

- 34be523: Add large file handling

### Patch Changes

- Updated dependencies [34be523]
  - @isardsat/editorial-admin@6.4.0
  - @isardsat/editorial-common@6.4.0

## 6.3.3

### Patch Changes

- 1c24053: Build fix
- Updated dependencies [1c24053]
  - @isardsat/editorial-admin@6.3.3
  - @isardsat/editorial-common@6.3.3

## 6.3.2

### Patch Changes

- a34991f: Fix admin panel file picker url
- Updated dependencies [a34991f]
  - @isardsat/editorial-admin@6.3.2
  - @isardsat/editorial-common@6.3.2

## 6.3.1

### Patch Changes

- f6e9203: Fix admin error
- Updated dependencies [f6e9203]
  - @isardsat/editorial-admin@6.3.1
  - @isardsat/editorial-common@6.3.1

## 6.3.0

### Minor Changes

- 0e815f9: Fix admin panel auth

### Patch Changes

- Updated dependencies [0e815f9]
  - @isardsat/editorial-admin@6.3.0
  - @isardsat/editorial-common@6.3.0

## 6.2.0

### Minor Changes

- ab4aea4: Admin panel firebase rework

### Patch Changes

- Updated dependencies [ab4aea4]
  - @isardsat/editorial-admin@6.2.0
  - @isardsat/editorial-common@6.2.0

## 6.1.2

### Patch Changes

- d5ecd27: Re-release
- Updated dependencies [d5ecd27]
  - @isardsat/editorial-common@6.1.2
  - @isardsat/editorial-admin@6.1.2

## 6.1.1

### Patch Changes

- 0aaf9cf: Fix hardcoded url
- Updated dependencies [0aaf9cf]
  - @isardsat/editorial-common@6.1.1
  - @isardsat/editorial-admin@6.1.1

## 6.1.0

### Minor Changes

- 7f98a4e: Release bump

### Patch Changes

- Updated dependencies [7f98a4e]
  - @isardsat/editorial-common@6.1.0
  - @isardsat/editorial-admin@6.1.0

## 6.0.6

### Patch Changes

- 24fb391: Add url to zod types
- Updated dependencies [24fb391]
  - @isardsat/editorial-common@6.0.6
  - @isardsat/editorial-admin@6.0.6

## 6.0.5

### Patch Changes

- bcb0c8a: Fix admin URLs
- Updated dependencies [bcb0c8a]
  - @isardsat/editorial-common@6.0.5
  - @isardsat/editorial-admin@6.0.5

## 6.0.4

### Patch Changes

- 4936462: Fix broken release
- Updated dependencies [4936462]
  - @isardsat/editorial-common@6.0.4
  - @isardsat/editorial-admin@6.0.4

## 6.0.3

### Patch Changes

- 0c196b0: Fix build errors
- Updated dependencies [0c196b0]
  - @isardsat/editorial-common@6.0.3
  - @isardsat/editorial-admin@6.0.3

## 6.0.2

### Patch Changes

- @isardsat/editorial-admin@6.0.2
- @isardsat/editorial-common@6.0.2

## 6.0.1

### Patch Changes

- @isardsat/editorial-admin@6.0.1
- @isardsat/editorial-common@6.0.1
