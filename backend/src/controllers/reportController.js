import { pool } from "../config/database.js";

// 1. Lấy thống kê tổng quan (Dashboard Cards)
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // --- A. THỐNG KÊ HÔM NAY ---
    const todayQuery = `
      SELECT
        COALESCE(SUM(total), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE
        status = 'completed'
        AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
    `;
    const todayRes = await pool.query(todayQuery);

    // --- B. THỐNG KÊ THÁNG NÀY ---
    const monthQuery = `
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE
        status = 'completed'
        AND to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') = to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM')
    `;
    const monthRes = await pool.query(monthQuery);

    // --- C. KHÁCH HÀNG MỚI ---
    let customerQuery = "";
    let customerParams = [];

    if (startDate && endDate) {
      // Nếu có bộ lọc ngày -> Lấy khách hàng đăng ký trong khoảng đó
      customerQuery = `
          SELECT COUNT(id) as count
          FROM customers
          WHERE
            date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
            AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
        `;
      customerParams = [startDate, endDate];
    } else {
      // Mặc định: Lấy hôm nay
      customerQuery = `
          SELECT COUNT(id) as count
          FROM customers
          WHERE
            date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
        `;
    }
    const customerRes = await pool.query(customerQuery, customerParams);

    // --- D. CẢNH BÁO TỒN KHO (Giữ nguyên) ---
    let stockQuery = "";
    let stockParams = [];

    if (startDate && endDate) {
      stockQuery = `
          SELECT COUNT(id) as count FROM products
          WHERE
            stock_quantity <= COALESCE(min_stock, 10)
            AND is_active = true
            AND date(updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
            AND date(updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
        `;
      stockParams = [startDate, endDate];
    } else {
      // Mặc định: Hôm nay (Những SP thấp tồn kho mà có biến động hôm nay)
      stockQuery = `
          SELECT COUNT(id) as count FROM products
          WHERE
            stock_quantity <= COALESCE(min_stock, 10)
            AND is_active = true
        `;
    }
    const stockRes = await pool.query(stockQuery, stockParams);

    // --- E. THỐNG KÊ THEO KHOẢNG THỜI GIAN (Dùng cho trang Report) ---
    let periodStats = { revenue: 0, orders: 0, profit: 0 };
    if (startDate && endDate) {
      const periodQuery = `
            SELECT
                COALESCE(SUM(total), 0) as revenue,
                COUNT(id) as orders,
                COALESCE(SUM(total), 0) - COALESCE((
                  SELECT SUM(oi.quantity * p.cost)
                  FROM order_items oi
                  JOIN products p ON oi.product_id = p.id
                  WHERE oi.order_id IN (
                    SELECT id FROM orders
                    WHERE status = 'completed'
                    AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
                    AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
                  )
                ), 0) as profit
            FROM orders
            WHERE
                status = 'completed'
                AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
                AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
        `;
      const periodRes = await pool.query(periodQuery, [startDate, endDate]);
      if (periodRes.rows.length > 0) {
        periodStats = {
          revenue: Number(periodRes.rows[0].revenue),
          orders: Number(periodRes.rows[0].orders),
          profit: Number(periodRes.rows[0].profit),
        };
      }
    }

    res.status(200).json({
      today: {
        revenue: Number(todayRes.rows[0].revenue),
        orders: Number(todayRes.rows[0].orders),
      },
      month: {
        revenue: Number(monthRes.rows[0].revenue),
      },
      newCustomers: Number(customerRes.rows[0].count),
      lowStock: Number(stockRes.rows[0].count),
      period: periodStats,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Dữ liệu biểu đồ (SỬA LẠI CÚ PHÁP TIMEZONE)
export const getRevenueChart = async (req, res) => {
  try {
    const { days = 7, startDate, endDate } = req.query;

    let dateFilter = "";
    let params = [];

    if (startDate && endDate) {
      dateFilter = `date_series >= $1 AND date_series <= $2`;
      params = [startDate, endDate];
    } else {
      // Lấy n ngày gần nhất tính đến "Hôm nay VN"
      dateFilter = `date_series >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - interval '${
        Number(days) - 1
      } days'`;
    }

    const query = `
      SELECT
        to_char(date_series, 'DD/MM') as name,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(o.id) as total_orders
      FROM generate_series(
        -- Tạo chuỗi ngày theo giờ VN
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - interval '30 days',
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        '1 day'
      ) as date_series
      LEFT JOIN orders o ON date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_series
        AND o.status = 'completed'
      WHERE ${dateFilter}
      GROUP BY date_series
      ORDER BY date_series ASC
    `;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Top sản phẩm
export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateCondition = "";
    let params = [];

    if (startDate && endDate) {
      dateCondition = `AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1 AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2`;
      params = [startDate, endDate];
    }

    const result = await pool.query(
      `
        SELECT p.id, p.name, p.sku, SUM(oi.quantity) as sold_quantity, SUM(oi.total) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' ${dateCondition}
        GROUP BY p.id, p.name, p.sku
        ORDER BY sold_quantity DESC
        LIMIT 5
    `,
      params
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xuất báo cáo (Cập nhật cú pháp)
export const exportReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const summaryQuery = `
      SELECT COALESCE(SUM(o.total), 0) as total_revenue, COUNT(o.id) as total_orders
      FROM orders o
      WHERE o.status = 'completed'
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
    `;

    const productCountQuery = `
      SELECT COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
    `;

    const dailyQuery = `
      SELECT to_char(date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'DD/MM/YYYY') as date, COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'completed'
        AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
        AND date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
      GROUP BY date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY date(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') DESC
    `;

    const topProdQuery = `
      SELECT p.name as product_name, SUM(oi.quantity) as sold_quantity, SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= $1
        AND date(o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') <= $2
      GROUP BY p.id, p.name
      ORDER BY sold_quantity DESC LIMIT 20
    `;

    const [summaryRes, prodCountRes, dailyRes, topProdRes] = await Promise.all([
      pool.query(summaryQuery, [startDate, endDate]),
      pool.query(productCountQuery, [startDate, endDate]),
      pool.query(dailyQuery, [startDate, endDate]),
      pool.query(topProdQuery, [startDate, endDate]),
    ]);

    // ... (Phần logic tạo CSV giữ nguyên) ...
    // Giữ nguyên phần generate CSV string ở đây
    // ...
    const summary = summaryRes.rows[0];
    const totalRevenue = Number(summary.total_revenue);
    const totalOrders = Number(summary.total_orders);
    const totalSold = Number(prodCountRes.rows[0].total_sold);
    const avgOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    let csv = "\uFEFF";
    csv += `BÁO CÁO CHI TIẾT DOANH THU\n`;
    csv += `Từ ngày,${startDate},Đến ngày,${endDate}\n`;
    csv += `Ngày xuất báo cáo,${new Date().toLocaleString("vi-VN")}\n\n`;
    csv += `TỔNG QUAN\n`;
    csv += `Chỉ số,Giá trị\n`;
    csv += `Tổng doanh thu,${totalRevenue}\n`;
    csv += `Tổng đơn hàng,${totalOrders}\n`;
    csv += `Tổng sản phẩm đã bán,${totalSold}\n`;
    csv += `Giá trị đơn trung bình,${avgOrderValue}\n\n`;
    csv += `DOANH THU THEO NGÀY\n`;
    csv += `Ngày,Doanh thu (VNĐ)\n`;
    dailyRes.rows.forEach((row) => {
      csv += `${row.date},${row.revenue}\n`;
    });
    csv += `\n`;
    csv += `TOP SẢN PHẨM BÁN CHẠY\n`;
    csv += `Tên sản phẩm,Số lượng bán,Doanh thu\n`;
    topProdRes.rows.forEach((row) => {
      const safeName = row.product_name.includes(",")
        ? `"${row.product_name}"`
        : row.product_name;
      csv += `${safeName},${row.sold_quantity},${row.revenue}\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=BaoCao_${startDate}_${endDate}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Lỗi xuất báo cáo" });
  }
};
