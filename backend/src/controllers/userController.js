import bcrypt from "bcrypt";
import { pool } from "../config/database.js";

// Lấy thông tin user đang đăng nhập (từ token)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user đã có từ middleware, nhưng query lại để đảm bảo dữ liệu mới nhất
    const result = await pool.query(
      "SELECT id, email, full_name, phone, role, avatar_url, is_active FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const user = result.rows[0];

    if (user) delete user.password;
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh sách user (cho Admin/Manager)
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    // Xóa password khỏi danh sách trả về
    const users = result.rows.map((u) => {
      const { password, ...rest } = u; // Destructuring để loại bỏ password
      return rest;
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết 1 user theo ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = result.rows[0];
    delete user.password; // Xóa password hash
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin tạo User mới (Kèm password)
export const createUserEntry = async (req, res) => {
  try {
    const { email, full_name, role, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Bắt buộc nhập mật khẩu" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert vào DB (Lưu ý cột là 'password')
    const queryText = `
      INSERT INTO users (email, full_name, role, phone, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role, phone, created_at
    `;

    const result = await pool.query(queryText, [
      email,
      full_name,
      role,
      phone,
      passwordHash,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Bắt lỗi trùng email (Postgres error code 23505)
    if (error.code === "23505") {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật thông tin User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, avatar_url, is_active } = req.body;
    const currentUserRole = req.user.role;

    // Logic xây dựng câu query động
    let fieldsToUpdate = [];
    let values = [];
    let paramIndex = 1;

    const addField = (colName, value) => {
      fieldsToUpdate.push(`${colName} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    };

    if (full_name) addField("full_name", full_name);
    if (phone) addField("phone", phone);
    if (avatar_url) addField("avatar_url", avatar_url);

    // Chỉ Admin mới được update Role và Active status
    if (currentUserRole === "admin") {
      if (role) addField("role", role);
      if (typeof is_active !== "undefined") addField("is_active", is_active);
    }

    fieldsToUpdate.push(`updated_at = NOW()`);

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: "Không có trường để cập nhật" });
    }

    values.push(id);

    const queryText = `
        UPDATE users
        SET ${fieldsToUpdate.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
    `;

    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const updatedUser = result.rows[0];
    delete updatedUser.password;

    res
      .status(200)
      .json({ message: "Cập nhật người dùng thành công", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ message: "Người dùng đã bị khóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Lấy mật khẩu cũ từ DB
    const userRes = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = userRes.rows[0];

    // Kiểm tra pass cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash pass mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update DB
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
