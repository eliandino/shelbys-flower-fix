"use strict";

// Shared by admin.html and admin-order.html.

// --- Admin login ----------------------------------------------------------
// The server hands back a signed token (valid for 12 hours) after Shelby
// enters her password; every admin request sends it along. Storage can be
// blocked (e.g. private browsing), in which case she just logs in again.
const TOKEN_KEY = "sffAdminToken";

function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to do - the token just won't survive a page reload.
  }
}

// Hides the page and shows a password form in its place. Logging in
// reloads the page so it loads normally with the new token.
function showLogin(message) {
  const main = document.querySelector("main");
  main.hidden = true;
  if (document.querySelector("#adminLogin")) return;

  const form = document.createElement("form");
  form.id = "adminLogin";
  form.className = "admin-main admin-login";

  const heading = document.createElement("h1");
  heading.textContent = "Admin Login";

  const label = document.createElement("label");
  label.textContent = "Password";
  const input = document.createElement("input");
  input.type = "password";
  input.required = true;
  input.autocomplete = "current-password";
  label.appendChild(input);

  const error = document.createElement("p");
  error.className = "admin-error";
  error.textContent = message || "";
  error.hidden = !message;

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "btn primary";
  button.textContent = "Log In";

  form.append(heading, label, error, button);
  main.before(form);
  input.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    button.disabled = true;
    error.hidden = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't log in.");
      setAdminToken(body.token);
      location.reload();
    } catch (err) {
      error.textContent =
        err instanceof TypeError
          ? "Couldn't reach the server. It may be waking up - try again in a minute."
          : err.message;
      error.hidden = false;
      button.disabled = false;
    }
  });
}

function addLogoutButton() {
  const header = document.querySelector(".pay-header");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn ghost admin-logout";
  button.textContent = "Log Out";
  button.addEventListener("click", () => {
    setAdminToken(null);
    location.reload();
  });
  header.appendChild(button);
}

// fetch() for admin routes: adds the login token, and switches to the
// login form if there isn't one or the server says it has expired.
async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  if (!token) {
    showLogin();
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    setAdminToken(null);
    showLogin("Your login expired. Please log in again.");
    throw new Error("Not logged in");
  }
  return res;
}

if (getAdminToken()) addLogoutButton();

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
  const res = await adminFetch(`/api/admin/orders`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

async function fetchAdminOrder(orderNumber) {
  const res = await adminFetch(
    `/api/admin/orders/${encodeURIComponent(orderNumber)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

async function updateOrderStatus(orderNumber, status) {
  const res = await adminFetch(
    `/api/admin/orders/${encodeURIComponent(orderNumber)}/status`,
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
  const res = await adminFetch(
    `/api/admin/orders/${encodeURIComponent(orderNumber)}/quote`,
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
  const res = await adminFetch(
    `/api/admin/orders/${encodeURIComponent(orderNumber)}/mark-paid`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  if (!res.ok) throw new Error("Failed to mark order paid");
  return res.json();
}
