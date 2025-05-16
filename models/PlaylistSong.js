import pool from "../configs/Database.js";

export class PlaylistSong {
  // Thêm bài hát vào danh sách phát
  static async addSongToPlaylist(playlistId, songId) {
    try {
      const [result] = await pool.query(
        "INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)",
        [playlistId, songId]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      throw error;
    }
  }

  // Xóa bài hát khỏi danh sách phát
  static async removeSongFromPlaylist(playlistId, songId) {
    try {
      const [result] = await pool.query(
        "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
        [playlistId, songId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      throw error;
    }
  }

  // Lấy danh sách bài hát trong danh sách phát
  static async findSongsByPlaylistId(playlistId) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          s.id, 
          s.title, 
          s.file_path, 
          s.uploaded_at,
          GROUP_CONCAT(a.name) AS artists
        FROM songs s
        JOIN playlist_songs ps ON s.id = ps.song_id
        LEFT JOIN song_artists sa ON s.id = sa.song_id
        LEFT JOIN artists a ON sa.artist_id = a.id
        WHERE ps.playlist_id = ?
        GROUP BY s.id, s.title, s.file_path, s.uploaded_at
        `,
        [playlistId]
      );
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        artists: row.artists
          ? JSON.parse(
              `[${row.artists
                .split(",")
                .map((name) => `"${name}"`)
                .join(",")}]`
            )
          : [],
        file_path: row.file_path,
        uploaded_at: row.uploaded_at,
      }));
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      throw error;
    }
  }
}
