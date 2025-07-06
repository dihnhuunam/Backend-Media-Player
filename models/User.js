import pool from "../configs/Database.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class User {
  // Validate email format
  static validateEmail(email) {
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw new Error("Email must be a non-empty string");
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error("Invalid email format");
    }
  }

  // Validate password strength
  static validatePassword(password) {
    if (!password || typeof password !== "string" || password.length < 4) {
      throw new Error("Password must be at least 4 characters long");
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordPattern.test(password)) {
      throw new Error(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }
  }

  static async findByEmail(email) {
    this.validateEmail(email);
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      throw new Error("User not found");
    }
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, email, name, date_of_birth, created_at FROM users WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      throw new Error("User not found");
    }
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.query(
      "SELECT id, email, name, date_of_birth, role, created_at FROM users"
    );
    return rows;
  }

  static async searchByName(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Search name must be a non-empty string");
    }
    const [rows] = await pool.query(
      "SELECT id, email, name, date_of_birth, role, created_at FROM users WHERE name LIKE ?",
      [`%${name}%`]
    );
    if (rows.length === 0) {
      throw new Error("No users found");
    }
    return rows;
  }

  static async create(email, password, name, dateOfBirth, role = "user") {
    this.validateEmail(email);
    this.validatePassword(password);
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Name must be a non-empty string");
    }
    if (!["user", "admin"].includes(role)) {
      throw new Error("Invalid role");
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO users (email, password, name, date_of_birth, role) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, name, dateOfBirth, role]
    );
    return result.insertId;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name) {
      if (typeof updates.name !== "string" || updates.name.trim() === "") {
        throw new Error("Name must be a non-empty string");
      }
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.date_of_birth) {
      fields.push("date_of_birth = ?");
      values.push(updates.date_of_birth);
    }
    if (updates.password) {
      this.validatePassword(updates.password);
      const hashedPassword = await bcrypt.hash(updates.password, SALT_ROUNDS);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) {
      throw new Error("User not found or no changes made");
    }
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      throw new Error("User not found");
    }
    return result.affectedRows;
  }
}
