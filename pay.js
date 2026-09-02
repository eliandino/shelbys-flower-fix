"use strict";

// --- PHASE 2 PLACEHOLDER DATA SOURCE -----------------------------------
// This page currently reads the order and price from the URL's query
// string, e.g. pay.html?order=SFF-260902-A7K4&customer=Jessica+Smith&
// occasion=Birthday+Arrangement&colors=Pink+%2B+White&fulfillment=Delivery&
// arrangement=75&delivery=10
//
// That's enough to preview/test the design and the "text a link" flow
// before a backend exists. IMPORTANT: it is NOT secure — anyone can edit
// these numbers in the address bar. Once the backend order system exists
// (Phase 3+), this page will instead fetch the order by a secure random
// token from the server, and the server (not the URL) will be the only
// source of truth for the price.
// -------------------------------------------------------------------------

const params = new URLSearchParams(location.search);

// Demo defaults so the page still looks right with no query string at all
// (handy for just eyeballing the design).
const order = {
  orderNumber: params.get("order") || "SFF-260902-A7K4",
  customerName: params.get("customer") || "Jessica Smith",
  occasion: params.get("occasion") || "Birthday Arrangement",
  colors: params.get("colors") || "Pink + White",
  fulfillment: params.get("fulfillment") || "Delivery",
  arrangementPrice: Number(params.get("arrangement")) || 75,
  deliveryFee: Number(params.get("delivery")) || 10,
};

const total = order.arrangementPrice + order.deliveryFee;
const money = (amount) => `$${amount.toFixed(2)}`;

document.querySelector("#payOrderNumber").textContent = order.orderNumber;
document.querySelector("#payCustomerName").textContent = order.customerName;
document.querySelector("#payOrderSummary").innerHTML =
  `${order.occasion}<br>${order.colors}<br>${order.fulfillment}`;
document.querySelector("#payArrangementPrice").textContent = money(
  order.arrangementPrice,
);
document.querySelector("#payDeliveryFee").textContent = money(
  order.deliveryFee,
);
document.querySelector("#payTotal").textContent = money(total);

const zellePanel = document.querySelector("#zellePanel");
document.querySelector("#zelleAmount").textContent = money(total);
document.querySelector("#zelleAmount2").textContent = money(total);
document.querySelector("#zelleOrderNumber").textContent = order.orderNumber;
document.querySelector("#zelleOrderNumber2").textContent = order.orderNumber;

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

document.querySelector("#year").textContent = new Date().getFullYear();
