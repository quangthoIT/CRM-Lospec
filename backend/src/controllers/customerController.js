import { pool } from "../config/database.js";

// Lấy danh sách khách hàng
export const getAllCustomers = async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = `
      SELECT * FROM customers
      WHERE is_active = true
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (name ILIKE $${idx} OR phone ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (type && type !== "all") {
      query += ` AND customer_type = $${idx}`;
      params.push(type);
      idx++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết khách hàng
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customerRes = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );
    if (customerRes.rows.length === 0)
      return res.status(404).json({ message: "Khách hàng không tồn tại" });

    const ordersRes = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10",
      [id]
    );

    res.status(200).json({
      ...customerRes.rows[0],
      recent_orders: ordersRes.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CẬP NHẬT: Tạo khách hàng (Thêm birth_date, gender, customer_type)
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      city,
      notes,
      birth_date,
      gender,
      customer_type,
    } = req.body;

    // Check trùng sđt
    if (phone) {
      const exist = await pool.query(
        "SELECT id FROM customers WHERE phone = $1",
        [phone]
      );
      if (exist.rows.length > 0)
        return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
    }

    const query = `
      INSERT INTO customers (
        name, phone, email, address, city, notes,
        birth_date, gender, customer_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      name,
      phone,
      email,
      address,
      city,
      notes,
      birth_date || null,
      gender || "male",
      customer_type || "regular",
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CẬP NHẬT: Sửa khách hàng (Thêm các trường bị thiếu)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      city,
      notes,
      customer_type,
      birth_date,
      gender,
    } = req.body;

    const query = `
      UPDATE customers
      SET name = $1,
          phone = $2,
          email = $3,
          address = $4,
          city = $5,
          notes = $6,
          customer_type = $7,
          birth_date = $8,
          gender = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      name,
      phone,
      email,
      address,
      city,
      notes,
      customer_type,
      birth_date || null,
      gender,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Khách hàng không tồn tại" });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa khách hàng
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete: update is_active = false
    const result = await pool.query(
      "UPDATE customers SET is_active = false WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Khách hàng không tồn tại" });

    res.status(200).json({ message: "Đã xóa khách hàng" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
