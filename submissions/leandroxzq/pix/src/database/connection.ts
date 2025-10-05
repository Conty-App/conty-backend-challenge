import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

pool
  .query("SELECT NOW()")
  .then((res) => console.log("Connected to PostgreSQL:", res.rows[0]))
  .catch((err) => console.error("error:", err));
