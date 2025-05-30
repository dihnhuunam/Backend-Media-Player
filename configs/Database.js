import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database");
    return connection;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

export default pool;
