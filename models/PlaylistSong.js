import pool from "../configs/Database.js";

export class PlaylistSong {
  static async addSong(playlistId, songId) {
    const [result] = await pool.query(
      "INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)",
      [playlistId, songId]
    );
    return result.affectedRows;
  }

  static async findSongsByPlaylistId(playlistId) {
    const [rows] = await pool.query(
      "SELECT s.id, s.title, s.artist, s.file_path, s.uploaded_at " +
        "FROM songs s JOIN playlist_songs ps ON s.id = ps.song_id " +
        "WHERE ps.playlist_id = ?",
      [playlistId]
    );
    return rows;
  }
}
