import { pool } from "../config/database.js";

// 1. Lấy danh sách sản phẩm (Có hỗ trợ lọc active)
export const getAllProducts = async (req, res) => {
  try {
    // Lấy tham số từ query string, mặc định page = 1, limit = 10
    const { search, category, status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Xây dựng câu điều kiện WHERE
    let whereClause = "1=1"; // Luôn đúng để dễ nối chuỗi AND
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category && category !== "all") {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status && status !== "all") {
      const isActive = status === "active";
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    // 1. Query đếm tổng số bản ghi (để tính số trang)
    const countQuery = `SELECT COUNT(*) FROM products WHERE ${whereClause}`;
    // Lưu ý: params dùng chung cho cả 2 query vì điều kiện lọc giống nhau
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Query lấy dữ liệu phân trang
    const dataQuery = `
      SELECT * FROM products
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Thêm limit và offset vào mảng params
    const dataParams = [...params, limit, offset];

    const dataResult = await pool.query(dataQuery, dataParams);

    // Trả về cấu trúc chuẩn cho phân trang
    res.status(200).json({
      data: dataResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy chi tiết 1 sản phẩm
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      description,
      unit,
      price,
      cost,
      stock_quantity,
      min_stock,
      max_stock,
      image_url,
    } = req.body;

    // Validate cơ bản
    if (!name || !sku) {
      return res.status(400).json({ message: "Tên và mã SKU là bắt buộc" });
    }

    const queryText = `
      INSERT INTO products (
        name, sku, barcode, category, description, unit,
        price, cost, stock_quantity, min_stock, max_stock, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      name,
      sku,
      barcode,
      category,
      description,
      unit,
      price || 0,
      cost || 0,
      stock_quantity || 0,
      min_stock || 10,
      max_stock || 1000,
      image_url,
    ];

    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Lỗi trùng SKU (Mã lỗi 23505)
    if (error.code === "23505") {
      return res.status(400).json({ message: "Mã SKU này đã tồn tại" });
    }
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Logic tạo câu query động (chỉ update những trường có gửi lên)
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const values = Object.values(updates);

    // Thêm ID vào cuối mảng values
    values.push(id);

    const queryText = `
      UPDATE products
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "Mã SKU bị trùng với sản phẩm khác" });
    }
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa mềm (Soft Delete)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    res.status(200).json({ message: "Đã ẩn sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
