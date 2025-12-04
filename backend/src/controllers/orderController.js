import { pool } from "../config/database.js";
import crypto from "crypto";

// Lấy danh sách đơn hàng (Đã sửa để hỗ trợ filter ngày)
export const getOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let query = `
      SELECT o.*, c.name as customer_name, u.full_name as staff_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // ✅ Filter theo trạng thái
    if (status && status !== 'all') {
      query += ` AND o.status = $${idx++}`;
      params.push(status);
    }

    // ✅ Filter theo ngày (Quan trọng cho Báo cáo Tài chính)
    if (startDate) {
      query += ` AND date(o.created_at) >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(o.created_at) <= $${idx++}`;
      params.push(endDate);
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... (Các hàm getOrderDetail, createOrder giữ nguyên)
export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const orderQuery = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.full_name as staff_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const orderResult = await pool.query(orderQuery, [id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const itemsQuery = `
      SELECT oi.*, p.sku, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    res.status(200).json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_id, items, discount, payment_method, notes } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) return res.status(400).json({message: "Giỏ hàng trống"});

    await client.query("BEGIN");

    let subtotal = 0;
    items.forEach(item => { subtotal += item.quantity * item.unit_price; });

    const taxRate = 0.1;
    const taxableAmount = Math.max(0, subtotal - (discount || 0));
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    const orderQuery = `
      INSERT INTO orders (customer_id, user_id, status, subtotal, discount, tax, total, payment_method, payment_status, notes)
      VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, 'paid', $8)
      RETURNING id, order_number, created_at, subtotal, discount, tax, total
    `;
    const orderResult = await client.query(orderQuery, [
      customer_id || null, userId, subtotal, discount || 0, tax, total, payment_method, notes
    ]);
    const order = orderResult.rows[0];

    for (const item of items) {
        await client.query(`INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [order.id, item.product_id, item.name, item.sku, item.quantity, item.unit_price, item.quantity * item.unit_price]);

        await client.query(`UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2`, [item.quantity, item.product_id]);

        await client.query(`INSERT INTO warehouse_transactions (transaction_type, product_id, quantity, unit_price, total, reference_type, reference_id, user_id, notes) VALUES ('export', $1, $2, $3, $4, 'order', $5, $6, $7)`,
            [item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price, order.id, userId, `Bán hàng đơn ${order.order_number}`]);
    }

    if (customer_id) {
         await client.query(`UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + $1, updated_at = NOW() WHERE id = $2`, [total, customer_id]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Thanh toán thành công", order });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Order Error:", error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};