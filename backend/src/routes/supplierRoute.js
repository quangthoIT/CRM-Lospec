import express from "express";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const supplierRouter = express.Router();

supplierRouter.use(authMiddleware);

// Ai cũng xem được, nhưng chỉ Admin/Manager mới được sửa đổi
supplierRouter.get("/", getAllSuppliers);
supplierRouter.post("/", checkRole(["admin", "manager"]), createSupplier);
supplierRouter.put("/:id", checkRole(["admin", "manager"]), updateSupplier);
supplierRouter.delete("/:id", checkRole(["admin", "manager"]), deleteSupplier);

export default supplierRouter;