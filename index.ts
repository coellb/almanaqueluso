import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startDailyDigestJob } from "./jobs/dailyDigest";
import { startTideImportJob } from "./jobs/tideImport";
import { startFootballImportJob } from "./jobs/footballImport";
import { initNotificationScheduler } from "./jobs/notificationScheduler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CSP - ultra-permissive in development for Stripe compatibility
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Development: ultra-permissive CSP for Vite + Stripe
    res.setHeader(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval'; " +
      "style-src * 'unsafe-inline'; " +
      "img-src * data: blob:; " +
      "font-src * data:; " +
      "frame-src *; " +
      "connect-src * ws: wss:; " +
      "worker-src * blob:;"
    );
  } else {
    // Production: strict CSP for security
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network",
      "style-src 'self' 'unsafe-inline' https://js.stripe.com https://fonts.googleapis.com",
      "img-src 'self' data: https://*.stripe.com https://m.stripe.network",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com https://m.stripe.network https://*.stripe.com https://*.replit.dev",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "frame-ancestors 'self'"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start cron jobs
    startDailyDigestJob();
    startTideImportJob();
    startFootballImportJob();
    initNotificationScheduler();
  });
})();
