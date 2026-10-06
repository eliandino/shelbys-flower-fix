"use strict";

// Where the backend API (server/) is running. Loaded before every page's
// own script. When the site is opened from this computer it talks to the
// local server; everywhere else it uses the hosted one on Render.
const API_BASE_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3001"
  : "https://shelbys-flower-fix-api.onrender.com";
