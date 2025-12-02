import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const productRouter = express.Router();

// Public hoặc Staff đều xem được
productRouter.use(authMiddleware);

productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProductById);

// Chỉ Admin và Manager được Thêm/Sửa/Xóa
productRouter.post("/", checkRole(["admin", "manager"]), createProduct);
productRouter.put("/:id", checkRole(["admin", "manager"]), updateProduct);
productRouter.delete("/:id", checkRole(["admin", "manager"]), deleteProduct);

export default productRouter;