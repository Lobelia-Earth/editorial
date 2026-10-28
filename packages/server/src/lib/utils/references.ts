import {
  getBlockSchema,
  getChoicesReference,
  type EditorialData,
  type EditorialDataItem,
  type EditorialSchema,
  type EditorialSchemaItem,
} from "@isardsat/editorial-common";

import { type Storage } from "../storage.js";

type SchemaFields = EditorialSchemaItem["fields"];

/**
 * Prefixes uploaded file paths with the files origin.
 */
function resolveFileUrlFields(
  values: Record<string, unknown>,
  fields: SchemaFields,
  origin: string,
): Record<string, unknown> {
  const resolvedValues = { ...values };

  for (const [key, value] of Object.entries(resolvedValues)) {
    const fieldConfig = fields[key];
    if (!fieldConfig) continue;

    if (fieldConfig.type === "blocks") {
      if (!Array.isArray(value)) continue;

      resolvedValues[key] = value.map((block) => {
        const blockSchema = getBlockSchema(fieldConfig, block);
        if (!blockSchema) return block;

        return resolveFileUrlFields(block, blockSchema.fields, origin);
      });
      continue;
    }

    if (!fieldConfig.isUploadedFile) continue;
    if (typeof value !== "string") continue;
    if (value.startsWith("http")) continue;

    resolvedValues[key] = `${origin}/${value}`;
  }

  return resolvedValues;
}

/**
 * Resolves uploaded file paths to full URLs for an item, including the
 * uploaded files inside "blocks" fields.
 */
export function resolveFileUrls(
  item: EditorialDataItem,
  schema: EditorialSchema,
  itemType: string,
  origin: string,
): EditorialDataItem {
  const itemSchema = schema[itemType];

  if (!itemSchema) return { ...item };

  return resolveFileUrlFields(
    item,
    itemSchema.fields,
    origin,
  ) as EditorialDataItem;
}

/**
 * Replaces referenced IDs with full objects in the given values.
 * Values of "blocks" fields are resolved block by block.
 */
function resolveReferenceFields(
  values: Record<string, unknown>,
  fields: SchemaFields,
  schema: EditorialSchema,
  content: EditorialData,
  origin: string,
  resolvedIds: Set<string>,
): Record<string, unknown> {
  const resolvedValues = { ...values };

  for (const [fieldKey, fieldConfig] of Object.entries(fields)) {
    const fieldValue = values[fieldKey];

    if (fieldConfig.type === "blocks") {
      if (!Array.isArray(fieldValue)) continue;

      resolvedValues[fieldKey] = fieldValue.map((block) => {
        const blockSchema = getBlockSchema(fieldConfig, block);
        if (!blockSchema) return block;

        return resolveReferenceFields(
          block,
          blockSchema.fields,
          schema,
          content,
          origin,
          resolvedIds,
        );
      });
      continue;
    }

    if (fieldConfig.type !== "select" && fieldConfig.type !== "multiselect") {
      continue;
    }

    const referencedType = getChoicesReference(fieldConfig.choicesFixed);
    if (!referencedType) continue;

    const referencedCollection = content[referencedType];
    if (!referencedCollection) continue;

    if (fieldConfig.type === "select" && typeof fieldValue === "string") {
      // Single reference - replace ID with full object
      const referencedItem = referencedCollection[fieldValue];
      if (referencedItem) {
        // Recursively resolve nested references
        resolvedValues[fieldKey] = resolveReferences(
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
      resolvedValues[fieldKey] = fieldValue
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

  return resolvedValues;
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
  const resolvedItem = resolveFileUrls(item, schema, itemType, origin);
  const itemSchema = schema[itemType];

  if (!itemSchema) return resolvedItem;

  return resolveReferenceFields(
    resolvedItem,
    itemSchema.fields,
    schema,
    content,
    origin,
    resolvedIds,
  ) as EditorialDataItem;
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

/**
 * Renames or removes references to `oldId` in the given values.
 * Returns the patched values, or null if nothing changed.
 */
function patchReferenceFields(
  values: Record<string, any>,
  fields: Record<string, any>,
  targetType: string,
  oldId: string,
  newId?: string | null,
): Record<string, any> | null {
  let changed = false;
  const patchedValues: Record<string, any> = { ...values };

  for (const [fieldKey, fieldConfig] of Object.entries(fields)) {
    const value = patchedValues[fieldKey];

    if (fieldConfig.type === "blocks") {
      if (!Array.isArray(value)) continue;

      let blocksChanged = false;
      const nextBlocks = value.map((block) => {
        const blockSchema = getBlockSchema(fieldConfig, block);
        if (!blockSchema) return block;

        const patchedBlock = patchReferenceFields(
          block,
          blockSchema.fields,
          targetType,
          oldId,
          newId,
        );
        if (!patchedBlock) return block;

        blocksChanged = true;
        return patchedBlock;
      });

      if (blocksChanged) {
        patchedValues[fieldKey] = nextBlocks;
        changed = true;
      }
      continue;
    }

    if (fieldConfig.type !== "select" && fieldConfig.type !== "multiselect") {
      continue;
    }
    if (getChoicesReference(fieldConfig.choicesFixed) !== targetType) {
      continue;
    }

    if (fieldConfig.type === "select") {
      if (value === oldId) {
        patchedValues[fieldKey] = newId ?? null; // rename or remove
        changed = true;
      }
    } else if (Array.isArray(value)) {
      let next: string[];
      if (newId != null) {
        next = value.map((v) => (v === oldId ? newId : v));
      } else {
        next = value.filter((v) => v !== oldId); // remove
      }
      if (next.length !== value.length || next.some((v, i) => v !== value[i])) {
        patchedValues[fieldKey] = next;
        changed = true;
      }
    }
  }

  return changed ? patchedValues : null;
}

export async function updateOrRemoveReferences(params: {
  schema: any;
  content: Record<string, Record<string, any>>;
  storage: Storage;
  targetType: string;
  oldId: string;
  newId?: string | null; // if null, remove references
}) {
  const { schema, content, storage, targetType, oldId, newId } = params;

  for (const [containerType, containerSchema] of Object.entries(schema)) {
    const fields = (containerSchema as any).fields || {};
    const collection = content[containerType] || {};

    for (const [itemId, item] of Object.entries(collection)) {
      const patchedItem = patchReferenceFields(
        item,
        fields,
        targetType,
        oldId,
        newId,
      );

      if (patchedItem) {
        await storage.updateItem({
          ...patchedItem,
          type: containerType,
          id: itemId,
        });
      }
    }
  }
}
