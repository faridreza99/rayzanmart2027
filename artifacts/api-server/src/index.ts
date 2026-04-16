import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

// Catch port-in-use and other bind errors (EADDRINUSE, EACCES, etc.)
// Note: Node.js http.Server does NOT pass bind errors to the listen() callback —
// they are emitted as 'error' events on the server object.
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error({ port }, `Port ${port} is already in use. Another process may still be running. Exiting.`);
  } else {
    logger.error({ err, port }, "Failed to bind server port");
  }
  process.exit(1);
});

// Graceful shutdown — allows the OS to release the port before the next
// process starts, preventing EADDRINUSE on workflow restarts.
function shutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal; closing server gracefully");
  server.close(() => {
    logger.info("Server closed cleanly");
    process.exit(0);
  });

  // Force-exit after 5 s if connections are still open
  setTimeout(() => {
    logger.warn("Forced shutdown after timeout");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
