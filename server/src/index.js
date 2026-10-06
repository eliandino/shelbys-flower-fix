import "dotenv/config";
import express from "express";
import cors from "cors";
import { ordersRouter } from "./routes/orders.js";
import { adminOrdersRouter } from "./routes/adminOrders.js";
import { adminLoginRouter } from "./routes/adminLogin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getAllowedOrigins } from "./lib/frontendUrl.js";
import { assertAdminConfig, requireAdmin } from "./lib/adminAuth.js";

// Refuse to start without an admin password rather than run with the
// admin routes unprotected.
assertAdminConfig();

const app = express();

// Hosts like Render sit behind one proxy. Without this, every visitor
// looks like the same IP to the rate limiters.
app.set("trust proxy", 1);

// Only the frontend origin(s) listed here may call this API from a
// browser. Set FRONTEND_ORIGIN in .env once the site has a real domain;
// defaults to common local-dev ports so `npm run dev` works out of the box.
app.use(cors({ origin: getAllowedOrigins() }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/orders", ordersRouter);

app.use("/api/admin/login", adminLoginRouter);
app.use("/api/admin/orders", requireAdmin, adminOrdersRouter);

// Must be registered last: Express only treats a 4-argument function as
// error-handling middleware, and only errors from routes registered
// above this point reach it.
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Shelby's Flower Fix API listening on port ${port}`);
});
