import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google public keys for Firebase token verification
 */
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

/**
 * Middleware to verify Firebase ID tokens without firebase-admin
 * See https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 * https://stackoverflow.com/questions/55594930/getting-jwks-for-firebase-in-rfc7517-format
 * Requires projectId (public, not secret)
 */
export const firebaseAuth = (projectId: string) =>
  createMiddleware(async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        { error: "Unauthorized: Missing or invalid authorization header" },
        401,
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid token payload");
      }

      await next();
    } catch (error) {
      console.error("Firebase auth error:", error);
      return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }
  });
