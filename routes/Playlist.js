import express from "express";
import {
  createPlaylist,
  getUserPlaylists,
  addSongToPlaylist,
  getPlaylistSongs,
} from "../controllers/PlaylistController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPlaylist);
router.get("/", authMiddleware, getUserPlaylists);
router.post("/songs", authMiddleware, addSongToPlaylist);
router.get("/:playlistId/songs", authMiddleware, getPlaylistSongs);

export default router;
