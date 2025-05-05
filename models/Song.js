import pool from "../configs/Database.js";

export class Song {
  static async create(title, artist, filePath) {
    const [result] = await pool.query(
      "INSERT INTO songs (title, artist, file_path) VALUES (?, ?, ?)",
      [title, artist, filePath]
    );
    return result.insertId;
  }

  static async findAll() {
    const [rows] = await pool.query(
      "SELECT id, title, artist, file_path, uploaded_at FROM songs"
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, title, artist, file_path, uploaded_at FROM songs WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      "SELECT id, title, artist, file_path, uploaded_at FROM songs WHERE title LIKE ? OR artist LIKE ?",
      [searchTerm, searchTerm]
    );
    return rows;
  }
}
