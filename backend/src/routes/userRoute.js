import express from "express";
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
  createUserEntry,
} from "../controllers/userController.js";
import { login, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const userRouter = express.Router();

//  Routes công khai
userRouter.post("/login", login);
userRouter.post("/register", register);

// Routes cần xác thực
userRouter.use(authMiddleware);

// Routes lấy thông tin bản thân
userRouter.get("/me", getCurrentUser);

// Routes cần quyền Admin/Manager
userRouter.get("/", checkRole(["admin", "manager"]), getAllUsers);

// Routes Admin quản lý User
userRouter.post("/", checkRole(["admin"]), createUserEntry);
userRouter.delete("/:id", checkRole(["admin"]), deleteUser);

// Các route có tham số :id
userRouter.get("/:id", getUserById);
userRouter.put("/:id", updateUser);

export default userRouter;
