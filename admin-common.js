"use strict";

// Shared by admin.html and admin-order.html.

// Same note as in app.js/pay.js: no build step on this static site to
// inject an environment-specific value, so update this once the backend
// has a real deployed URL.
const API_BASE_URL = "http://localhost:3001";

const STATUS_LABELS = {
  NEW: "New Request",
  QUOTED: "Quoted",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAID: "Paid",
  DESIGNING: "Designing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  UNPAID: "Unpaid",
  PENDING: "Pending",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  // requestedDate is stored as UTC midnight for a calendar date (see
  // orders.js), not a specific moment in time. Formatting with the
  // viewer's local timezone would shift it a day off in the western
  // hemisphere, so this always reads the date back out in UTC.
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Prices are stored as integer cents (see server/prisma/schema.prisma).
function formatMoney(cents) {
  if (cents === null || cents === undefined) return "Not quoted yet";
  return `$${(cents / 100).toFixed(2)}`;
}

async function fetchAdminOrders() {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

async function fetchAdminOrder(orderNumber) {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

async function updateOrderStatus(orderNumber, status) {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

async function saveOrderQuote(orderNumber, { arrangementPrice, deliveryFee }) {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/quote`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrangementPrice, deliveryFee }),
    },
  );
  if (!res.ok) throw new Error("Failed to save quote");
  return res.json();
}

async function markOrderPaid(orderNumber) {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(orderNumber)}/mark-paid`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  if (!res.ok) throw new Error("Failed to mark order paid");
  return res.json();
}
