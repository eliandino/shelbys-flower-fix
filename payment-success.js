"use strict";

// Same placeholder approach as pay.js: reads order/customer from the URL
// for now. Once webhooks exist (Phase 10), the backend will have already
// verified the payment before the customer ever lands here — this page
// will just display what the server confirmed, not decide anything itself.
const params = new URLSearchParams(location.search);
const orderNumber = params.get("order") || "SFF-260902-A7K4";
const customerName = params.get("customer") || "friend";

document.querySelector("#successCustomerName").textContent =
  customerName.split(" ")[0];
document.querySelector("#successOrderNumber").textContent =
  `Order ${orderNumber}`;
document.querySelector("#year").textContent = new Date().getFullYear();
