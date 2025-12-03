import express from "express";
import {
  getImportHistory,
  getImportDetail,
  createImport,
  getExportHistory,
  createExport,
  getStockAlerts,
  getAllTransactions,
  approveImport,
  getExportDetail,
  approveExport,
  deleteExport,
  deleteImport,
} from "../controllers/warehouseController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const warehouseRouter = express.Router();

warehouseRouter.use(authMiddleware);

// --- Import Routes ---
warehouseRouter.get("/purchase-orders", getImportHistory);
warehouseRouter.get("/purchase-orders/:id", getImportDetail); // API mới để xem chi tiết
warehouseRouter.post("/import", checkRole(["admin", "manager"]), createImport);
warehouseRouter.put(
  "/purchase-orders/:id/approve",
  checkRole(["admin", "manager"]),
  approveImport
);
warehouseRouter.delete(
  "/purchase-orders/:id",
  checkRole(["admin", "manager"]),
  deleteImport
);

// --- Export Routes ---
warehouseRouter.get("/exports", getExportHistory); // API lấy danh sách xuất kho
warehouseRouter.get("/exports/:id", getExportDetail);
warehouseRouter.post("/export", checkRole(["admin", "manager"]), createExport);
warehouseRouter.put(
  "/exports/:id/approve",
  checkRole(["admin", "manager"]),
  approveExport
);
warehouseRouter.delete(
  "/exports/:id",
  checkRole(["admin", "manager"]),
  deleteExport
);
// --- Utils ---
warehouseRouter.get("/alerts", getStockAlerts);
warehouseRouter.get("/transactions", getAllTransactions);

export default warehouseRouter;
