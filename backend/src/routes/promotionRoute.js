import express from "express";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
} from "../controllers/promotionController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const promotionRouter = express.Router();

promotionRouter.use(authMiddleware);

// Quản lý (Chỉ Admin/Manager)
promotionRouter.get("/", checkRole(["admin", "manager"]), getPromotions);
promotionRouter.post("/", checkRole(["admin", "manager"]), createPromotion);
promotionRouter.put("/:id", checkRole(["admin", "manager"]), updatePromotion);
promotionRouter.delete("/:id", checkRole(["admin"]), deletePromotion);

// Sử dụng (Cho cả Staff)
promotionRouter.post("/validate", validatePromotion);

export default promotionRouter;
