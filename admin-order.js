"use strict";

const params = new URLSearchParams(location.search);
const orderNumber = params.get("order");

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

  document.querySelector("#detailArrangement").textContent = formatMoney(
    order.arrangementPrice,
  );
  document.querySelector("#detailDeliveryFee").textContent = formatMoney(
    order.deliveryFee,
  );
  document.querySelector("#detailTotal").textContent = formatMoney(
    order.totalAmount,
  );

  document.querySelector("#detailPaymentStatus").textContent = order.paymentMethod
    ? `${statusLabel(order.paymentStatus)} · ${order.paymentMethod}`
    : statusLabel(order.paymentStatus);

  renderActions(order);

  document.querySelector("#adminDetail").hidden = false;
}

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
