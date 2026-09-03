"use strict";

// Same note as in app.js/admin-common.js: no build step on this static
// site to inject an environment-specific value, so update this once the
// backend has a real deployed URL.
const API_BASE_URL = "http://localhost:3001";

const params = new URLSearchParams(location.search);
const token = params.get("token");

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

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

  document.querySelector("#zelleAmount").textContent = money(total);
  document.querySelector("#zelleAmount2").textContent = money(total);
  document.querySelector("#zelleOrderNumber").textContent = order.orderNumber;
  document.querySelector("#zelleOrderNumber2").textContent = order.orderNumber;

  if (order.alreadyPaid) {
    document.querySelector("#payAlreadyPaidNote").hidden = false;
    document.querySelector("#payChooseSection").hidden = true;
  }
}

const zellePanel = document.querySelector("#zellePanel");

// Payment option buttons are placeholders until each provider is wired up:
//   card / apple pay / google pay / cash app  -> Square (Phase 7)
//   paypal / venmo                            -> PayPal (Phase 8)
//   zelle                                     -> manual verification (Phase 9)
document.querySelectorAll(".payment-option").forEach((button) => {
  button.addEventListener("click", () => {
    const provider = button.dataset.provider;

    if (provider === "zelle") {
      zellePanel.hidden = !zellePanel.hidden;
      if (!zellePanel.hidden) {
        zellePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    // TODO: open the real checkout for this provider once it's configured.
  });
});

main();
