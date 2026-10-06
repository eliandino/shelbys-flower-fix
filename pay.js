"use strict";

// Same note as in app.js/admin-common.js: no build step on this static
// site to inject an environment-specific value, so update this once the
// backend has a real deployed URL.
const API_BASE_URL = "http://localhost:3001";

const params = new URLSearchParams(location.search);
const token = params.get("token");

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

// Shelby's accounts. Also shown in the instructions in pay.html.
const CASH_APP_TAG = "$ShelbyRiggs73";
const VENMO_USERNAME = "shelbyfsu73";

// --- Real orders: fetched by secure token (Phase 6+) --------------------
// Shelby's admin dashboard generates this link after saving a quote. The
// backend is the only source of truth for the price here — this page
// only displays what it's told, it never computes or accepts a price
// from the URL for a real order.
async function loadOrderByToken() {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/orders/by-token/${encodeURIComponent(token)}`,
    );
    if (!res.ok) return null;
    const order = await res.json();
    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      occasion: order.occasion || "Custom arrangement",
      colors: order.favoriteColorsFlowers || "Open to ideas",
      fulfillment: order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup",
      arrangementPriceCents: order.arrangementPrice || 0,
      deliveryFeeCents: order.deliveryFee || 0,
      alreadyPaid: order.paymentStatus === "PAID",
    };
  } catch (err) {
    console.warn("Could not reach the backend to load this order:", err);
    return null;
  }
}

// --- Demo/preview mode: no token in the URL ------------------------------
// Used only to eyeball the page's design without a running backend, e.g.
// pay.html?order=...&arrangement=75&delivery=10, or with no query string
// at all. NOT how real payment links work (those always carry a token)
// and NOT secure — never treat this path as authoritative for a real
// charge. Safe for now only because the payment buttons below are still
// non-functional placeholders; this fallback should go away once Phase 7
// wires up real checkout.
function loadDemoOrder() {
  return {
    orderNumber: params.get("order") || "SFF-260902-A7K4",
    customerName: params.get("customer") || "Jessica Smith",
    occasion: params.get("occasion") || "Birthday Arrangement",
    colors: params.get("colors") || "Pink + White",
    fulfillment: params.get("fulfillment") || "Delivery",
    arrangementPriceCents: Math.round((Number(params.get("arrangement")) || 75) * 100),
    deliveryFeeCents: Math.round((Number(params.get("delivery")) || 10) * 100),
    alreadyPaid: false,
  };
}

async function main() {
  const order = token ? await loadOrderByToken() : loadDemoOrder();

  if (!order) {
    document.querySelector("#payError").hidden = false;
    document.querySelector("#year").textContent = new Date().getFullYear();
    return;
  }

  renderOrder(order);
  document.querySelector("#payContent").hidden = false;
  document.querySelector("#year").textContent = new Date().getFullYear();
}

function renderOrder(order) {
  const total = order.arrangementPriceCents + order.deliveryFeeCents;

  document.querySelector("#payOrderNumber").textContent = order.orderNumber;
  document.querySelector("#payCustomerName").textContent = order.customerName;
  // textContent + CSS white-space: pre-line (not innerHTML) so this can
  // safely render text a customer typed into the order form.
  document.querySelector("#payOrderSummary").textContent =
    `${order.occasion}\n${order.colors}\n${order.fulfillment}`;
  document.querySelector("#payArrangementPrice").textContent = money(
    order.arrangementPriceCents,
  );
  document.querySelector("#payDeliveryFee").textContent = money(
    order.deliveryFeeCents,
  );
  document.querySelector("#payTotal").textContent = money(total);

  document
    .querySelectorAll(".pay-amount")
    .forEach((el) => (el.textContent = money(total)));
  document
    .querySelectorAll(".pay-order-number")
    .forEach((el) => (el.textContent = order.orderNumber));

  // Pre-fill the amount (and the order number, where the app allows it)
  // so the customer only has to confirm in the app.
  const amount = (total / 100).toFixed(2);
  const note = encodeURIComponent(`Order ${order.orderNumber}`);
  document.querySelector("#cashAppLink").href =
    `https://cash.app/${CASH_APP_TAG}/${amount}`;
  document.querySelector("#venmoLink").href =
    `https://venmo.com/${VENMO_USERNAME}?txn=pay&amount=${amount}&note=${note}`;

  if (order.alreadyPaid) {
    document.querySelector("#payAlreadyPaidNote").hidden = false;
    document.querySelector("#payChooseSection").hidden = true;
  }
}

// Each payment button toggles its matching instructions panel and closes
// the others. Cash App, Venmo and Zelle are paid straight to Shelby and
// confirmed by hand; card / apple pay / google pay (Square, Phase 7) and
// paypal (Phase 8) have no panel yet.
const panels = document.querySelectorAll("[data-panel]");
document.querySelectorAll(".payment-option").forEach((button) => {
  button.addEventListener("click", () => {
    const provider = button.dataset.provider;
    const panel = document.querySelector(`[data-panel="${provider}"]`);
    if (!panel) return; // TODO: open the real checkout once it's configured.

    const opening = panel.hidden;
    panels.forEach((p) => (p.hidden = true));
    panel.hidden = !opening;
    if (opening) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

main();
