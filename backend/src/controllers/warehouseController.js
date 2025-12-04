import { pool } from "../config/database.js";

// ==================== IMPORT ====================

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
    res.status(500).json({ message: error.message });
  }
};

export const getImportDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const poQuery = `
      SELECT po.*, s.name as supplier_name, u.full_name as created_by
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE po.id = $1
    `;
    const poResult = await pool.query(poQuery, [id]);

    if (poResult.rows.length === 0)
      return res.status(404).json({ message: "Phiếu không tồn tại" });

    const itemsQuery = `
      SELECT wt.*, p.name as product_name, p.sku
      FROM warehouse_transactions wt
      JOIN products p ON wt.product_id = p.id
      WHERE wt.reference_id = $1 AND wt.transaction_type = 'import'
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    res.status(200).json({ ...poResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createImport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { supplier_id, products, notes, po_number } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    let subtotal = 0;
    products.forEach((p) => (subtotal += p.quantity * p.unit_price));

    const finalPoNumber = po_number || `PN-${Date.now().toString().slice(-6)}`;
    const insertPoQuery = `
      INSERT INTO purchase_orders
      (po_number, supplier_id, user_id, status, subtotal, total, payment_status, notes)
      VALUES ($1, $2, $3, 'pending', $4, $4, 'unpaid', $5)
      RETURNING id
    `;
    const poResult = await client.query(insertPoQuery, [
      finalPoNumber,
      supplier_id,
      userId,
      subtotal,
      notes,
    ]);
    const poId = poResult.rows[0].id;

    for (const item of products) {
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
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Tạo phiếu nhập thành công (Chờ duyệt)", po_id: poId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const approveImport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const poRes = await client.query(
      "SELECT status FROM purchase_orders WHERE id = $1",
      [id]
    );
    if (poRes.rows.length === 0) throw new Error("Phiếu không tồn tại");
    if (poRes.rows[0].status === "received")
      throw new Error("Phiếu đã được duyệt trước đó");

    const itemsRes = await client.query(
      "SELECT product_id, quantity, unit_price FROM warehouse_transactions WHERE reference_id = $1 AND transaction_type = 'import'",
      [id]
    );

    for (const item of itemsRes.rows) {
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

    await client.query(
      "UPDATE purchase_orders SET status = 'received', actual_delivery = NOW() WHERE id = $1",
      [id]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Duyệt phiếu nhập kho thành công" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const deleteImport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const poRes = await client.query(
      "SELECT status FROM purchase_orders WHERE id = $1",
      [id]
    );
    if (poRes.rows.length === 0) throw new Error("Phiếu không tồn tại");
    if (poRes.rows[0].status === "received")
      throw new Error("Không thể xóa phiếu đã duyệt");

    await client.query(
      "DELETE FROM warehouse_transactions WHERE reference_id = $1 AND transaction_type = 'import'",
      [id]
    );
    await client.query("DELETE FROM purchase_orders WHERE id = $1", [id]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Xóa phiếu nhập thành công" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ==================== EXPORT ====================

// Lấy lịch sử xuất kho
export const getExportHistory = async (req, res) => {
  try {
    const query = `
      SELECT
        wt.reference_id as id,
        MAX(wt.created_at) as date,
        MAX(wt.notes) as notes,
        SUM(wt.quantity) as total_quantity,
        SUM(wt.total) as total_value,
        -- Dựa vào reference_type để xác định trạng thái
        CASE
          WHEN MAX(wt.reference_type) = 'export_pending' THEN 'pending'
          ELSE 'completed'
        END as status,
        json_agg(json_build_object(
          'product_id', p.id,
          'product_name', p.name,
          'sku', p.sku,
          'quantity', wt.quantity,
          'unit_price', wt.unit_price,
          'total', wt.total
        )) as items
      FROM warehouse_transactions wt
      LEFT JOIN products p ON wt.product_id = p.id
      WHERE wt.transaction_type = 'export'
        AND wt.reference_type IN ('export_pending', 'manual_export') -- Lọc đúng loại
      GROUP BY wt.reference_id
      ORDER BY date DESC
    `;

    const result = await pool.query(query);

    const exports = result.rows.map((row) => ({
      id: row.id,
      code: `PX-${row.id.substring(0, 8).toUpperCase()}`,
      date: row.date,
      notes: row.notes,
      totalQuantity: Number(row.total_quantity),
      totalValue: Number(row.total_value),
      status: row.status,
      items: row.items,
    }));

    res.status(200).json(exports);
  } catch (error) {
    console.error("Get Export History Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết
export const getExportDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const itemsQuery = `
      SELECT wt.*, p.name as product_name, p.sku, u.full_name as created_by
      FROM warehouse_transactions wt
      JOIN products p ON wt.product_id = p.id
      LEFT JOIN users u ON wt.user_id = u.id
      WHERE wt.reference_id = $1 AND wt.transaction_type = 'export'
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    if (itemsResult.rows.length === 0) {
      return res.status(404).json({ message: "Phiếu xuất không tồn tại" });
    }

    const firstItem = itemsResult.rows[0];
    // Kiểm tra status dựa trên reference_type
    const status =
      firstItem.reference_type === "export_pending" ? "pending" : "completed";

    const totalValue = itemsResult.rows.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );
    const totalQuantity = itemsResult.rows.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    const exportDetail = {
      id: id,
      code: `PX-${id.substring(0, 8).toUpperCase()}`,
      date: firstItem.created_at,
      notes: firstItem.notes,
      status: status,
      total: totalValue,
      totalQuantity: totalQuantity,
      created_by: firstItem.created_by,
      items: itemsResult.rows,
    };

    res.status(200).json(exportDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. TẠO PHIẾU XUẤT (SỬA LẠI transaction_type)
export const createExport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { products, notes } = req.body;
    const userId = req.user.id;
    const batchId = crypto.randomUUID();

    await client.query("BEGIN");

    for (const item of products) {
      // Vẫn kiểm tra tồn kho
      const checkStock = await client.query(
        "SELECT stock_quantity FROM products WHERE id = $1",
        [item.product_id]
      );
      if (checkStock.rows[0]?.stock_quantity < item.quantity) {
        throw new Error(`Không đủ tồn kho cho sản phẩm ID ${item.product_id}`);
      }

      const transQuery = `
        INSERT INTO warehouse_transactions
        (transaction_type, product_id, quantity, unit_price, total, reference_type, reference_id, user_id, notes)
        VALUES ('export', $1, $2, $3, $4, 'export_pending', $5, $6, $7)
      `;
      // Lưu ý: transaction_type là 'export' (để hợp lệ DB), nhưng reference_type là 'export_pending'

      await client.query(transQuery, [
        item.product_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        batchId,
        userId,
        notes,
      ]);
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Tạo phiếu xuất nháp thành công", batch_id: batchId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Export Error:", error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const approveExport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Tìm các items đang pending
    const itemsQuery = `
      SELECT product_id, quantity
      FROM warehouse_transactions
      WHERE reference_id = $1
        AND transaction_type = 'export'
        AND reference_type = 'export_pending'
    `;
    const itemsRes = await client.query(itemsQuery, [id]);

    if (itemsRes.rows.length === 0) {
      throw new Error("Phiếu này đã được duyệt hoặc không tồn tại");
    }

    for (const item of itemsRes.rows) {
      // Lock row để trừ kho an toàn
      const productRes = await client.query(
        "SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE",
        [item.product_id]
      );
      const currentStock = productRes.rows[0].stock_quantity;

      if (currentStock < item.quantity) {
        throw new Error(
          `Không đủ tồn kho (Còn: ${currentStock}, Cần: ${item.quantity})`
        );
      }

      // Trừ kho
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2",
        [item.quantity, item.product_id]
      );
    }

    // Đổi trạng thái sang 'manual_export' (hoặc 'export_completed')
    await client.query(
      "UPDATE warehouse_transactions SET reference_type = 'manual_export' WHERE reference_id = $1",
      [id]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Duyệt phiếu xuất kho thành công" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const deleteExport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM warehouse_transactions WHERE reference_id = $1 AND reference_type = 'export_pending'",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Không thể xóa phiếu đã hoàn thành hoặc không tồn tại",
      });
    }

    res.status(200).json({ message: "Đã xóa phiếu xuất nháp" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== COMMON ====================

export const getStockAlerts = async (req, res) => {
  try {
    // Lấy các sản phẩm có tồn kho <= mức tối thiểu
    // COALESCE(min_stock, 10): Nếu chưa set min_stock thì mặc định là 10
    const query = `
      SELECT * FROM products
      WHERE stock_quantity <= COALESCE(min_stock, 10)
      AND is_active = true
      ORDER BY stock_quantity ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Stock Alerts Error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy cảnh báo tồn kho: " + error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const query = `
      SELECT wt.*, p.name as product_name, p.sku, u.full_name as user_name
      FROM warehouse_transactions wt
      LEFT JOIN products p ON wt.product_id = p.id
      LEFT JOIN users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: error.message });
  }
};
