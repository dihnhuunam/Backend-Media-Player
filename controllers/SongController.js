import { Song } from "../models/Song.js";
import fs from "fs";
import path from "path";
import pool from "../configs/Database.js";

// Add a new song (admin only)
export async function addSong(req, res) {
  const { title, genres, artists } = req.body;
  const file = req.file;

  if (!title || !file) {
    return res.status(400).json({ message: "Title and file are required" });
  }

  // Check file size (limit to 100MB)
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxFileSize) {
    fs.unlink(path.join(process.cwd(), `/uploads/${file.filename}`), (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    return res.status(400).json({ message: "File size exceeds 100MB limit" });
  }

  // Check file's format
  const allowedExtensions = [".mp3", ".wav", ".m4a"];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    fs.unlink(path.join(process.cwd(), `/uploads/${file.filename}`), (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    return res
      .status(400)
      .json({ message: "Only mp3, wav, and m4a files are allowed" });
  }

  try {
    // Check if file is accessible
    const filePath = `/uploads/${file.filename}`;
    if (!fs.existsSync(path.join(process.cwd(), filePath))) {
      throw new Error("Uploaded file is not accessible");
    }

    // Handle genres
    let genresArray = [];
    if (genres) {
      if (typeof genres === "string") {
        try {
          genresArray = JSON.parse(genres);
          if (!Array.isArray(genresArray)) {
            genresArray = [genres];
          }
        } catch (e) {
          genresArray = [genres];
        }
      } else if (Array.isArray(genres)) {
        genresArray = genres;
      }
    }

    // Handle artists
    let artistsArray = [];
    if (artists) {
      if (typeof artists === "string") {
        try {
          artistsArray = JSON.parse(artists);
          if (!Array.isArray(artistsArray)) {
            artistsArray = [artists];
          }
        } catch (e) {
          artistsArray = [artists];
        }
      } else if (Array.isArray(artists)) {
        artistsArray = artists;
      }
    }

    const songId = await Song.create(
      title,
      filePath,
      genresArray,
      artistsArray
    );
    res.status(201).json({ message: "Song added successfully", songId });
  } catch (error) {
    console.error("Error adding song:", error);
    // Delete error file
    if (file) {
      const deletePath = path.join(process.cwd(), `/uploads/${file.filename}`);
      fs.unlink(deletePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    if (
      error.message === "Song title already exists" ||
      error.message === "Name must be a non-empty string" ||
      error.message === "Name contains invalid characters" ||
      error.message === "At least one valid genre is required" ||
      error.message === "At least one valid artist is required" ||
      error.message === "Uploaded file is not accessible"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get song by ID
export async function getSongById(req, res) {
  const { id } = req.params;

  try {
    const song = await Song.findById(id);
    res.status(200).json(song);
  } catch (error) {
    console.error("Error fetching song by ID:", error);
    if (error.message === "Song not found") {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all songs
export async function getSongs(req, res) {
  try {
    const songs = await Song.findAll();
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Stream a song with HTTP Range support
export async function streamSong(req, res) {
  const { id } = req.params;

  try {
    const song = await Song.findById(id);
    const filePath = path.join(process.cwd(), song.file_path);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found or inaccessible");
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Setup MIME type
    const mimeType =
      {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
      }[path.extname(filePath).toLowerCase()] || "audio/mpeg";

    if (range) {
      // Handle Range request
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Check Range
      if (start >= fileSize || end >= fileSize || start > end) {
        return res
          .status(416)
          .json({ message: "Requested range not satisfiable" });
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Return total file if Range header does not exist
      const head = {
        "Content-Length": fileSize,
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error("Error streaming song:", error);
    if (
      error.message === "Song not found" ||
      error.message === "File not found or inaccessible"
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Search songs by title or artist
export async function searchSongs(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const songs = await Song.search(q);
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error searching songs:", error);
    if (error.message === "No songs found") {
      return res.status(404).json({ message: "No songs found" });
    }
    if (error.message === "Search query must be a non-empty string") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Search songs by genres
export async function searchSongsByGenres(req, res) {
  const { genres } = req.query;

  if (!genres) {
    return res.status(400).json({ message: "Genres query is required" });
  }

  try {
    const songs = await Song.searchByGenres(genres);
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error searching songs by genres:", error);
    if (
      error.message === "No songs found for the given genres" ||
      error.message === "At least one valid genre is required" ||
      error.message === "Name contains invalid characters"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update song information (admin only)
export async function updateSong(req, res) {
  const { id } = req.params;
  const { title, genres, artists } = req.body;

  if (!title && !genres && !artists) {
    return res.status(400).json({
      message: "At least one field (title, genres, or artists) is required",
    });
  }

  try {
    const song = await Song.findById(id);

    // Check for duplicate title (if provided)
    if (title && (await Song.isTitleExists(title, id))) {
      return res.status(409).json({ message: "Song title already exists" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update title if provided
      if (title) {
        await connection.query("UPDATE songs SET title = ? WHERE id = ?", [
          title,
          id,
        ]);
      }

      // Update genres if provided
      if (genres) {
        let genresArray = [];
        if (typeof genres === "string") {
          try {
            genresArray = JSON.parse(genres);
            if (!Array.isArray(genresArray)) genresArray = [genres];
          } catch (e) {
            genresArray = [genres];
          }
        } else if (Array.isArray(genres)) {
          genresArray = genres;
        }

        // Validate genres
        if (genresArray.length === 0) {
          throw new Error("At least one valid genre is required");
        }
        for (const genre of genresArray) {
          Song.validateName(genre);
        }

        // Delete existing genres
        await connection.query("DELETE FROM song_genres WHERE song_id = ?", [
          id,
        ]);

        // Insert new genres
        const uniqueGenres = [...new Set(genresArray)];
        for (const genreName of uniqueGenres) {
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

          await connection.query(
            "INSERT INTO song_genres (song_id, genre_id) VALUES (?, ?)",
            [id, genreId]
          );
        }
      }

      // Update artists if provided
      if (artists) {
        let artistsArray = [];
        if (typeof artists === "string") {
          try {
            artistsArray = JSON.parse(artists);
            if (!Array.isArray(artistsArray)) artistsArray = [artists];
          } catch (e) {
            artistsArray = [artists];
          }
        } else if (Array.isArray(artists)) {
          artistsArray = artists;
        }

        // Validate artists
        if (artistsArray.length === 0) {
          throw new Error("At least one valid artist is required");
        }
        for (const artist of artistsArray) {
          Song.validateName(artist);
        }

        // Delete existing artists
        await connection.query("DELETE FROM song_artists WHERE song_id = ?", [
          id,
        ]);

        // Insert new artists
        const uniqueArtists = [...new Set(artistsArray)];
        for (const artistName of uniqueArtists) {
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

          await connection.query(
            "INSERT INTO song_artists (song_id, artist_id) VALUES (?, ?)",
            [id, artistId]
          );
        }
      }

      await connection.commit();
      res.status(200).json({ message: "Song updated successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating song:", error);
    if (
      error.message === "Song not found" ||
      error.message === "Song title already exists" ||
      error.message === "At least one valid genre is required" ||
      error.message === "At least one valid artist is required" ||
      error.message === "Name contains invalid characters"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete a song (admin only)
export async function deleteSong(req, res) {
  const { id } = req.params;

  try {
    const song = await Song.findById(id);

    // Delete song (cascades to song_genres, song_artists, playlist_songs)
    await pool.query("DELETE FROM songs WHERE id = ?", [id]);

    // Delete physical file
    const filePath = path.join(process.cwd(), song.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error deleting song:", error);
    if (error.message === "Song not found") {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
