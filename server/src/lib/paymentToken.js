import crypto from "node:crypto";
import { prisma } from "./prisma.js";

// Long, cryptographically random token used only in a customer's payment
// link (pay.html?token=...). Kept deliberately separate from the
// human-readable order number, which can appear in texts or be read over
// the phone — a payment link should never be guessable from it.
export async function generateUniquePaymentToken() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(24).toString("base64url");
    const existing = await prisma.order.findUnique({
      where: { paymentToken: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique payment token, try again.");
}
