import express from "express";
import dotenv from "dotenv/config";
import { pool } from "./database/connection.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ message: "Hello, World!", db_time: result.rows[0].now });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
