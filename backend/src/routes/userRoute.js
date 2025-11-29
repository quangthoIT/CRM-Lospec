import express from "express";
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
  createUserEntry,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const userRouter = express.Router();

userRouter.use(authMiddleware);

// CRoute chính
userRouter.get("/me", getCurrentUser);

// Các route quản lý chung
userRouter.get("/", checkRole(["admin", "manager"]), getAllUsers);
userRouter.post("/", checkRole(["admin"]), createUserEntry);

// Các route có tham số :id
userRouter.get("/:id", getUserById); // Ai cũng xem được
userRouter.put("/:id", updateUser); // Logic check role admin
userRouter.delete("/:id", checkRole(["admin"]), deleteUser); // Admin mới xóa được

export default userRouter;
