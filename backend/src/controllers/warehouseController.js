import { pool } from "../config/database.js";
import crypto from "crypto";

// ==========================================
// 1. QUẢN LÝ NHẬP KHO (IMPORT)
// ==========================================

// Lấy danh sách phiếu nhập (Purchase Orders)
export const getImportHistory = async (req, res) => {
  try {
    const query = `
      SELECT po.*, s.name as supplier_name, u.full_name as created_by
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      ORDER BY po.created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Import History Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết một phiếu nhập (kèm sản phẩm)
export const getImportDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin Header
    const poQuery = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `;
    const poResult = await pool.query(poQuery, [id]);

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu nhập" });
    }

    // Lấy danh sách sản phẩm trong phiếu đó (từ bảng transaction)
    const itemsQuery = `
      SELECT wt.*, p.name as product_name, p.sku, p.barcode
      FROM warehouse_transactions wt
      JOIN products p ON wt.product_id = p.id
      WHERE wt.reference_id = $1 AND wt.transaction_type = 'import'
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    res.status(200).json({
      ...poResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo phiếu nhập kho (Transaction: Tạo PO -> Ghi Log -> Cộng Kho)
export const createImport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { supplier_id, products, notes, po_number } = req.body;
    // products: [{ product_id, quantity, unit_price }]
    const userId = req.user.id;

    await client.query("BEGIN"); // Bắt đầu giao dịch

    // 1. Tính tổng tiền
    let subtotal = 0;
    products.forEach((p) => (subtotal += p.quantity * p.unit_price));

    // 2. Tạo Purchase Order
    const finalPoNumber = po_number || `PN-${Date.now().toString().slice(-6)}`;
    const insertPoQuery = `
      INSERT INTO purchase_orders
      (po_number, supplier_id, user_id, status, subtotal, total, payment_status, actual_delivery)
      VALUES ($1, $2, $3, 'received', $4, $4, 'paid', NOW())
      RETURNING id
    `;
    const poResult = await client.query(insertPoQuery, [
      finalPoNumber,
      supplier_id,
      userId,
      subtotal,
    ]);
    const poId = poResult.rows[0].id;

    // 3. Xử lý từng sản phẩm
    for (const item of products) {
      // 3a. Ghi lịch sử giao dịch (Warehouse Transaction)
      const transQuery = `
        INSERT INTO warehouse_transactions
        (transaction_type, product_id, quantity, unit_price, total, reference_type, reference_id, user_id, supplier_id, notes)
        VALUES ('import', $1, $2, $3, $4, 'purchase_order', $5, $6, $7, $8)
      `;
      await client.query(transQuery, [
        item.product_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        poId,
        userId,
        supplier_id,
        notes,
      ]);

      // 3b. CỘNG tồn kho & Cập nhật giá vốn
      const updateStockQuery = `
        UPDATE products
        SET stock_quantity = stock_quantity + $1,
            cost = $2,
            updated_at = NOW()
        WHERE id = $3
      `;
      await client.query(updateStockQuery, [
        item.quantity,
        item.unit_price,
        item.product_id,
      ]);
    }

    await client.query("COMMIT"); // Xác nhận thành công
    res.status(201).json({ message: "Nhập kho thành công", po_id: poId });
  } catch (error) {
    await client.query("ROLLBACK"); // Có lỗi -> Hoàn tác tất cả
    console.error("Create Import Error:", error);
    res.status(500).json({ message: "Lỗi nhập kho: " + error.message });
  } finally {
    client.release();
  }
};

// ==========================================
// 2. QUẢN LÝ XUẤT KHO (EXPORT)
// ==========================================

// Lấy lịch sử xuất kho (Gom nhóm theo Batch/Reference ID)
export const getExportHistory = async (req, res) => {
  try {
    // Lấy các giao dịch xuất kho, gom nhóm theo reference_id (Batch ID)
    // Lưu ý: Postgres không hỗ trợ JSON Aggregation dễ dàng như Supabase,
    // nên ta lấy danh sách transaction rồi xử lý group ở Backend hoặc dùng subquery
    const query = `
      SELECT
        wt.reference_id as id,
        MAX(wt.created_at) as date,
        MAX(wt.notes) as notes,
        SUM(wt.quantity) as total_quantity,
        SUM(wt.total) as total_value,
        'completed' as status,
        json_agg(json_build_object(
          'product_name', p.name,
          'sku', p.sku,
          'quantity', wt.quantity,
          'unit_price', wt.unit_price,
          'total', wt.total
        )) as items
      FROM warehouse_transactions wt
      JOIN products p ON wt.product_id = p.id
      WHERE wt.transaction_type = 'export'
      GROUP BY wt.reference_id
      ORDER BY date DESC
    `;

    const result = await pool.query(query);

    // Map dữ liệu để khớp với Frontend
    const exports = result.rows.map((row) => ({
      id: row.id,
      code: `PX-${row.id.slice(0, 8).toUpperCase()}`,
      date: row.date,
      notes: row.notes,
      totalQuantity: row.total_quantity,
      totalValue: row.total_value,
      status: row.status,
      items: row.items,
    }));

    res.status(200).json(exports);
  } catch (error) {
    console.error("Get Export History Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Tạo phiếu xuất kho (Transaction: Check Tồn -> Trừ Kho -> Ghi Log)
export const createExport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { products, notes } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    const batchId = crypto.randomUUID(); // Mã đợt xuất kho

    for (const item of products) {
      // 1. Kiểm tra tồn kho hiện tại
      const checkStockRes = await client.query(
        "SELECT stock_quantity, name FROM products WHERE id = $1 FOR UPDATE", // Lock dòng để tránh race condition
        [item.product_id]
      );

      const product = checkStockRes.rows[0];
      if (!product)
        throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);

      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Sản phẩm "${product.name}" không đủ tồn kho (Còn: ${product.stock_quantity}, Yêu cầu: ${item.quantity})`
        );
      }

      // 2. TRỪ tồn kho
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2",
        [item.quantity, item.product_id]
      );

      // 3. Ghi Log
      const transQuery = `
        INSERT INTO warehouse_transactions
        (transaction_type, product_id, quantity, unit_price, total, reference_type, reference_id, user_id, notes)
        VALUES ('export', $1, $2, $3, $4, 'manual_export', $5, $6, $7)
      `;
      await client.query(transQuery, [
        item.product_id,
        item.quantity, // Lưu số dương (loại export ngầm hiểu là trừ)
        item.unit_price,
        item.quantity * item.unit_price,
        batchId,
        userId,
        notes,
      ]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Xuất kho thành công", batch_id: batchId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Export Error:", error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ==========================================
// 3. TIỆN ÍCH KHÁC
// ==========================================

// Lấy cảnh báo tồn kho (Stock Alerts)
export const getStockAlerts = async (req, res) => {
  try {
    // Lấy sản phẩm có tồn kho <= min_stock
    const query = `
      SELECT id, sku, name, category, stock_quantity, min_stock, is_active
      FROM products
      WHERE stock_quantity <= min_stock AND is_active = true
      ORDER BY stock_quantity ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy toàn bộ log giao dịch (Thẻ kho chi tiết)
export const getAllTransactions = async (req, res) => {
  try {
    const query = `
      SELECT wt.*, p.name as product_name, p.sku, u.full_name as user_name
      FROM warehouse_transactions wt
      LEFT JOIN products p ON wt.product_id = p.id
      LEFT JOIN users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
