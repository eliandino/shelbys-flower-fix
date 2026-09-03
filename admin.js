"use strict";

async function loadOrders() {
  const list = document.querySelector("#adminOrderList");

  try {
    const orders = await fetchAdminOrders();

    if (orders.length === 0) {
      document.querySelector("#adminEmpty").hidden = false;
      return;
    }

    orders.forEach((order) => list.appendChild(buildOrderCard(order)));
  } catch (err) {
    document.querySelector("#adminError").hidden = false;
  }
}

// Built with DOM APIs and textContent (not innerHTML) so a customer typing
// something like "<script>" into the order form on the public site can
// never execute here — every field below is customer-submitted text.
function buildOrderCard(order) {
  const card = document.createElement("a");
  card.className = "admin-order-card";
  card.href = `admin-order.html?order=${encodeURIComponent(order.orderNumber)}`;

  const head = document.createElement("div");
  head.className = "admin-order-card-head";

  const number = document.createElement("span");
  number.className = "admin-order-number";
  number.textContent = order.orderNumber;

  const badge = document.createElement("span");
  badge.className = `status-badge status-${order.status}`;
  badge.textContent = statusLabel(order.status);

  head.append(number, badge);

  const name = document.createElement("h3");
  name.textContent = order.customerName;

  const details = document.createElement("p");
  details.textContent =
    [order.occasion, order.favoriteColorsFlowers].filter(Boolean).join(" · ") ||
    "No details given";

  const dateLine = document.createElement("p");
  dateLine.className = "admin-order-date";
  dateLine.textContent = `Requested: ${formatDate(order.requestedDate)}`;

  card.append(head, name, details, dateLine);
  return card;
}

loadOrders();
