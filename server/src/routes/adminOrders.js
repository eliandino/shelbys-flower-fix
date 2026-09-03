import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toPublicOrder } from "../lib/orderSerializer.js";

// IMPORTANT: nothing in here is protected yet. That's Phase 11 (admin
// authentication). This is fine for local development, but this API must
// not be deployed anywhere publicly reachable until a login sits in
// front of everything mounted under /api/admin.
export const adminOrdersRouter = Router();

adminOrdersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200, // plenty for a small business; revisit if this ever fills up
  });
  res.json(orders.map(toPublicOrder));
});

adminOrdersRouter.get("/:orderNumber", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  res.json(toPublicOrder(order));
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

  res.json(toPublicOrder(order));
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

  res.json(toPublicOrder(order));
});
