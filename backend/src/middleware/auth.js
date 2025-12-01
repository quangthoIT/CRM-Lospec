import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Truy cập bị từ chối. Vui lòng đăng nhập." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query("SELECT * FROM users WHERE id=$1", [
      decoded.id,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc người dùng không tồn tại." });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: "Tài khoản đã bị khóa." });
    }

    delete user.password; // Xóa password hash

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(403).json({ message: "Token không hợp lệ." });
  }
};
