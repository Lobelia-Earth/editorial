import {
  type EditorialData,
  type EditorialDataItem,
  type EditorialSchema,
} from "@isardsat/editorial-common";

import { getOptionsReference } from "@isardsat/editorial-common";

/**
 * Resolves uploaded file paths to full URLs for an item.
 */
function resolveFileUrls(
  item: EditorialDataItem,
  schema: EditorialSchema,
  itemType: string,
  origin: string,
): EditorialDataItem {
  const resolvedItem = { ...item };
  const itemSchema = schema[itemType];

  if (!itemSchema) return resolvedItem;

  for (const [key, value] of Object.entries(resolvedItem)) {
    if (!itemSchema.fields[key]?.isUploadedFile) continue;
    if (typeof value !== "string") continue;
    if (value.startsWith("http")) continue;

    resolvedItem[key] = `${origin}/${value}`;
  }

  return resolvedItem;
}

/**
 * Resolves referenced fields in an item, replacing IDs with full objects.
 * Recursively resolves nested references.
 */
export function resolveReferences(
  item: EditorialDataItem,
  schema: EditorialSchema,
  itemType: string,
  content: EditorialData,
  origin: string,
  resolvedIds: Set<string> = new Set(),
): EditorialDataItem {
  const itemIdentifier = `${itemType}:${item.id}`;

  // Prevent circular references
  if (resolvedIds.has(itemIdentifier)) {
    return resolveFileUrls(item, schema, itemType, origin);
  }

  resolvedIds.add(itemIdentifier);

  // First resolve file URLs for the current item
  let resolvedItem = resolveFileUrls(item, schema, itemType, origin);
  const itemSchema = schema[itemType];

  if (!itemSchema) return resolvedItem;

  for (const [fieldKey, fieldConfig] of Object.entries(itemSchema.fields)) {
    if (fieldConfig.type !== "select" && fieldConfig.type !== "multiselect") {
      continue;
    }

    const referencedType = getOptionsReference(fieldConfig.options);
    if (!referencedType) continue;

    const referencedCollection = content[referencedType];
    if (!referencedCollection) continue;

    const fieldValue = item[fieldKey];

    if (fieldConfig.type === "select" && typeof fieldValue === "string") {
      // Single reference - replace ID with full object
      const referencedItem = referencedCollection[fieldValue];
      if (referencedItem) {
        // Recursively resolve nested references
        resolvedItem[fieldKey] = resolveReferences(
          referencedItem,
          schema,
          referencedType,
          content,
          origin,
          new Set(resolvedIds),
        );
      }
    } else if (
      fieldConfig.type === "multiselect" &&
      Array.isArray(fieldValue)
    ) {
      // Multiple references - replace IDs with full objects
      resolvedItem[fieldKey] = fieldValue
        .map((id) => {
          const referencedItem = referencedCollection[id];
          if (!referencedItem) return null;
          // Recursively resolve nested references
          return resolveReferences(
            referencedItem,
            schema,
            referencedType,
            content,
            origin,
            new Set(resolvedIds),
          );
        })
        .filter(Boolean);
    }
  }

  return resolvedItem;
}

/**
 * Resolves all references in a collection.
 */
export function resolveCollectionReferences(
  collection: Record<string, EditorialDataItem>,
  schema: EditorialSchema,
  itemType: string,
  content: EditorialData,
  origin: string,
): Record<string, EditorialDataItem> {
  const resolvedCollection: Record<string, EditorialDataItem> = {};

  for (const [itemKey, item] of Object.entries(collection)) {
    resolvedCollection[itemKey] = resolveReferences(
      item,
      schema,
      itemType,
      content,
      origin,
    );
  }

  return resolvedCollection;
}
