import express from "express";
import {
  getImportHistory,
  getImportDetail,
  createImport,
  getExportHistory,
  createExport,
  getStockAlerts,
  getAllTransactions,
} from "../controllers/warehouseController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const warehouseRouter = express.Router();

warehouseRouter.use(authMiddleware);

// --- Import Routes ---
warehouseRouter.get("/purchase-orders", getImportHistory);
warehouseRouter.get("/purchase-orders/:id", getImportDetail); // API mới để xem chi tiết
warehouseRouter.post("/import", checkRole(["admin", "manager"]), createImport);

// --- Export Routes ---
warehouseRouter.get("/exports", getExportHistory); // API lấy danh sách xuất kho
warehouseRouter.post("/export", checkRole(["admin", "manager"]), createExport);

// --- Utils ---
warehouseRouter.get("/alerts", getStockAlerts);
warehouseRouter.get("/transactions", getAllTransactions);

export default warehouseRouter;
