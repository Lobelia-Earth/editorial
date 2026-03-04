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
