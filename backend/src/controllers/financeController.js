import { pool } from "../config/database.js";

// Lấy danh sách chi phí
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    let query = `
      SELECT e.*, u.full_name as created_by
      FROM expenses e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (startDate) {
      query += ` AND e.expense_date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.expense_date <= $${idx++}`;
      params.push(endDate);
    }
    if (category && category !== "all") {
      query += ` AND e.category = $${idx++}`;
      params.push(category);
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Expenses Error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách chi phí." });
  }
};

// Tạo khoản chi mới
export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, payment_method, expense_date, notes } =
      req.body;
    const userId = req.user.id;

    // Validate category
    const validCategories = [
      "operating",
      "salary",
      "rent",
      "marketing",
      "equipment",
      "import",
      "other",
      "utilities",
    ];
    const finalCategory = validCategories.includes(category)
      ? category
      : "other";

    const query = `
      INSERT INTO expenses (title, amount, category, payment_method, expense_date, notes, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      amount,
      finalCategory,
      payment_method || "cash",
      expense_date || new Date(),
      notes,
      userId,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create Expense Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ CẬP NHẬT: Sửa khoản chi (MỚI THÊM)
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, payment_method, expense_date, notes } =
      req.body;

    // Validate category
    const validCategories = [
      "operating",
      "salary",
      "rent",
      "marketing",
      "equipment",
      "import",
      "other",
      "utilities",
    ];
    const finalCategory = validCategories.includes(category)
      ? category
      : "other";

    const query = `
      UPDATE expenses
      SET title = $1,
          amount = $2,
          category = $3,
          payment_method = $4,
          expense_date = $5,
          notes = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      amount,
      finalCategory,
      payment_method,
      expense_date,
      notes,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Khoản chi không tồn tại" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa khoản chi
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Khoản chi không tồn tại" });
    }
    res.status(200).json({ message: "Đã xóa khoản chi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (Các hàm Report giữ nguyên)
export const getFinanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // A. Tổng Doanh Thu (Revenue) - Từ bảng Orders
    const revenueQuery = `
      SELECT SUM(total) as total_revenue
      FROM orders
      WHERE status = 'completed'
      AND date(created_at) >= $1 AND date(created_at) <= $2
    `;

    // B. Tổng Chi Phí Vận Hành (Operating Expenses) - Từ bảng Expenses
    const expenseQuery = `
      SELECT SUM(amount) as total_expense
      FROM expenses
      WHERE expense_date >= $1 AND expense_date <= $2
    `;

    // C. Ước tính Giá Vốn Hàng Bán (COGS)
    const cogsQuery = `
      SELECT SUM(oi.quantity * p.cost) as total_cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'completed'
      AND date(o.created_at) >= $1 AND date(o.created_at) <= $2
    `;

    const [revenueRes, expenseRes, cogsRes] = await Promise.all([
      pool.query(revenueQuery, [startDate, endDate]),
      pool.query(expenseQuery, [startDate, endDate]),
      pool.query(cogsQuery, [startDate, endDate]),
    ]);

    const revenue = Number(revenueRes.rows[0].total_revenue || 0);
    const operatingExpense = Number(expenseRes.rows[0].total_expense || 0);
    const cogs = Number(cogsRes.rows[0].total_cogs || 0);

    const grossProfit = revenue - cogs; // Lợi nhuận gộp
    const netProfit = revenue - cogs - operatingExpense; // Lợi nhuận ròng

    res.status(200).json({
      revenue,
      operatingExpense,
      cogs,
      grossProfit,
      netProfit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getCashFlowChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT
        to_char(date_series, 'DD/MM') as date,
        COALESCE(income.total, 0) as income,
        COALESCE(expense.total, 0) as expense,
        (COALESCE(income.total, 0) - COALESCE(expense.total, 0)) as net
      FROM generate_series($1::date, $2::date, '1 day') as date_series
      LEFT JOIN (
        SELECT date(created_at) as d, SUM(total) as total
        FROM orders WHERE status = 'completed'
        GROUP BY 1
      ) income ON date_series = income.d
      LEFT JOIN (
        SELECT expense_date as d, SUM(amount) as total
        FROM expenses
        GROUP BY 1
      ) expense ON date_series = expense.d
      ORDER BY date_series
    `;

    const result = await pool.query(query, [startDate, endDate]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
