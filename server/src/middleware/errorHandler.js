// Catches anything thrown (or rejected) in a route handler. Express 5
// automatically forwards async errors here, so routes don't need their own
// try/catch for unexpected failures.
//
// The client only ever sees a generic message — real details go to the
// server log, never the response, so we don't leak stack traces or
// internal info to whoever is calling the API.
export function errorHandler(err, req, res, _next) {
  console.error(err);

  if (res.headersSent) return;

  res.status(500).json({
    error: "Something went wrong. Please try again in a moment.",
  });
}
