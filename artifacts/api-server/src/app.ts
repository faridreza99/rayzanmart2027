import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import compression from "compression";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

// ─── Gzip Compression ──────────────────────────────────────────────────────
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

// ─── HTTP Logging (errors + slow requests only in production) ─────────────
app.use(
  pinoHttp({
    logger,
    autoLogging: isProd
      ? { ignore: (req) => req.method === "GET" && (req.statusCode ?? 200) < 400 }
      : true,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));

// ─── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── Security & Performance headers ────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

// ─── Cache-Control for read-only public data ───────────────────────────────
const CACHEABLE_TABLES = ["products", "categories", "brands", "site_settings", "hero_banners", "faq_items", "affiliate_page_content", "affiliate_testimonials", "affiliate_video_campaigns"];

app.use("/api/db/:table", (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" && CACHEABLE_TABLES.includes(req.params.table)) {
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.setHeader("Vary", "Accept-Encoding");
  }
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Keep-alive for connection reuse ───────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Connection", "keep-alive");
  next();
});

export default app;
