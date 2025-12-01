import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Lỗi kết nối PostgreSQL:", err.stack);
  }
  console.log("Đã kết nối thành công tới PostgreSQL!");
  release();
});

export const query = (text, params) => pool.query(text, params);

export default pool;
