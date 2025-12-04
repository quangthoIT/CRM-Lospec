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

// 1. Sao lưu dữ liệu (Export JSON)
export const backupData = async (req, res) => {
  try {
    // Lấy dữ liệu từ các bảng quan trọng
    const [
      users,
      customers,
      products,
      orders,
      orderItems,
      expenses,
      transactions,
      settings,
    ] = await Promise.all([
      pool.query("SELECT * FROM users"),
      pool.query("SELECT * FROM customers"),
      pool.query("SELECT * FROM products"),
      pool.query("SELECT * FROM orders"),
      pool.query("SELECT * FROM order_items"),
      pool.query("SELECT * FROM expenses"),
      pool.query("SELECT * FROM warehouse_transactions"),
      pool.query("SELECT * FROM app_settings"),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        users: users.rows,
        customers: customers.rows,
        products: products.rows,
        orders: orders.rows,
        order_items: orderItems.rows,
        expenses: expenses.rows,
        warehouse_transactions: transactions.rows,
        app_settings: settings.rows,
      },
    };

    // Trả về file JSON để download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=backup_${Date.now()}.json`
    );
    res.json(backupData);
  } catch (error) {
    console.error("Backup Error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi sao lưu dữ liệu: " + error.message });
  }
};

// 2. Phục hồi dữ liệu (Import JSON)
export const restoreData = async (req, res) => {
  const client = await pool.connect();
  try {
    const { data } = req.body; // Dữ liệu JSON được gửi từ frontend

    if (!data || !data.users || !data.products) {
      return res
        .status(400)
        .json({ message: "File sao lưu không hợp lệ hoặc thiếu dữ liệu." });
    }

    await client.query("BEGIN");

    // ⚠️ CẢNH BÁO: Xóa sạch dữ liệu cũ trước khi restore để tránh conflict ID
    // Thứ tự xóa quan trọng để tránh lỗi khóa ngoại (Foreign Key)
    await client.query(
      "TRUNCATE TABLE warehouse_transactions, order_items, expenses, orders, products, customers, users, app_settings RESTART IDENTITY CASCADE"
    );

    // Helper function để insert batch
    const insertBatch = async (table, rows) => {
      if (!rows || rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      const columns = keys.join(", ");

      // Tạo placeholders ($1, $2...), ($3, $4...)...
      const values = rows.map((row) => Object.values(row));
      const flatValues = values.flat();

      let placeholderIndex = 1;
      const placeholders = values
        .map(() => {
          const rowPlaceholders = keys
            .map(() => `$${placeholderIndex++}`)
            .join(", ");
          return `(${rowPlaceholders})`;
        })
        .join(", ");

      const query = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;
      await client.query(query, flatValues);
    };

    // Insert theo thứ tự phụ thuộc (Cha trước Con sau)
    // 1. Users, Customers, Settings
    await insertBatch("users", data.users);
    await insertBatch("customers", data.customers);
    await insertBatch("app_settings", data.app_settings);

    // 2. Products
    await insertBatch("products", data.products);

    // 3. Orders & Expenses
    await insertBatch("orders", data.orders);
    await insertBatch("expenses", data.expenses);

    // 4. Items & Transactions
    await insertBatch("order_items", data.order_items);
    await insertBatch("warehouse_transactions", data.warehouse_transactions);

    await client.query("COMMIT");
    res.json({
      message: "Phục hồi dữ liệu thành công! Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Restore Error:", error);
    res.status(500).json({ message: "Lỗi khi phục hồi: " + error.message });
  } finally {
    client.release();
  }
};
