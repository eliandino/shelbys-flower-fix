import { prisma } from "./prisma.js";

// Characters chosen to avoid ambiguous pairs (0/O, 1/I) so an order number
// is easy to read back over the phone or copy by hand.
const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4) {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return suffix;
}

function datePart(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

// Generates an order number like SFF-260902-A7K4 and checks the database
// to make sure it's actually unique before returning it. The client-side
// generator in app.js produces the same format for display purposes, but
// this is the one that's allowed to decide what an order is really called.
export async function generateUniqueOrderNumber() {
  const prefix = `SFF-${datePart()}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${prefix}-${randomSuffix()}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique order number, try again.");
}
