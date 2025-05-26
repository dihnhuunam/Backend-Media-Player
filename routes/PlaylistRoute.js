import express from "express";
import {
  createPlaylist,
  getUserPlaylists,
  addSongToPlaylist,
  getPlaylistSongs,
  removeSongFromPlaylist,
  deletePlaylist,
  searchPlaylists,
  searchSongsInPlaylist,
} from "../controllers/PlaylistController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPlaylist);
router.get("/", authMiddleware, getUserPlaylists);
router.get("/search", authMiddleware, searchPlaylists);
router.post("/songs", authMiddleware, addSongToPlaylist);
router.get("/:playlistId/songs", authMiddleware, getPlaylistSongs);
router.get("/:playlistId/songs/search", authMiddleware, searchSongsInPlaylist);
router.delete("/songs", authMiddleware, removeSongFromPlaylist);
router.delete("/:playlistId", authMiddleware, deletePlaylist);

export default router;
