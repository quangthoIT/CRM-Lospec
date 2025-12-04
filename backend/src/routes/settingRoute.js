import express from "express";
import {
  backupData,
  getSettings,
  restoreData,
  updateSettings,
} from "../controllers/settingController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const settingRouter = express.Router();

settingRouter.use(authMiddleware);

// Ai cũng xem được cấu hình (để in hóa đơn)
settingRouter.get("/", getSettings);

// Chỉ Admin mới được sửa cấu hình
settingRouter.put("/", checkRole(["admin"]), updateSettings);

// Backup & Restore (Chỉ Admin)
settingRouter.get("/backup", checkRole(["admin"]), backupData);
settingRouter.post("/restore", checkRole(["admin"]), restoreData);

export default settingRouter;
