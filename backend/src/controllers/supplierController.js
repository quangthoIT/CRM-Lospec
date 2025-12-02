import { pool } from "../config/database.js";

// Lấy danh sách nhà cung cấp
export const getAllSuppliers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM suppliers WHERE is_active = true ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo nhà cung cấp mới
export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, tax_code } = req.body;

    const query = `
      INSERT INTO suppliers (name, contact_person, email, phone, address, tax_code)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, contact_person, email, phone, address, tax_code];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật nhà cung cấp
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, tax_code } = req.body;

    const query = `
      UPDATE suppliers
      SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5, tax_code=$6, updated_at=NOW()
      WHERE id=$7
      RETURNING *
    `;
    const values = [name, contact_person, email, phone, address, tax_code, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa mềm nhà cung cấp
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE suppliers SET is_active = false WHERE id = $1", [id]);
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};