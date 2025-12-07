import { pool } from "../config/database.js";

// 1. Lấy thống kê tổng quan (Dashboard Cards)
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // --- A. THỐNG KÊ HÔM NAY (Theo giờ Việt Nam) ---
    const todayQuery = `
      SELECT
        COALESCE(SUM(total), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE
        status = 'completed'
        AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = date(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
    `;
    const todayRes = await pool.query(todayQuery);

    // --- B. THỐNG KÊ THÁNG NÀY ---
    const monthQuery = `
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE
        status = 'completed'
        AND to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') = to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM')
    `;
    const monthRes = await pool.query(monthQuery);

    // --- C. KHÁCH HÀNG MỚI (Trong tháng) ---
    const customerQuery = `
      SELECT COUNT(id) as count
      FROM customers
      WHERE
        to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') = to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM')
    `;
    const customerRes = await pool.query(customerQuery);

    // --- D. CẢNH BÁO TỒN KHO ---
    const stockRes = await pool.query(`
      SELECT COUNT(id) as count FROM products
      WHERE stock_quantity <= COALESCE(min_stock, 10) AND is_active = true
    `);

    // --- E. THỐNG KÊ THEO KHOẢNG THỜI GIAN (Nếu có filter) ---
    let periodStats = { revenue: 0, orders: 0, profit: 0 };
    if (startDate && endDate) {
      const periodQuery = `
            SELECT
                COALESCE(SUM(total), 0) as revenue,
                COUNT(id) as orders,
                COALESCE(SUM(total - (subtotal * 0.7)), 0) as profit
            FROM orders
            WHERE
                status = 'completed'
                AND date(created_at) >= $1
                AND date(created_at) <= $2
        `;
      const periodRes = await pool.query(periodQuery, [startDate, endDate]);
      periodStats = {
        revenue: Number(periodRes.rows[0].revenue),
        orders: Number(periodRes.rows[0].orders),
        profit: Number(periodRes.rows[0].profit),
      };
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

// 2. Dữ liệu biểu đồ (Cập nhật theo khoảng thời gian)
export const getRevenueChart = async (req, res) => {
  try {
    const { days = 7 } = req.query; // Default 7 ngày nếu không có startDate/endDate

    let query = `
      SELECT
        to_char(date_series, 'DD/MM') as name,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(o.id) as total_orders
      FROM generate_series(
        (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - ($1 || ' days')::interval,
        (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        '1 day'
      ) as date_series
      LEFT JOIN orders o ON date(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_series
        AND o.status = 'completed'
      GROUP BY date_series
      ORDER BY date_series ASC
    `;

    const result = await pool.query(query, [Number(days) - 1]); // Trừ 1 để tính cả hôm nay
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Top sản phẩm (Giữ nguyên hoặc cập nhật timezone tương tự)
export const getTopProducts = async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT p.id, p.name, p.sku, SUM(oi.quantity) as sold_quantity, SUM(oi.total) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed'
        GROUP BY p.id, p.name, p.sku
        ORDER BY sold_quantity DESC
        LIMIT 5
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // --- QUERY 1: TỔNG QUAN (OVERVIEW) ---
    // Lấy tổng doanh thu, tổng đơn hàng
    const summaryQuery = `
      SELECT
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(o.id) as total_orders
      FROM orders o
      WHERE o.status = 'completed'
        AND date(o.created_at) >= $1 AND date(o.created_at) <= $2
    `;

    // Lấy tổng số lượng sản phẩm bán ra
    const productCountQuery = `
      SELECT COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND date(o.created_at) >= $1 AND date(o.created_at) <= $2
    `;

    // --- QUERY 2: DOANH THU THEO NGÀY ---
    const dailyQuery = `
      SELECT
        to_char(date(created_at), 'DD/MM/YYYY') as date,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'completed'
        AND date(created_at) >= $1 AND date(created_at) <= $2
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
    `;

    // --- QUERY 3: TOP SẢN PHẨM BÁN CHẠY ---
    const topProdQuery = `
      SELECT
        p.name as product_name,
        SUM(oi.quantity) as sold_quantity,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND date(o.created_at) >= $1 AND date(o.created_at) <= $2
      GROUP BY p.id, p.name
      ORDER BY sold_quantity DESC
      LIMIT 20
    `;

    // Chạy tất cả query song song để tối ưu tốc độ
    const [summaryRes, prodCountRes, dailyRes, topProdRes] = await Promise.all([
      pool.query(summaryQuery, [startDate, endDate]),
      pool.query(productCountQuery, [startDate, endDate]),
      pool.query(dailyQuery, [startDate, endDate]),
      pool.query(topProdQuery, [startDate, endDate]),
    ]);

    // Xử lý số liệu tổng quan
    const summary = summaryRes.rows[0];
    const totalRevenue = Number(summary.total_revenue);
    const totalOrders = Number(summary.total_orders);
    const totalSold = Number(prodCountRes.rows[0].total_sold);
    const avgOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // --- TẠO NỘI DUNG CSV ---
    // \uFEFF là BOM để Excel hiển thị đúng tiếng Việt
    let csv = "\uFEFF";

    // 1. Tiêu đề & Thời gian
    csv += `BÁO CÁO CHI TIẾT DOANH THU\n`;
    csv += `Từ ngày,${startDate},Đến ngày,${endDate}\n`;
    csv += `Ngày xuất báo cáo,${new Date().toLocaleString("vi-VN")}\n\n`;

    // 2. Phần Tổng Quan
    csv += `TỔNG QUAN\n`;
    csv += `Chỉ số,Giá trị\n`;
    csv += `Tổng doanh thu,${totalRevenue}\n`;
    csv += `Tổng đơn hàng,${totalOrders}\n`;
    csv += `Tổng sản phẩm đã bán,${totalSold}\n`;
    csv += `Giá trị đơn trung bình,${avgOrderValue}\n\n`;

    // 3. Phần Doanh Thu Theo Ngày
    csv += `DOANH THU THEO NGÀY\n`;
    csv += `Ngày,Doanh thu (VNĐ)\n`;
    dailyRes.rows.forEach((row) => {
      csv += `${row.date},${row.revenue}\n`;
    });
    csv += `\n`;

    // 4. Phần Top Sản Phẩm
    csv += `TOP SẢN PHẨM BÁN CHẠY\n`;
    csv += `Tên sản phẩm,Số lượng bán,Doanh thu\n`;
    topProdRes.rows.forEach((row) => {
      // Xử lý tên sản phẩm có dấu phẩy để không bị lỗi cột CSV
      const safeName = row.product_name.includes(",")
        ? `"${row.product_name}"`
        : row.product_name;
      csv += `${safeName},${row.sold_quantity},${row.revenue}\n`;
    });

    // Gửi file về client
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=BaoCao_ChiTiet_${startDate}_${endDate}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Detailed Error:", error);
    res
      .status(500)
      .json({ message: "Lỗi xuất báo cáo chi tiết: " + error.message });
  }
};
