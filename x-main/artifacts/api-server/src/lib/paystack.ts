import crypto from "node:crypto";
import type { Request } from "express";

export const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
export const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  };
}

/**
 * Extract the RAW request body bytes.
 *
 * Paystack signs the exact bytes that arrived on the wire, so HMAC must be
 * computed over those bytes — never over a re-serialized JSON object.
 * Mount these webhook routes with `express.raw()` (see app.ts) so req.body
 * is a Buffer. The fallback fails closed: a re-serialized body almost never
 * reproduces the signature, so a misconfigured server rejects instead of
 * accepting forgeries.
 */
export function getRawBody(req: Request): Buffer {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
}

/**
 * Verify the x-paystack-signature header: hex(HMAC-SHA512(rawBody, secret)).
 * Timing-safe comparison; empty secret or missing header always fails.
 */
export function verifyPaystackSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!PAYSTACK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha512", PAYSTACK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  return expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
