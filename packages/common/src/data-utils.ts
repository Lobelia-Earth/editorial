import type {
  EditorialSchemaBlock,
  EditorialSchemaItemField,
} from "./types.js";

/**
 * Checks if the choicesFixed value is a reference to another field.
 * References are in the format $key_field
 */
export function getChoicesReference(
  choices: string[] | undefined,
): string | null {
  if (!choices || choices.length !== 1) return null;

  const match = choices[0].match(/^\$(.+)$/);
  return match ? match[1] : null;
}

/**
 * Returns the schema of a block stored in a "blocks" field, or null if the
 * field is not a blocks field or the block type is not defined in the schema.
 */
export function getBlockSchema(
  field: EditorialSchemaItemField,
  block: unknown,
): EditorialSchemaBlock | null {
  if (field.type !== "blocks" || !block || typeof block !== "object") {
    return null;
  }

  const blockType = (block as { _block?: unknown })._block;
  if (typeof blockType !== "string") return null;

  return field.blocks?.[blockType] ?? null;
}
