import pool from "../configs/Database.js";

export class Playlist {
  static async create(userId, name) {
    const [result] = await pool.query(
      "INSERT INTO playlists (user_id, name) VALUES (?, ?)",
      [userId, name]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      "SELECT id, name, created_at FROM playlists WHERE user_id = ?",
      [userId]
    );
    return rows;
  }

  static async findByIdAndUserId(playlistId, userId) {
    const [rows] = await pool.query(
      "SELECT id, name, created_at FROM playlists WHERE id = ? AND user_id = ?",
      [playlistId, userId]
    );
    return rows[0];
  }

  static async searchByName(query, userId, limit = 10, offset = 0) {
    try {
      const [rows] = await pool.query(
        `
        SELECT id, name, created_at 
        FROM playlists 
        WHERE user_id = ? AND name LIKE ? 
        LIMIT ? OFFSET ?
        `,
        [userId, `%${query}%`, limit, offset]
      );
      return rows;
    } catch (error) {
      console.error("Error searching playlists:", error);
      throw error;
    }
  }

  // Update playlist name
  static async updateName(playlistId, userId, name) {
    try {
      const [result] = await pool.query(
        "UPDATE playlists SET name = ? WHERE id = ? AND user_id = ?",
        [name, playlistId, userId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("Error updating playlist name:", error);
      throw error;
    }
  }
}
