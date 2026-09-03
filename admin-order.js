"use strict";

const params = new URLSearchParams(location.search);
const orderNumber = params.get("order");

// Kept up to date by renderOrder() so the quote/action button handlers
// below always have the latest order data (customer phone, order number,
// total, payment link) without needing to re-fetch on every click.
let currentOrder = null;

async function loadOrder() {
  if (!orderNumber) {
    document.querySelector("#adminDetailError").hidden = false;
    return;
  }

  const order = await fetchAdminOrder(orderNumber).catch(() => null);
  if (!order) {
    document.querySelector("#adminDetailError").hidden = false;
    return;
  }

  renderOrder(order);
}

// Everything here is set via textContent, not innerHTML — several of
// these fields are customer-submitted free text from the public order
// form, so this is what keeps a mischievous submission from being able
// to run as HTML/script in Shelby's browser.
function renderOrder(order) {
  currentOrder = order;

  document.querySelector("#detailOrderNumber").textContent = order.orderNumber;

  const badge = document.querySelector("#detailStatusBadge");
  badge.textContent = statusLabel(order.status);
  badge.className = `status-badge status-${order.status}`;

  document.querySelector("#detailCustomerName").textContent = order.customerName;

  const phoneLink = document.querySelector("#detailCustomerPhone");
  phoneLink.textContent = order.customerPhone;
  phoneLink.href = `tel:${order.customerPhone}`;

  const emailRow = document.querySelector("#detailCustomerEmailRow");
  if (order.customerEmail) {
    const emailLink = document.querySelector("#detailCustomerEmail");
    emailLink.textContent = order.customerEmail;
    emailLink.href = `mailto:${order.customerEmail}`;
    emailRow.hidden = false;
  } else {
    emailRow.hidden = true;
  }

  document.querySelector("#detailOccasion").textContent = order.occasion || "—";
  document.querySelector("#detailBudget").textContent = order.budgetRange || "—";
  document.querySelector("#detailColors").textContent =
    order.favoriteColorsFlowers || "—";
  document.querySelector("#detailDate").textContent = formatDate(
    order.requestedDate,
  );
  document.querySelector("#detailFulfillment").textContent =
    order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup";

  const addressRow = document.querySelector("#detailAddress");
  const addressLabel = document.querySelector("#detailAddressLabel");
  if (order.fulfillmentType === "DELIVERY") {
    addressRow.textContent = order.deliveryAddress || "—";
    addressRow.hidden = false;
    addressLabel.hidden = false;
  } else {
    addressRow.hidden = true;
    addressLabel.hidden = true;
  }

  document.querySelector("#detailInstructions").textContent =
    order.specialInstructions || "—";

  renderPricing(order);

  document.querySelector("#detailPaymentStatus").textContent = order.paymentMethod
    ? `${statusLabel(order.paymentStatus)} · ${order.paymentMethod}`
    : statusLabel(order.paymentStatus);

  renderActions(order);

  document.querySelector("#adminDetail").hidden = false;
}

function renderPricing(order) {
  const arrangementInput = document.querySelector("#quoteArrangement");
  const deliveryInput = document.querySelector("#quoteDelivery");

  // Only overwrite what Shelby's typed if this is a fresh render (e.g.
  // right after loading), not after every keystroke.
  if (document.activeElement !== arrangementInput) {
    arrangementInput.value =
      order.arrangementPrice != null ? (order.arrangementPrice / 100).toFixed(2) : "";
  }
  if (document.activeElement !== deliveryInput) {
    deliveryInput.value =
      order.deliveryFee != null ? (order.deliveryFee / 100).toFixed(2) : "";
  }

  updateTotalPreview();
  renderPaymentLinkBox(order);
}

function updateTotalPreview() {
  const arrangement = Number(document.querySelector("#quoteArrangement").value) || 0;
  const delivery = Number(document.querySelector("#quoteDelivery").value) || 0;
  document.querySelector("#quoteTotalPreview").textContent = formatMoney(
    Math.round((arrangement + delivery) * 100),
  );
}

document
  .querySelector("#quoteArrangement")
  .addEventListener("input", updateTotalPreview);
document
  .querySelector("#quoteDelivery")
  .addEventListener("input", updateTotalPreview);

