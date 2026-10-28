import {
  getChoicesReference,
  RGBColorSchema,
  type EditorialData,
  type EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { z } from "zod";

export type SchemaField = EditorialSchemaItem["fields"][string];

export type FieldFormValue = string | string[];

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
    default:
      // Includes string fields with isMultiple (backwards compatibility),
      // which are stored as comma-separated strings
      fieldSchema = z.string();
  }

  if (field.optional) {
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
