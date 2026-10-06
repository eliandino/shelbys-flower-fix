const DEFAULT_SITES = "http://localhost:5500,http://127.0.0.1:5500";

// FRONTEND_ORIGIN is a comma-separated list of the site's base URLs. A URL
// may include a path, e.g. https://eliandino.github.io/shelbys-flower-fix
// on GitHub Pages.
function getSiteUrls() {
  return (process.env.FRONTEND_ORIGIN || DEFAULT_SITES)
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""));
}

// All origins allowed to call this API from a browser (used for CORS).
// A browser's Origin header never has a path, so only scheme + host count.
export function getAllowedOrigins() {
  return getSiteUrls().map((url) => new URL(url).origin);
}

// The one base URL used to build links that get sent to customers (e.g. a
// payment link in a text message). The first entry in FRONTEND_ORIGIN is
// treated as the "real" one.
export function getFrontendBaseUrl() {
  return getSiteUrls()[0];
}
