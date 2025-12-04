import { pool } from "../config/database.js";

// 1. Lấy thống kê tổng quan (Dashboard Cards) theo ngày
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // A. Thống kê trong khoảng thời gian chọn (Period)
    const periodRes = await pool.query(
      `
      SELECT
        SUM(total) as revenue,
        COUNT(*) as orders,
        SUM(total - (subtotal * 0.7)) as profit -- Giả sử lợi nhuận 30% (Tạm tính)
      FROM orders
      WHERE date(created_at) >= $1 AND date(created_at) <= $2 AND status = 'completed'
    `,
      [startDate, endDate]
    );

    // B. Khách hàng mới trong khoảng thời gian
    const customerRes = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM customers
      WHERE date(created_at) >= $1 AND date(created_at) <= $2
    `,
      [startDate, endDate]
    );

    // C. Sản phẩm sắp hết hàng (Realtime)
    const stockRes = await pool.query(`
      SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock AND is_active = true
    `);

    res.status(200).json({
      period: {
        revenue: Number(periodRes.rows[0].revenue || 0),
        orders: Number(periodRes.rows[0].orders || 0),
        profit: Number(periodRes.rows[0].profit || 0),
      },
      newCustomers: Number(customerRes.rows[0].count || 0),
      lowStock: Number(stockRes.rows[0].count || 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Dữ liệu biểu đồ doanh thu theo khoảng ngày
export const getRevenueChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT to_char(date, 'DD/MM') as name, revenue, total_orders
      FROM view_daily_sales
      WHERE date >= $1 AND date <= $2
      ORDER BY date ASC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Top sản phẩm bán chạy theo khoảng ngày
export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT
        p.id, p.name, p.sku,
        SUM(oi.quantity) as sold_quantity,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND date(o.created_at) >= $1
        AND date(o.created_at) <= $2
      GROUP BY p.id, p.name, p.sku
      ORDER BY sold_quantity DESC
      LIMIT 5
    `;

    const result = await pool.query(query, [startDate, endDate]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
