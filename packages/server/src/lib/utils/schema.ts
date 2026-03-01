import {
  EditorialSchemaItemFieldSchema,
  EditorialSchemaItemFieldType,
} from "@isardsat/editorial-common";
import { z } from "zod";

type GenerateMetaSchemaOptions = {
  /**
   * Fields that exist in the Editorial's schema but should not be validated by the schema.
   * These fields will be allowed without causing validation errors.
   */
  allowedExtraFields?: string[];
};

export function generateMetaSchema(options: GenerateMetaSchemaOptions = {}) {
  const { allowedExtraFields = [] } = options;

  function generateFieldDefinition() {
    const fieldShape = EditorialSchemaItemFieldSchema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key in fieldShape) {
      const zodField = fieldShape[key as keyof typeof fieldShape];

      // Handle the "type" field separately since it's an enum with specific options
      if (key === "type") {
        properties[key] = {
          type: "string",
          enum: EditorialSchemaItemFieldType.options,
        };
        required.push(key);
        continue;
      }

      // Unwrap ALL wrappers to get the inner type
      let innerField: any = zodField;
      let isOptional = false;
      let defaultValue: any = undefined;

      // Loop to unwrap all layers (ZodDefault, ZodOptional, ZodNullable, etc.)
      while (innerField) {
        if (innerField instanceof z.ZodOptional) {
          isOptional = true;
          innerField = innerField.unwrap();
        } else if (innerField instanceof z.ZodDefault) {
          isOptional = true; // Un camp amb default és efectivament opcional
          defaultValue = innerField._def.defaultValue;
          innerField = innerField._def.innerType;
        } else if (innerField instanceof z.ZodNullable) {
          innerField = innerField.unwrap();
        } else {
          // No more wrappers, exit loop
          break;
        }
      }

      // Check the actual base type
      if (innerField instanceof z.ZodString) {
        properties[key] = { type: "string" };
      } else if (innerField instanceof z.ZodBoolean) {
        properties[key] = {
          type: "boolean",
          ...(defaultValue !== undefined && { default: defaultValue }),
        };
      } else if (innerField instanceof z.ZodNumber) {
        properties[key] = {
          type: "number",
          ...(defaultValue !== undefined && { default: defaultValue }),
        };
      } else if (innerField instanceof z.ZodArray) {
        properties[key] = { type: "array", items: { type: "string" } };
      } else if (innerField instanceof z.ZodEnum) {
        properties[key] = {
          type: "string",
          enum: innerField.options,
        };
      } else {
        console.warn(`Unknown Zod type for field "${key}"`);
        properties[key] = {};
      }

      // Add to required if not optional
      if (!isOptional) {
        required.push(key);
      }
    }

    for (const field of allowedExtraFields) {
      if (!(field in properties)) {
        properties[field] = {}; // Allow any value
      }
    }

    return {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    };
  }

  const fieldDefinition = generateFieldDefinition();

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Editorial Schema",
    type: "object",
    additionalProperties: { $ref: "#/definitions/SchemaItem" },
    definitions: {
      SchemaItem: {
        type: "object",
        required: ["displayName", "fields"],
        properties: {
          displayName: { type: "string" },
          filterBy: { type: "string" },
          singleton: { type: "boolean" },
          fields: {
            type: "object",
            additionalProperties: { $ref: "#/definitions/Field" },
          },
        },
        additionalProperties: false,
      },
      Field: fieldDefinition,
    },
  };
}
