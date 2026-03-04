# @isardsat/editorial-react-toolkit

## 6.17.0

### Minor Changes

- 74f9fff: - Adds /api/v1/diff endpoint that compares preview and production data.
  - Adds an unpublished changes table on dashboard showing all pending changes with color-coded status badge.
  - Highlight modified fields in ItemForm with yellow ring and "(modified)" label.
  - Adds delete confirmation dialog to prevent accidental deletions.

## 6.16.0

### Minor Changes

- 5ae66db: Improves init command to ensure all required files are created even if the editorial directory already exists.

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
