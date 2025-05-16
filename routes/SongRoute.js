import express from "express";
import {
  addSong,
  getSongs,
  streamSong,
  searchSongs,
  searchSongsByGenres,
  updateSong,
  deleteSong,
} from "../controllers/SongController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { adminMiddleware } from "../middleware/AdminMiddleware.js";
import multer from "multer";
import path from "path";

// Cấu hình multer để lưu file nhạc
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Sửa từ "Uploads/" thành "uploads/"
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".mp3", ".wav", ".m4a"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only mp3, wav, and m4a files are allowed"));
    }
  },
});

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  addSong
);
router.get("/", getSongs);
router.get("/stream/:id", streamSong);
router.get("/search", searchSongs);
router.get("/search-by-genres", searchSongsByGenres);
router.put("/:id", authMiddleware, adminMiddleware, updateSong);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSong);

export default router;
