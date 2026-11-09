/**
 * Preview settings shared by the React and Vue toolkits, so both read and
 * write the same values and stay in sync on the same page.
 *
 * Exported on its own entry point (`@isardsat/editorial-common/preview`) so
 * the toolkits can bundle them without the rest of this package.
 */

/** `localStorage` key of the "Show Editorial shortcuts" toggle. */
export const EDITION_MODE_STORAGE_KEY = "isEditionMode";

/** `localStorage` key of the "Always display preview indicator" toggle. */
export const ALWAYS_SHOW_PREVIEW_INDICATOR_STORAGE_KEY =
  "alwaysShowPreviewIndicator";

/** Event dispatched on `window` to sync `localStorage` changes in the same tab. */
export const LOCAL_STORAGE_EVENT = "mantine-local-storage";
