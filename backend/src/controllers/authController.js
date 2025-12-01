import { pool } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// --- ĐĂNG KÝ ---
export const register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Kiểm tra Email tồn tại
    const userExist = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng." });
    }

    //  Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo dữ liệu mặc định
    const role = "staff";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      full_name
    )}&background=random`;

    // Insert vào DB
    const newUserQuery = `
      INSERT INTO users (email, password, full_name, phone, role, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(newUserQuery, [
      email,
      passwordHash,
      full_name,
      phone,
      role,
      avatarUrl,
    ]);

    const newUser = result.rows[0];

    // Tạo Token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Xóa hash trước khi trả về
    delete newUser.password;

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// --- ĐĂNG NHẬP ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    // So sánh mật khẩu (user.password chứa hash từ DB)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    // Check active
    if (!user.is_active) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    // Tạo Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    delete user.password;
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};
