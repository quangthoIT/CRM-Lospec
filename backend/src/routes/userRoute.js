import express from "express";
import {
  getAllUsers,
  createUserEntry,
  updateUser,
  deleteUser,
  getCurrentUser,
  getUserById,
} from "../controllers/userController.js";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";
import { login, register } from "../controllers/authController.js";

const userRouter = express.Router();

// --- CÔNG KHAI ---
userRouter.post("/login", login);
userRouter.post("/register", register);

userRouter.use(authMiddleware);

// --- CÁ NHÂN ---
userRouter.get("/me", getCurrentUser);
userRouter.post("/attendance/check-in", checkIn);
userRouter.post("/attendance/check-out", checkOut);
userRouter.get("/attendance/my-history", getMyAttendance);

// --- QUẢN LÝ ---
// Chỉ Admin hoặc Manager mới xem được danh sách nhân viên
userRouter.get("/", checkRole(["admin", "manager"]), getAllUsers);

// Chỉ Admin mới được Thêm/Sửa/Xóa nhân viên
userRouter.post("/", checkRole(["admin"]), createUserEntry);
userRouter.put("/:id", checkRole(["admin"]), updateUser);
userRouter.delete("/:id", checkRole(["admin"]), deleteUser);

// Quản lý xem chấm công toàn bộ
userRouter.get(
  "/attendance/all",
  checkRole(["admin", "manager"]),
  getAllAttendance
);

userRouter.get("/:id", getUserById);

export default userRouter;
