import { pool } from "../config/database.js";

// Lấy thông tin cài đặt
export const getSettings = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM app_settings WHERE id = 1");
    if (result.rows.length === 0) {
      // Nếu chưa có (trường hợp hiếm), tạo default
      await pool.query("INSERT INTO app_settings (id) VALUES (1)");
      return res.json({ store_name: "Cửa hàng mới", tax_rate: 0 });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật cài đặt
export const updateSettings = async (req, res) => {
  try {
    const {
      store_name,
      store_address,
      store_phone,
      store_email,
      tax_rate,
      bank_account_no,
      bank_name,
      bank_owner,
    } = req.body;

    const query = `
      UPDATE app_settings
      SET store_name = $1,
          store_address = $2,
          store_phone = $3,
          store_email = $4,
          tax_rate = $5,
          bank_account_no = $6,
          bank_name = $7,
          bank_owner = $8,
          updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;

    const result = await pool.query(query, [
      store_name,
      store_address,
      store_phone,
      store_email,
      tax_rate,
      bank_account_no,
      bank_name,
      bank_owner,
    ]);

    res.json({ message: "Cập nhật thành công", settings: result.rows[0] });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
};
