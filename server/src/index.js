import "dotenv/config";
import express from "express";
import cors from "cors";
import { ordersRouter } from "./routes/orders.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Only the frontend origin(s) listed here may call this API from a
// browser. Set FRONTEND_ORIGIN in .env once the site has a real domain;
// defaults to common local-dev ports so `npm run dev` works out of the box.
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5500,http://127.0.0.1:5500"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/orders", ordersRouter);

// Must be registered last: Express only treats a 4-argument function as
// error-handling middleware, and only errors from routes registered
// above this point reach it.
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Shelby's Flower Fix API listening on port ${port}`);
});
