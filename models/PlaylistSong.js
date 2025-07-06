import pool from "../configs/Database.js";

export class PlaylistSong {
  // Check if song exists in playlist
  static async isSongInPlaylist(playlistId, songId) {
    const [rows] = await pool.query(
      "SELECT 1 FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
      [playlistId, songId]
    );
    return rows.length > 0;
  }

  // Check if song exists
  static async songExists(songId) {
    const [rows] = await pool.query("SELECT 1 FROM songs WHERE id = ?", [
      songId,
    ]);
    return rows.length > 0;
  }

  // Check if playlist exists
  static async playlistExists(playlistId) {
    const [rows] = await pool.query("SELECT 1 FROM playlists WHERE id = ?", [
      playlistId,
    ]);
    return rows.length > 0;
  }

  // Add to playlist
  static async addSongToPlaylist(playlistId, songId) {
    try {
      // Check if playlist exists
      if (!(await this.playlistExists(playlistId))) {
        throw new Error("Playlist not found");
      }

      // Check if song exists
      if (!(await this.songExists(songId))) {
        throw new Error("Song not found");
      }

      // Check if song is already in playlist
      if (await this.isSongInPlaylist(playlistId, songId)) {
        throw new Error("Song already exists in playlist");
      }

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

  // Remove from playlist
  static async removeSongFromPlaylist(playlistId, songId) {
    try {
      // Check if playlist exists
      if (!(await this.playlistExists(playlistId))) {
        throw new Error("Playlist not found");
      }

      // Check if song exists
      if (!(await this.songExists(songId))) {
        throw new Error("Song not found");
      }

      // Check if song is in playlist
      if (!(await this.isSongInPlaylist(playlistId, songId))) {
        throw new Error("Song not found in playlist");
      }

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

  // Get all songs in playlist
  static async findSongsByPlaylistId(playlistId) {
    try {
      // Check if playlist exists
      if (!(await this.playlistExists(playlistId))) {
        throw new Error("Playlist not found");
      }

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

  // Search songs in a playlist by title or artist
  static async searchSongsInPlaylist(
    playlistId,
    userId,
    query,
    limit = 10,
    offset = 0
  ) {
    try {
      // Check if playlist exists
      if (!(await this.playlistExists(playlistId))) {
        throw new Error("Playlist not found");
      }

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
        JOIN playlists p ON ps.playlist_id = p.id
        LEFT JOIN song_artists sa ON s.id = sa.song_id
        LEFT JOIN artists a ON sa.artist_id = a.id
        WHERE ps.playlist_id = ? AND p.user_id = ? 
        AND (s.title LIKE ? OR a.name LIKE ?)
        GROUP BY s.id, s.title, s.file_path, s.uploaded_at
        LIMIT ? OFFSET ?
        `,
        [playlistId, userId, `%${query}%`, `%${query}%`, limit, offset]
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
      console.error("Error searching songs in playlist:", error);
      throw error;
    }
  }
}
