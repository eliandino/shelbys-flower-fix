import { z } from "zod";

// Mirrors the fields collected by the order form in index.html (Phase 1).
// Anything not listed here is ignored rather than trusted, which matters
// most for price fields: a customer-submitted order never includes a
// price — Shelby sets that later from the admin dashboard.
export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(1, "Name is required").max(120),
    customerPhone: z.string().trim().min(7, "Phone number is required").max(30),
    customerEmail: z
      .string()
      .trim()
      .email("Not a valid email")
      .max(160)
      .optional()
      .or(z.literal("")),
    occasion: z.string().trim().max(200).optional().or(z.literal("")),
    budgetRange: z.string().trim().max(60).optional().or(z.literal("")),
    favoriteColorsFlowers: z.string().trim().max(300).optional().or(z.literal("")),
    // Sent as "YYYY-MM-DD" by the <input type="date"> on the order form.
    requestedDate: z.string().trim().optional().or(z.literal("")),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    deliveryAddress: z.string().trim().max(300).optional().or(z.literal("")),
    specialInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine(
    (data) => data.fulfillmentType !== "DELIVERY" || !!data.deliveryAddress,
    {
      message: "Delivery address is required when fulfillmentType is DELIVERY",
      path: ["deliveryAddress"],
    },
  );