function renderPaymentLinkBox(order) {
  const box = document.querySelector("#paymentLinkBox");
  if (!order.paymentUrl) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  document.querySelector("#paymentLinkInput").value = order.paymentUrl;
}

document.querySelector("#saveQuoteButton").addEventListener("click", async () => {
  const errorNote = document.querySelector("#quoteError");
  errorNote.hidden = true;

  const arrangementPrice = Number(document.querySelector("#quoteArrangement").value);
  const deliveryFee = Number(document.querySelector("#quoteDelivery").value) || 0;

  if (!(arrangementPrice > 0)) {
    errorNote.textContent = "Enter an arrangement price before saving.";
    errorNote.hidden = false;
    return;
  }

  const button = document.querySelector("#saveQuoteButton");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const order = await saveOrderQuote(orderNumber, { arrangementPrice, deliveryFee });
    renderOrder(order);
  } catch (err) {
    errorNote.textContent = "Couldn't save this quote. Please try again.";
    errorNote.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Save Quote";
  }
});

document.querySelector("#copyLinkButton").addEventListener("click", async () => {
  const input = document.querySelector("#paymentLinkInput");
  const button = document.querySelector("#copyLinkButton");
  try {
    await navigator.clipboard.writeText(input.value);
    button.textContent = "Copied!";
  } catch (err) {
    // Clipboard API can be unavailable (e.g. non-HTTPS context) - fall
    // back to letting Shelby select and copy the text herself.
    input.select();
    button.textContent = "Select & copy";
  }
  setTimeout(() => (button.textContent = "Copy"), 2000);
});

document.querySelector("#textCustomerButton").addEventListener("click", () => {
  if (!currentOrder || !currentOrder.paymentUrl) return;

  const text = [
    "🌸 Your Shelby's Flower Fix quote is ready!",
    "",
    "Order:",
    currentOrder.orderNumber,
    "",
    "Total:",
    formatMoney(currentOrder.totalAmount),
    "",
    "Complete your payment securely:",
    "",
    currentOrder.paymentUrl,
    "",
    "Once payment is received, Shelby will confirm your order. 💐",
  ].join("\n");

  location.href = `sms:${currentOrder.customerPhone}?&body=${encodeURIComponent(text)}`;
});

// Which buttons show depends on where the order currently is, so Shelby
// is guided toward the normal NEW -> PAID -> DESIGNING -> READY ->
// DELIVERED path without being hard-blocked from skipping around if a
// real order needs it (e.g. marking a late Zelle payment as paid after
// the flowers are already designed).
function renderActions(order) {
  const container = document.querySelector("#adminActions");
  container.innerHTML = "";

  const buttons = [];

  if (order.paymentStatus !== "PAID" && order.status !== "CANCELLED") {
    buttons.push({ label: "Mark as Paid", onClick: handleMarkPaid });
  }
  if (!["DESIGNING", "READY", "DELIVERED", "CANCELLED"].includes(order.status)) {
    buttons.push({
      label: "Start Designing",
      onClick: () => handleStatus("DESIGNING"),
    });
  }
  if (order.status === "DESIGNING") {
    buttons.push({ label: "Mark Ready", onClick: () => handleStatus("READY") });
  }
  if (order.status === "READY") {
    buttons.push({
      label: "Mark Delivered",
      onClick: () => handleStatus("DELIVERED"),
    });
  }
  if (order.status !== "CANCELLED" && order.status !== "DELIVERED") {
    buttons.push({
      label: "Cancel Order",
      onClick: () => handleStatus("CANCELLED"),
      ghost: true,
    });
  }

  buttons.forEach(({ label, onClick, ghost }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn ${ghost ? "ghost" : "primary"}`;
    button.textContent = label;
    button.addEventListener("click", async () => {
      button.disabled = true;
      await onClick();
    });
    container.appendChild(button);
  });
}

async function handleStatus(status) {
  try {
    await updateOrderStatus(orderNumber, status);
    await loadOrder();
  } catch (err) {
    alert("Couldn't update this order. Please try again.");
  }
}

async function handleMarkPaid() {
  try {
    await markOrderPaid(orderNumber);
    await loadOrder();
  } catch (err) {
    alert("Couldn't mark this order as paid. Please try again.");
  }
}

loadOrder();
