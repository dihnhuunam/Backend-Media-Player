import { Song } from "../models/Song.js";
import fs from "fs";
import path from "path";

// Add a new song (admin only)
export async function addSong(req, res) {
  const { title, artist } = req.body;
  const file = req.file;

  if (!title || !artist || !file) {
    return res
      .status(400)
      .json({ message: "Title, artist, and file are required" });
  }

  // Kiểm tra định dạng file
  const allowedExtensions = [".mp3", ".wav", ".m4a"];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return res
      .status(400)
      .json({ message: "Only mp3, wav, and m4a files are allowed" });
  }

  try {
    const filePath = `/uploads/${file.filename}`;
    const songId = await Song.create(title, artist, filePath);
    res.status(201).json({ message: "Song added successfully", songId });
  } catch (error) {
    console.error("Error adding song:", error);
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
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const filePath = path.join(process.cwd(), song.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Thiết lập MIME type dựa trên đuôi file
    const mimeType =
      {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
      }[path.extname(filePath).toLowerCase()] || "audio/mpeg";

    if (range) {
      // Xử lý Range request
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Kiểm tra range hợp lệ
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
      // Trả về toàn bộ file nếu không có Range header
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
    res.status(500).json({ message: "Internal server error" });
  }
}
