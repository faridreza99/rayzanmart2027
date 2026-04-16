import { Router, type IRouter } from "express";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dbRouter from "./db.js";
import rpcRouter from "./rpc.js";
import reportsRouter from "./reports.js";
import uploadRouter from "./upload.js";
import userReportsRouter from "./user-reports.js";
import { authMiddleware } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");

const router: IRouter = Router();

// Serve uploaded images as static files at /api/uploads/
router.use("/uploads", express.static(UPLOADS_DIR));

// Parse JWT token on every request so requireAuth and role checks work
router.use(authMiddleware);

router.use(healthRouter);
router.use(authRouter);
router.use(dbRouter);
router.use(rpcRouter);
router.use("/reports", reportsRouter);
router.use(uploadRouter);
router.use(userReportsRouter);

export default router;
