import express from "express";
import {
  addSong,
  getSongs,
  streamSong,
  searchSongs,
  searchSongsByGenres,
  updateSong,
  deleteSong,
  getSongById,
} from "../controllers/SongController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { adminMiddleware } from "../middleware/AdminMiddleware.js";
import multer from "multer";
import path from "path";

// Storage media files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
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

router.get("/search", searchSongs);
router.get("/search-by-genres", searchSongsByGenres);
router.get("/:id", getSongById);
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("file"),
  addSong
);
router.get("/", getSongs);
router.get("/stream/:id", streamSong);
router.put("/:id", authMiddleware, adminMiddleware, updateSong);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSong);

export default router;
