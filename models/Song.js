import pool from "../configs/Database.js";

export class Song {
  static async create(title, artist, filePath, genres) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert song
      const [result] = await connection.query(
        "INSERT INTO songs (title, artist, file_path) VALUES (?, ?, ?)",
        [title, artist, filePath]
      );
      const songId = result.insertId;

      // Insert genres if provided
      if (genres && genres.length > 0) {
        for (const genreName of genres) {
          // Insert or get genre ID
          let [genreResult] = await connection.query(
            "INSERT INTO genres (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
            [genreName]
          );
          const genreId =
            genreResult.insertId ||
            (
              await connection.query("SELECT id FROM genres WHERE name = ?", [
                genreName,
              ])
            )[0][0].id;

          // Link song to genre
          await connection.query(
            "INSERT INTO song_genres (song_id, genre_id) VALUES (?, ?)",
            [songId, genreId]
          );
        }
      }

      await connection.commit();
      return songId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll() {
    const [rows] = await pool.query(`
      SELECT s.id, s.title, s.artist, s.file_path, s.uploaded_at,
             GROUP_CONCAT(g.name) AS genres
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      GROUP BY s.id
    `);
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? row.genres.split(",") : [],
    }));
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.artist, s.file_path, s.uploaded_at,
             GROUP_CONCAT(g.name) AS genres
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE s.id = ?
      GROUP BY s.id
    `,
      [id]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      genres: rows[0].genres ? rows[0].genres.split(",") : [],
    };
  }

  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.artist, s.file_path, s.uploaded_at,
             GROUP_CONCAT(g.name) AS genres
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE s.title LIKE ? OR s.artist LIKE ?
      GROUP BY s.id
    `,
      [searchTerm, searchTerm]
    );
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? row.genres.split(",") : [],
    }));
  }

  static async searchByGenres(genres) {
    const genreArray = Array.isArray(genres)
      ? genres
      : genres.split(",").map((g) => g.trim());
    const placeholders = genreArray.map(() => "?").join(",");
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.artist, s.file_path, s.uploaded_at,
             GROUP_CONCAT(g2.name) AS genres
      FROM songs s
      JOIN song_genres sg ON s.id = sg.song_id
      JOIN genres g ON sg.genre_id = g.id
      LEFT JOIN song_genres sg2 ON s.id = sg2.song_id
      LEFT JOIN genres g2 ON sg2.genre_id = g2.id
      WHERE g.name IN (${placeholders})
      GROUP BY s.id
    `,
      genreArray
    );
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? row.genres.split(",") : [],
    }));
  }
}
