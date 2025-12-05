import { pool } from "../config/database.js";

// 1. Lấy danh sách khuyến mãi (Admin quản lý)
export const getPromotions = async (req, res) => {
  try {
    const { active } = req.query;
    let query = `SELECT * FROM promotions WHERE 1=1`;
    const params = [];

    if (active === "true") {
      query += ` AND is_active = true AND end_date >= NOW()`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo khuyến mãi mới
export const createPromotion = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      min_order_value,
      max_discount,
      start_date,
      end_date,
      usage_limit,
    } = req.body;

    // Validate Code trùng
    const checkCode = await pool.query(
      "SELECT id FROM promotions WHERE code = $1",
      [code.toUpperCase()]
    );
    if (checkCode.rows.length > 0) {
      return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
    }

    const query = `
      INSERT INTO promotions
      (code, name, type, value, min_order_value, max_discount, start_date, end_date, usage_limit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      code.toUpperCase(),
      name,
      type,
      value,
      min_order_value || 0,
      max_discount || 0,
      start_date,
      end_date,
      usage_limit || 0,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Cập nhật khuyến mãi
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Loại bỏ các trường không cho sửa trực tiếp (như code, used_count)
    delete updates.code;
    delete updates.used_count;

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0)
      return res.status(400).json({ message: "Không có dữ liệu cập nhật" });

    values.push(id);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

    const query = `
      UPDATE promotions SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa khuyến mãi
export const deletePromotion = async (req, res) => {
  try {
    await pool.query("DELETE FROM promotions WHERE id = $1", [req.params.id]);
    res.status(200).json({ message: "Đã xóa khuyến mãi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. LOGIC QUAN TRỌNG: KIỂM TRA MÃ (Dùng cho POS)
// ==========================================
export const validatePromotion = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const total = Number(orderTotal) || 0;

    const query = `SELECT * FROM promotions WHERE code = $1 AND is_active = true`;
    const result = await pool.query(query, [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ valid: false, message: "Mã không tồn tại hoặc đã bị khóa" });
    }

    const promo = result.rows[0];
    const now = new Date();

    // Check thời gian
    if (now < new Date(promo.start_date))
      return res
        .status(400)
        .json({ valid: false, message: "Chương trình chưa bắt đầu" });
    if (now > new Date(promo.end_date))
      return res.status(400).json({ valid: false, message: "Mã đã hết hạn" });

    // Check số lượng sử dụng
    if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) {
      return res
        .status(400)
        .json({ valid: false, message: "Mã đã hết lượt sử dụng" });
    }

    // Check giá trị đơn tối thiểu
    if (total < Number(promo.min_order_value)) {
      return res.status(400).json({
        valid: false,
        message: `Đơn hàng phải từ ${new Intl.NumberFormat("vi-VN").format(
          promo.min_order_value
        )}đ để áp dụng mã này`,
      });
    }

    // TÍNH TOÁN SỐ TIỀN GIẢM
    let discountAmount = 0;
    if (promo.type === "fixed") {
      discountAmount = Number(promo.value);
    } else if (promo.type === "percentage") {
      discountAmount = (total * Number(promo.value)) / 100;
      // Check giới hạn giảm tối đa
      if (
        Number(promo.max_discount) > 0 &&
        discountAmount > Number(promo.max_discount)
      ) {
        discountAmount = Number(promo.max_discount);
      }
    }

    // Đảm bảo không giảm quá giá trị đơn hàng
    discountAmount = Math.min(discountAmount, total);

    res.status(200).json({
      valid: true,
      discountAmount: discountAmount,
      discountType: promo.type,
      discountValue: promo.value,
      code: promo.code,
      message: "Áp dụng mã thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
