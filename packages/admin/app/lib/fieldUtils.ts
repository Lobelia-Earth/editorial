import {
  getBlockSchema,
  getChoicesReference,
  RGBColorSchema,
  type EditorialData,
  type EditorialSchemaBlock,
  type EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { z } from "zod";

export type SchemaField = EditorialSchemaItem["fields"][string];

export type FieldFormValue = string | string[] | BlockFormValue[];

/**
 * Form values as seen by single-field inputs, which never hold blocks.
 */
export type FieldInputFormValues = Record<string, string | string[]>;

/**
 * Form value of a block. Fields use the same string-based format as
 * top-level fields.
 */
export type BlockFormValue = { _block: string } & Record<
  string,
  string | string[]
>;

/**
 * Whether the field is rendered as a select/multiselect with choices,
 * including backwards compatibility for string fields with isMultiple.
 */
export const hasFieldChoices = (field: SchemaField) =>
  field.type === "select" ||
  field.type === "multiselect" ||
  (field.type === "string" && !!field.isMultiple && !!field.choicesFixed);

/**
 * Converts a stored value to the string-based format used by the form.
 */
export function getFieldDefaultValue(
  field: SchemaField,
  value: unknown,
): FieldFormValue {
  if (field.type === "blocks") {
    return Array.isArray(value)
      ? value.map((block) => getBlockFormValue(field, block))
      : [];
  }

  if (value !== undefined && value !== null) {
    if (field.type === "boolean") {
      return String(value);
    }
    if (field.type === "multiselect") {
      // Keep multiselect as array
      return Array.isArray(value) ? value : [value as string];
    }
    return String(value);
  }

  // Default values for new items
  if (field.type === "boolean") {
    return "false";
  }
  if (field.type === "multiselect") {
    return [];
  }
  return "";
}

function getBlockFields(block: EditorialSchemaBlock) {
  return Object.entries(block.fields);
}

/**
 * Converts a stored block to the form format. Blocks whose type is not in the
 * schema are kept as they are.
 */
function getBlockFormValue(field: SchemaField, block: unknown): BlockFormValue {
  const blockSchema = getBlockSchema(field, block);
  const values = block as BlockFormValue;
  if (!blockSchema) return values;

  return {
    ...values,
    ...Object.fromEntries(
      getBlockFields(blockSchema).map(([key, blockField]) => [
        key,
        getFieldDefaultValue(blockField, values[key]) as string | string[],
      ]),
    ),
  };
}

/**
 * Returns the form value of a new, empty block of the given type.
 */
export function getNewBlockFormValue(
  block: EditorialSchemaBlock,
  blockType: string,
): BlockFormValue {
  return {
    _block: blockType,
    ...Object.fromEntries(
      getBlockFields(block).map(([key, blockField]) => [
        key,
        getFieldDefaultValue(blockField, undefined) as string | string[],
      ]),
    ),
  };
}

/**
 * Converts a form value back to the format stored in the data files.
 */
export function getFieldStoredValue(
  field: SchemaField,
  value: unknown,
): unknown {
  if (field.type === "boolean") {
    return value === "true";
  }

  if (field.type === "blocks" && Array.isArray(value)) {
    return value.map((block) => {
      const blockSchema = getBlockSchema(field, block);
      if (!blockSchema) return block;

      return {
        ...block,
        ...Object.fromEntries(
          getBlockFields(blockSchema).map(([key, blockField]) => [
            key,
            getFieldStoredValue(blockField, block[key]),
          ]),
        ),
      };
    });
  }

  // Other values are already in their stored format
  return value;
}

/**
 * Validation schema of a "blocks" field: every block must be of a known type
 * and pass the validation of its own fields.
 */
function getBlocksValidationSchema(field: SchemaField) {
  const blockSchemas = Object.entries(field.blocks ?? {}).map(
    ([blockType, block]) =>
      z.looseObject({
        _block: z.literal(blockType),
        ...Object.fromEntries(
          getBlockFields(block).map(([key, blockField]) => [
            key,
            getFieldValidationSchema(blockField),
          ]),
        ),
      }),
  );

  const blockSchema =
    blockSchemas.length > 0
      ? z.discriminatedUnion(
          "_block",
          blockSchemas as [
            (typeof blockSchemas)[number],
            ...(typeof blockSchemas)[number][],
          ],
          { error: "Unknown block type, remove this block to save" },
        )
      : z.never();

  return z.array(blockSchema);
}

export function getFieldValidationSchema(field: SchemaField): z.ZodTypeAny {
  let fieldSchema: z.ZodTypeAny;

  switch (field.type) {
    case "boolean":
      fieldSchema = z.enum(["true", "false"]);
      break;
    case "number":
      fieldSchema = z.number();
      break;
    case "url":
      fieldSchema = z.url("Must be a valid URL");
      break;
    case "date":
      fieldSchema = z.string();
      break;
    case "datetime":
      fieldSchema = z.string();
      break;
    case "color":
      fieldSchema = RGBColorSchema;
      break;
    case "select":
      // For referenced choices, use string validation instead of enum
      // since the choices are dynamic
      if (field.allowFreeInput) {
        fieldSchema = z.string();
      } else if (getChoicesReference(field.choicesFixed)) {
        fieldSchema = z.string();
      } else if (field.choicesFixed && field.choicesFixed.length > 0) {
        fieldSchema = z.enum(field.choicesFixed as [string, ...string[]]);
      } else {
        fieldSchema = z.string();
      }
      break;
    case "multiselect":
      fieldSchema = z.array(z.string());
      // Apply min/max constraints
      if (field.minSelectedChoices) {
        fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
          field.minSelectedChoices,
          `${field.displayName} requires at least ${field.minSelectedChoices} selection${field.minSelectedChoices > 1 ? "s" : ""}`,
        );
      }
      if (field.maxSelectedChoices) {
        fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).max(
          field.maxSelectedChoices,
          `${field.displayName} allows maximum ${field.maxSelectedChoices} selection${field.maxSelectedChoices > 1 ? "s" : ""}`,
        );
      }
      break;
    case "blocks":
      fieldSchema = getBlocksValidationSchema(field);
      break;
    default:
      // Includes string fields with isMultiple (backwards compatibility),
      // which are stored as comma-separated strings
      fieldSchema = z.string();
  }

  if (field.type === "blocks") {
    // An empty list is a valid value for optional blocks fields
    if (!field.optional) {
      fieldSchema = (fieldSchema as z.ZodArray).min(
        1,
        `${field.displayName} requires at least one block`,
      );
    }
  } else if (field.optional) {
    if (field.type === "multiselect") {
      // Multiselect is already optional by allowing empty array
      // But if minSelectedChoices is set, it overrides optional
      if (!field.minSelectedChoices) {
        fieldSchema = fieldSchema.optional();
      }
    } else {
      fieldSchema = fieldSchema.optional().or(z.literal(""));
    }
  } else if (field.type === "multiselect" && !field.minSelectedChoices) {
    // If not optional and no minSelectedChoices, require at least 1
    fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
      1,
      `${field.displayName} requires at least one selection`,
    );
  } else if (
    field.type !== "boolean" &&
    field.type !== "select" &&
    !(field.type === "string" && field.isMultiple && field.choicesFixed)
  ) {
    // For non-boolean and non-select fields, require a value if not optional
    fieldSchema = (fieldSchema as z.ZodString).min(
      1,
      `${field.displayName} is required`,
    );
  }

  return fieldSchema;
}

/**
 * Resolves the choices of a select/multiselect field.
 * If choices reference another collection, returns the ids of its items.
 * If choices are directly defined, returns them as is.
 */
export function resolveFieldChoices(
  field: SchemaField,
  allData: EditorialData | undefined,
): string[] {
  const referencedKey = getChoicesReference(field.choicesFixed);
  if (referencedKey && allData) {
    const referencedData = allData[referencedKey];
    return referencedData
      ? Object.values(referencedData).map((item) => item.id)
      : [];
  }
  return field.choicesFixed || [];
}
