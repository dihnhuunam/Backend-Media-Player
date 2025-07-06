import pool from "../configs/Database.js";

export class Song {
  // Check if song title exists
  static async isTitleExists(title, excludeId = null) {
    const query = excludeId
      ? "SELECT 1 FROM songs WHERE title = ? AND id != ?"
      : "SELECT 1 FROM songs WHERE title = ?";
    const params = excludeId ? [title, excludeId] : [title];
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  // Validate genre and artist names
  static validateName(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Name must be a non-empty string");
    }
    // Allow alphanumeric, spaces, and common punctuation
    const validNamePattern = /^[a-zA-Z0-9\s\-',.]+$/;
    if (!validNamePattern.test(name)) {
      throw new Error("Name contains invalid characters");
    }
  }

  static async create(title, filePath, genres, artists) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check for duplicate title
      if (await this.isTitleExists(title)) {
        throw new Error("Song title already exists");
      }

      // Validate title
      this.validateName(title);

      // Insert song
      const [result] = await connection.query(
        "INSERT INTO songs (title, file_path) VALUES (?, ?)",
        [title, filePath]
      );
      const songId = result.insertId;

      // Insert genres if provided
      if (genres && genres.length > 0) {
        const uniqueGenres = [...new Set(genres)];
        if (uniqueGenres.length === 0) {
          throw new Error("At least one valid genre is required");
        }
        for (const genreName of uniqueGenres) {
          this.validateName(genreName);
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
            "INSERT IGNORE INTO song_genres (song_id, genre_id) VALUES (?, ?)",
            [songId, genreId]
          );
        }
      }

      // Insert artists if provided
      if (artists && artists.length > 0) {
        const uniqueArtists = [...new Set(artists)];
        if (uniqueArtists.length === 0) {
          throw new Error("At least one valid artist is required");
        }
        for (const artistName of uniqueArtists) {
          this.validateName(artistName);
          // Insert or get artist ID
          let [artistResult] = await connection.query(
            "INSERT INTO artists (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
            [artistName]
          );
          const artistId =
            artistResult.insertId ||
            (
              await connection.query("SELECT id FROM artists WHERE name = ?", [
                artistName,
              ])
            )[0][0].id;

          // Link song to artist
          await connection.query(
            "INSERT IGNORE INTO song_artists (song_id, artist_id) VALUES (?, ?)",
            [songId, artistId]
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
      SELECT s.id, s.title, s.file_path, s.uploaded_at,
             GROUP_CONCAT(DISTINCT g.name) AS genres,
             GROUP_CONCAT(DISTINCT a.name) AS artists
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      LEFT JOIN song_artists sa ON s.id = sa.song_id
      LEFT JOIN artists a ON sa.artist_id = a.id
      GROUP BY s.id
    `);
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? [...new Set(row.genres.split(","))] : [],
      artists: row.artists ? [...new Set(row.artists.split(","))] : [],
    }));
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.file_path, s.uploaded_at,
             GROUP_CONCAT(DISTINCT g.name) AS genres,
             GROUP_CONCAT(DISTINCT a.name) AS artists
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      LEFT JOIN song_artists sa ON s.id = sa.song_id
      LEFT JOIN artists a ON sa.artist_id = a.id
      WHERE s.id = ?
      GROUP BY s.id
    `,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Song not found");
    }
    return {
      ...rows[0],
      genres: rows[0].genres ? [...new Set(rows[0].genres.split(","))] : [],
      artists: rows[0].artists ? [...new Set(rows[0].artists.split(","))] : [],
    };
  }

  static async search(query) {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Search query must be a non-empty string");
    }
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.file_path, s.uploaded_at,
             GROUP_CONCAT(DISTINCT g.name) AS genres,
             GROUP_CONCAT(DISTINCT a.name) AS artists
      FROM songs s
      LEFT JOIN song_genres sg ON s.id = sg.song_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      LEFT JOIN song_artists sa ON s.id = sa.song_id
      LEFT JOIN artists a ON sa.artist_id = a.id
      WHERE s.title LIKE ? OR a.name LIKE ?
      GROUP BY s.id
    `,
      [searchTerm, searchTerm]
    );
    if (rows.length === 0) {
      throw new Error("No songs found");
    }
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? [...new Set(row.genres.split(","))] : [],
      artists: row.artists ? [...new Set(row.artists.split(","))] : [],
    }));
  }

  static async searchByGenres(genres) {
    if (!genres || (Array.isArray(genres) && genres.length === 0)) {
      throw new Error("At least one genre is required");
    }
    const genreArray = Array.isArray(genres)
      ? genres
      : genres.split(",").map((g) => g.trim());
    if (genreArray.length === 0) {
      throw new Error("At least one valid genre is required");
    }
    for (const genre of genreArray) {
      this.validateName(genre);
    }
    const placeholders = genreArray.map(() => "?").join(",");
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.file_path, s.uploaded_at,
             GROUP_CONCAT(DISTINCT g2.name) AS genres,
             GROUP_CONCAT(DISTINCT a.name) AS artists
      FROM songs s
      JOIN song_genres sg ON s.id = sg.song_id
      JOIN genres g ON sg.genre_id = g.id
      LEFT JOIN song_genres sg2 ON s.id = sg2.song_id
      LEFT JOIN genres g2 ON sg2.genre_id = g2.id
      LEFT JOIN song_artists sa ON s.id = sa.song_id
      LEFT JOIN artists a ON sa.artist_id = a.id
      WHERE g.name IN (${placeholders})
      GROUP BY s.id
    `,
      genreArray
    );
    if (rows.length === 0) {
      throw new Error("No songs found for the given genres");
    }
    return rows.map((row) => ({
      ...row,
      genres: row.genres ? [...new Set(row.genres.split(","))] : [],
      artists: row.artists ? [...new Set(row.artists.split(","))] : [],
    }));
  }
}
