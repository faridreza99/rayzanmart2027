import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import affiliatesRouter from "./affiliates";
import adminRouter from "./admin";
import marketingRouter from "./marketing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(affiliatesRouter);
router.use(adminRouter);
router.use(marketingRouter);

export default router;
