import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createAdminToken, isCorrectPassword } from "../lib/adminAuth.js";

export const adminLoginRouter = Router();

// Slows down anyone trying to guess Shelby's password. Only failed
// attempts count, so Shelby logging in normally never gets locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

adminLoginRouter.post("/", loginLimiter, (req, res) => {
  const password = req.body?.password;

  if (typeof password !== "string" || !isCorrectPassword(password)) {
    return res.status(401).json({ error: "That password isn't right." });
  }

  res.json({ token: createAdminToken() });
});
