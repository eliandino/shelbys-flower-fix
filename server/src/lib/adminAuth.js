import crypto from "node:crypto";

// Shelby logs in once with ADMIN_PASSWORD and gets back a signed token
// that expires after SESSION_HOURS. The token is just "<expiry>.<HMAC>",
// so there's no session table to manage, and changing
// ADMIN_SESSION_SECRET logs everyone out immediately.
const SESSION_HOURS = 12;

export function assertAdminConfig() {
  const missing = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"].filter(
    (name) => !process.env[name],
  );
  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(" and ")} - set them in .env (see .env.example).`,
    );
  }
}

// Hashing both sides first means timingSafeEqual always compares equal
// lengths, so the comparison doesn't leak the password's length.
export function isCorrectPassword(password) {
  const hash = (value) => crypto.createHash("sha256").update(String(value)).digest();
  return crypto.timingSafeEqual(hash(password), hash(process.env.ADMIN_PASSWORD));
}

function sign(payload) {
  return crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

export function createAdminToken() {
  const expiresAt = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

function isValidAdminToken(token) {
  const [expiresAt, signature] = String(token).split(".");
  if (!expiresAt || !signature) return false;

  const expected = Buffer.from(sign(expiresAt));
  const given = Buffer.from(signature);
  if (given.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(given, expected)) return false;

  return Number(expiresAt) > Date.now();
}

// Guards everything under /api/admin except the login route itself.
export function requireAdmin(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!isValidAdminToken(token)) {
    return res.status(401).json({ error: "Please log in again." });
  }
  next();
}
