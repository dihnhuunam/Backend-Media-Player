import pool from "../configs/Database.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class User {
  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.query(
      "SELECT id, email, name, date_of_birth, created_at FROM users"
    );
    return rows;
  }

  static async create(email, password, name, dateOfBirth) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO users (email, password, name, date_of_birth) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, name, dateOfBirth]
    );
    return result.insertId;
  }
}
