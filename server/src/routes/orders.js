import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { generateUniqueOrderNumber } from "../lib/orderNumber.js";
import { createOrderSchema } from "../lib/orderValidation.js";
import { toPublicOrder } from "../lib/orderSerializer.js";

export const ordersRouter = Router();

// Keeps this public endpoint from being used to spam Shelby with fake
// order requests. 20 requests per 15 minutes per IP is generous for a
// real customer filling out a form, but blocks casual abuse.
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

ordersRouter.post("/", createOrderLimiter, async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Please check the order details and try again.",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const data = parsed.data;
  const orderNumber = await generateUniqueOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      occasion: data.occasion || null,
      budgetRange: data.budgetRange || null,
      favoriteColorsFlowers: data.favoriteColorsFlowers || null,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
      fulfillmentType: data.fulfillmentType,
      deliveryAddress: data.deliveryAddress || null,
      specialInstructions: data.specialInstructions || null,
      // status/paymentStatus start at their schema defaults (NEW/UNPAID).
      // Price fields stay null until Shelby quotes the order (Phase 6).
    },
  });

  res.status(201).json(toPublicOrder(order));
});

// Looked up by the human-readable order number rather than the internal
// id, since that's the only identifier the customer actually has.
ordersRouter.get("/:orderNumber", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  res.json(toPublicOrder(order));
});
