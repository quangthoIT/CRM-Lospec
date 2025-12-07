import express from "express";
import {
  exportReport,
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
} from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/auth.js";

const reportRouter = express.Router();

reportRouter.use(authMiddleware);

reportRouter.get("/dashboard", getDashboardStats);
reportRouter.get("/chart", getRevenueChart);
reportRouter.get("/top-products", getTopProducts);
reportRouter.get("/export", exportReport);

export default reportRouter;
