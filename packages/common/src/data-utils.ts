/**
 * Checks if the options value is a reference to another field.
 * References are in the format $key_field
 */
export function getOptionsReference(
  options: string[] | undefined,
): string | null {
  if (!options || options.length !== 1) return null;

  const match = options[0].match(/^\$(.+)$/);
  return match ? match[1] : null;
}
