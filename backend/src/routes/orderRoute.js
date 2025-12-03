import express from "express";
import {
  getOrders,
  getOrderDetail,
  createOrder,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.use(authMiddleware);

orderRouter.get("/", getOrders);
orderRouter.get("/:id", getOrderDetail);
orderRouter.post("/", createOrder); // Tạo đơn hàng (POS)

export default orderRouter;
