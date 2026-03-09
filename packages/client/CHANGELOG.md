# @isardsat/editorial-client

## 6.20.0

### Minor Changes

- 812bf92: M
  - Update delete item UI
  - Fix IDs collision

### Patch Changes

- Updated dependencies [812bf92]
  - @isardsat/editorial-common@6.20.0

## 6.19.5

### Patch Changes

- 5e1246c: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [5e1246c]
  - @isardsat/editorial-common@6.19.5

## 6.19.4

### Patch Changes

- cc2c26a: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [cc2c26a]
  - @isardsat/editorial-common@6.19.4

## 6.19.3

### Patch Changes

- 12d7b41: Ensure URL starts with http or / for image metadata fetching
- Updated dependencies [12d7b41]
  - @isardsat/editorial-common@6.19.3

## 6.19.2

### Patch Changes

- 356dd70: Exclude empty preview values from changed fields comparison
- Updated dependencies [356dd70]
  - @isardsat/editorial-common@6.19.2

## 6.19.1

### Patch Changes

- 7619fb6: Fix backward string multiple compatibility
- Updated dependencies [7619fb6]
  - @isardsat/editorial-common@6.19.1

## 6.19.0

### Minor Changes

- 257f21e: Show notifiations and loading state on all user actions

### Patch Changes

- Updated dependencies [257f21e]
  - @isardsat/editorial-common@6.19.0

## 6.18.2

### Patch Changes

- b3b3572: Fix backward select compatibility
- Updated dependencies [b3b3572]
  - @isardsat/editorial-common@6.18.2

## 6.18.1

### Patch Changes

- 2d743c4: Update content fetching to ensure real-time diff without caching
- Updated dependencies [2d743c4]
  - @isardsat/editorial-common@6.18.1

## 6.18.0

### Minor Changes

- dcbc22f: - Inject Firebase token on each request.
  - Verify Firebase token on the server using Google public keys, requiring no extra configuration on Editorial.
  - Add firebaseAuth middleware to protect routes.

### Patch Changes

- Updated dependencies [dcbc22f]
  - @isardsat/editorial-common@6.18.0

## 6.17.0

### Minor Changes

- 74f9fff: - Adds /api/v1/diff endpoint that compares preview and production data.
  - Adds an unpublished changes table on dashboard showing all pending changes with color-coded status badge.
  - Highlight modified fields in ItemForm with yellow ring and "(modified)" label.
  - Adds delete confirmation dialog to prevent accidental deletions.

### Patch Changes

- Updated dependencies [74f9fff]
  - @isardsat/editorial-common@6.17.0

## 6.16.0

### Minor Changes

- 5ae66db: Improves init command to ensure all required files are created even if the editorial directory already exists.

### Patch Changes

- Updated dependencies [5ae66db]
  - @isardsat/editorial-common@6.16.0

## 6.15.0

### Minor Changes

- 7ff5f4d: - Adds a new /api/v1/meta-schema endpoint that returns the JSON Schema for the Editorial configuration.
  - Includes optional `allowedExtraFields` parameter to allow additional fields not defined in the meta-schema.
  - - Updated the CLI `init` command to automatically add the line `# yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema` to schema.yml

### Patch Changes

- Updated dependencies [7ff5f4d]
  - @isardsat/editorial-common@6.15.0

## 6.14.0

### Minor Changes

- 61cb350: This PR adds:
  - select and multiselect (with maxSelectedItems and 'minSelectedItems` optional fields) field types.
  - Support for dynamic options via $field_name references to populate from other data types.
  - resolve param to /api/v1/data /api/v1/data/{itemType} /api/v1/data/{itemType}/{id} GET endpoints which resolve referenced fields to full objects.

### Patch Changes

- Updated dependencies [61cb350]
  - @isardsat/editorial-common@6.14.0

## 6.13.2

### Patch Changes

- bf07080: Fix upload types
- Updated dependencies [bf07080]
  - @isardsat/editorial-common@6.13.2

## 6.13.1

### Patch Changes

- 9d96ec7: Fix file management
- Updated dependencies [9d96ec7]
  - @isardsat/editorial-common@6.13.1

## 6.13.0

### Minor Changes

- b9794dd: Improved file picker. Now shows file info and a preview version for images.

### Patch Changes

- Updated dependencies [b9794dd]
  - @isardsat/editorial-common@6.13.0

## 6.12.2

### Patch Changes

- 53c1b5d: Fix css export
- Updated dependencies [53c1b5d]
  - @isardsat/editorial-common@6.12.2

## 6.12.1

### Patch Changes

- 27ffefe: Fix react-toolkit exports
- Updated dependencies [27ffefe]
  - @isardsat/editorial-common@6.12.1

## 6.12.0

### Minor Changes

- 63c528e: Add react-toolkit package to export useful react components

### Patch Changes

- Updated dependencies [63c528e]
  - @isardsat/editorial-common@6.12.0

## 6.11.1

### Patch Changes

- fe2f6df: Fix sidebar footer action to stay visible on overflow
  Fix hiding id and set default value when creating a new singleton
  Fix missing collections entries error and clean up deleted editorial item messages on publish
- Updated dependencies [fe2f6df]
  - @isardsat/editorial-common@6.11.1

## 6.11.0

### Minor Changes

- 144ab5c: Added a favicon and displayed the Editorial version in the sidebar.

  Introduced table filtering by a specific element defined in the schema.filterBy.

  Added column sorting support for tables.

### Patch Changes

- Updated dependencies [144ab5c]
  - @isardsat/editorial-common@6.11.0

## 6.10.0

### Minor Changes

- 7383e37: Ui changes and vulnerability fix

### Patch Changes

- Updated dependencies [7383e37]
  - @isardsat/editorial-common@6.10.0

## 6.9.0

### Minor Changes

- 1a359f9: Fixes

### Patch Changes

- Updated dependencies [1a359f9]
  - @isardsat/editorial-common@6.9.0

## 6.8.1

### Patch Changes

- 5d48cdb: Fix validation issues
- Updated dependencies [5d48cdb]
  - @isardsat/editorial-common@6.8.1

## 6.8.0

### Minor Changes

- 57be6b3: UI updates

### Patch Changes

- Updated dependencies [57be6b3]
  - @isardsat/editorial-common@6.8.0

## 6.7.0

### Minor Changes

- 170aed9: Return empty object for valid empty collections

### Patch Changes

- Updated dependencies [170aed9]
  - @isardsat/editorial-common@6.7.0

## 6.6.4

### Patch Changes

- 2bcdf70: Hotfix language caching
- Updated dependencies [2bcdf70]
  - @isardsat/editorial-common@6.6.4

## 6.6.3

### Patch Changes

- 2b5c123: Simple caching solution for data routes
- Updated dependencies [2b5c123]
  - @isardsat/editorial-common@6.6.3

## 6.6.2

### Patch Changes

- 0166adc: Fix loadHook errors
- e2aa063: Add author email handling to onPush
- Updated dependencies [0166adc]
- Updated dependencies [e2aa063]
  - @isardsat/editorial-common@6.6.2

## 6.6.1

### Patch Changes

- a09a4ba: Initial JS client version
- Updated dependencies [a09a4ba]
  - @isardsat/editorial-common@6.6.1
