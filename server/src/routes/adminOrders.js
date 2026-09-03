import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toPublicOrder } from "../lib/orderSerializer.js";
import { generateUniquePaymentToken } from "../lib/paymentToken.js";
import { getFrontendBaseUrl } from "../lib/frontendUrl.js";

// IMPORTANT: nothing in here is protected yet. That's Phase 11 (admin
// authentication). This is fine for local development, but this API must
// not be deployed anywhere publicly reachable until a login sits in
// front of everything mounted under /api/admin.
export const adminOrdersRouter = Router();

// Same as toPublicOrder, but also includes the shareable payment link
// when one exists - useful only to Shelby, so this stays in the admin
// route file rather than the serializer shared with public endpoints.
// The raw paymentToken itself is still never sent anywhere.
function toAdminOrder(order) {
  return {
    ...toPublicOrder(order),
    paymentUrl: order.paymentToken
      ? `${getFrontendBaseUrl()}/pay.html?token=${order.paymentToken}`
      : null,
  };
}

adminOrdersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200, // plenty for a small business; revisit if this ever fills up
  });
  res.json(orders.map(toAdminOrder));
});

adminOrdersRouter.get("/:orderNumber", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  res.json(toAdminOrder(order));
});

const quoteSchema = z.object({
  // Dollars, not cents - converted below. A customer never sends this;
  // only Shelby, from the admin dashboard.
  arrangementPrice: z.number().nonnegative().max(10000),
  deliveryFee: z.number().nonnegative().max(10000).default(0),
});

adminOrdersRouter.patch("/:orderNumber/quote", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please enter a valid price." });
  }

  const existing = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
  });
  if (!existing) {
    return res.status(404).json({ error: "Order not found." });
  }

  const arrangementPrice = Math.round(parsed.data.arrangementPrice * 100);
  const deliveryFee = Math.round(parsed.data.deliveryFee * 100);

  // Reuse the existing payment link if this order already has one, rather
  // than invalidating a link Shelby may have already sent.
  const paymentToken =
    existing.paymentToken || (await generateUniquePaymentToken());

  // Saving a quote moves a fresh order to QUOTED. If Shelby is adjusting
  // the price on an order that's already further along (paid, being
  // designed, etc.), leave its status where it is - only the price
  // changes.
  const lockedStatuses = [
    "PAID",
    "DESIGNING",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ];
  const nextStatus = lockedStatuses.includes(existing.status)
    ? existing.status
    : "QUOTED";

  const order = await prisma.order.update({
    where: { orderNumber: req.params.orderNumber },
    data: {
      arrangementPrice,
      deliveryFee,
      totalAmount: arrangementPrice + deliveryFee,
      paymentToken,
      status: nextStatus,
    },
  });

  res.json(toAdminOrder(order));
});

const statusSchema = z.object({
  status: z.enum(["DESIGNING", "READY", "DELIVERED", "CANCELLED"]),
});

adminOrdersRouter.patch("/:orderNumber/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const existing = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Order not found." });
  }

  const { status } = parsed.data;
  const order = await prisma.order.update({
    where: { orderNumber: req.params.orderNumber },
    data: {
      status,
      ...(status === "DELIVERED" ? { completedAt: new Date() } : {}),
    },
  });

  res.json(toAdminOrder(order));
});

const markPaidSchema = z.object({
  paymentMethod: z.string().trim().max(60).optional().or(z.literal("")),
});

adminOrdersRouter.patch("/:orderNumber/mark-paid", async (req, res) => {
  const parsed = markPaidSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request." });
  }

  const existing = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
  });
  if (!existing) {
    return res.status(404).json({ error: "Order not found." });
  }

  // Only auto-advance the fulfillment status if payment is what the order
  // was waiting on. If Shelby already moved it further along (e.g. she's
  // designing it and is only now confirming a late Zelle payment), leave
  // the fulfillment status alone.
  const earlyStatuses = ["NEW", "QUOTED", "AWAITING_PAYMENT"];
  const nextStatus = earlyStatuses.includes(existing.status)
    ? "PAID"
    : existing.status;

  const order = await prisma.order.update({
    where: { orderNumber: req.params.orderNumber },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      status: nextStatus,
      ...(parsed.data.paymentMethod
        ? { paymentMethod: parsed.data.paymentMethod }
        : {}),
    },
  });

  res.json(toAdminOrder(order));
});
