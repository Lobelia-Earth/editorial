import { type EditorialDataItem } from "@isardsat/editorial-common";

/**
 * Compares two items and returns the list of fields that have changed.
 * Excludes metadata fields like 'updatedAt'.
 */
export function getChangedFields(
  previewItem: EditorialDataItem,
  productionItem: EditorialDataItem,
): string[] {
  const changedFields: string[] = [];
  const excludedFields = ["updatedAt", "createdAt"];

  // Get all unique keys from both items
  const allKeys = new Set([
    ...Object.keys(previewItem),
    ...Object.keys(productionItem),
  ]);

  for (const key of allKeys) {
    if (excludedFields.includes(key)) continue;

    const previewValue = previewItem[key];
    const productionValue = productionItem[key];

    if (!deepEqual(previewValue, productionValue)) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

/**
 * Deep equality comparison for values.
 */
export function deepEqual(value1: unknown, value2: unknown): boolean {
  if (value1 === value2) return true;
  if (value1 == null || value2 == null) return false;
  if (typeof value1 !== typeof value2) return false;

  if (typeof value1 !== "object") {
    return value1 === value2;
  }

  if (Array.isArray(value1) !== Array.isArray(value2)) return false;

  if (Array.isArray(value1)) {
    if (value1.length !== (value2 as unknown[]).length) return false;
    return value1.every((item, index) =>
      deepEqual(item, (value2 as unknown[])[index]),
    );
  }

  const keys1 = Object.keys(value1);
  const keys2 = Object.keys(value2 as object);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) =>
    deepEqual(
      (value1 as Record<string, unknown>)[key],
      (value2 as Record<string, unknown>)[key],
    ),
  );
}
