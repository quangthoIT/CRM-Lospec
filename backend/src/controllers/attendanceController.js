import { pool } from "../config/database.js";

// 1. Check-in (Vào ca)
export const checkIn = async (req, res) => {
  const userId = req.user.id;

  try {
    // Kiểm tra xem user có đang trong ca làm việc không (có check_in mà chưa check_out)
    // Lấy bản ghi mới nhất
    const checkQuery = `
      SELECT * FROM staff_attendance
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId]);
    const lastRecord = checkResult.rows[0];

    // Nếu bản ghi cuối cùng là của hôm nay (theo giờ server) và chưa checkout -> Báo lỗi
    // Hoặc đơn giản hơn: Nếu bản ghi cuối cùng chưa có check_out -> Bắt buộc check-out trước
    if (lastRecord && !lastRecord.check_out) {
      return res
        .status(400)
        .json({
          message: "Bạn đang trong ca làm việc! Vui lòng Check-out trước.",
        });
    }

    // Nếu bản ghi cuối cùng đã check-out, hoặc chưa có bản ghi nào, hoặc bản ghi cũ -> Tạo mới
    // Sử dụng CURRENT_DATE của Database để đồng bộ
    const insertQuery = `
      INSERT INTO staff_attendance (user_id, date, check_in, status)
      VALUES ($1, CURRENT_DATE, NOW(), 'present')
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [userId]);

    res
      .status(201)
      .json({ message: "Check-in thành công", data: result.rows[0] });
  } catch (error) {
    // Bắt lỗi duplicate key (nếu lỡ user cố check-in 2 lần trong 1 ngày mà DB unique constraint chặn)
    if (error.code === "23505") {
      return res.status(400).json({ message: "Hôm nay bạn đã chấm công rồi." });
    }
    res.status(500).json({ message: error.message });
  }
};

// 2. Check-out (Ra ca)
export const checkOut = async (req, res) => {
  const userId = req.user.id;

  try {
    // Tìm bản ghi đang mở (chưa check_out) gần nhất của user này
    const checkQuery = `
      SELECT * FROM staff_attendance
      WHERE user_id = $1 AND check_out IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId]);

    if (checkResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy phiên làm việc nào chưa kết thúc!" });
    }

    const attendance = checkResult.rows[0];

    // Tính toán giờ làm việc
    const updateQuery = `
      UPDATE staff_attendance
      SET check_out = NOW(),
          work_hours = ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600 AS NUMERIC), 2)
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [attendance.id]);
    res
      .status(200)
      .json({ message: "Check-out thành công", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lịch sử chấm công cá nhân
export const getMyAttendance = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT * FROM staff_attendance
      WHERE user_id = $1
      ORDER BY date DESC, check_in DESC
      LIMIT 30
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Bảng công toàn bộ
export const getAllAttendance = async (req, res) => {
  try {
    const { date, userId } = req.query;

    let query = `
      SELECT sa.*, u.full_name, u.email
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (date) {
      query += ` AND sa.date = $${idx}`;
      params.push(date);
      idx++;
    }
    if (userId) {
      query += ` AND sa.user_id = $${idx}`;
      params.push(userId);
      idx++;
    }

    query += ` ORDER BY sa.date DESC, sa.check_in DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
