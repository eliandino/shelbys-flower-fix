const DEFAULT_ORIGINS = "http://localhost:5500,http://127.0.0.1:5500";

// All origins allowed to call this API from a browser (used for CORS).
export function getAllowedOrigins() {
  return (process.env.FRONTEND_ORIGIN || DEFAULT_ORIGINS)
    .split(",")
    .map((origin) => origin.trim());
}

// The one origin used to build links that get sent to customers (e.g. a
// payment link in a text message). The first entry in FRONTEND_ORIGIN is
// treated as the "real" one.
export function getFrontendBaseUrl() {
  return getAllowedOrigins()[0];
}
