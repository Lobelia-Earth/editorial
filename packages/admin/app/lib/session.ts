let sessionId: string | undefined;

/**
 * Random id of this browser tab. The server keeps item locks per tab, so the
 * same user editing in two tabs is still kept from overwriting themselves.
 */
export function getSessionId() {
  // crypto.randomUUID needs a secure context, which the admin may not have
  sessionId ??= Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return sessionId;
}
