"use strict";

const params = new URLSearchParams(location.search);
const orderNumber = params.get("order") || "SFF-260902-A7K4";

document.querySelector("#cancelOrderNumber").textContent =
  `Order ${orderNumber}`;
// Preserve the same query string so "Try Again" reopens pay.html with the
// same order details instead of losing them.
document.querySelector("#cancelRetryLink").href = `pay.html${location.search}`;
document.querySelector("#year").textContent = new Date().getFullYear();
