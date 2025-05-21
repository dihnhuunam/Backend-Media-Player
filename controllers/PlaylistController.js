import { Playlist } from "../models/Playlist.js";
import { PlaylistSong } from "../models/PlaylistSong.js";
import pool from "../configs/Database.js";

// Create a new playlist
export async function createPlaylist(req, res) {
  const { name } = req.body;
  const userId = req.user.id; 

  if (!name) {
    return res.status(400).json({ message: "Playlist name is required" });
  }

  try {
    const playlistId = await Playlist.create(userId, name);
    res
      .status(201)
      .json({ message: "Playlist created successfully", playlistId });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all playlists of the logged-in user
export async function getUserPlaylists(req, res) {
  const userId = req.user.id; 

  try {
    const playlists = await Playlist.findByUserId(userId);
    res.status(200).json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Add a song to a playlist
export async function addSongToPlaylist(req, res) {
  const { playlistId, songId } = req.body;
  const userId = req.user.id; 

  if (!playlistId || !songId) {
    return res
      .status(400)
      .json({ message: "Playlist ID and song ID are required" });
  }

  try {
    // Check if playlist belongs to user
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    await PlaylistSong.addSongToPlaylist(playlistId, songId);
    res.status(200).json({ message: "Song added to playlist successfully" });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all songs in a playlist
export async function getPlaylistSongs(req, res) {
  const { playlistId } = req.params;
  const userId = req.user.id; 

  try {
    // Check if playlist belongs to user
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    const songs = await PlaylistSong.findSongsByPlaylistId(playlistId);
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Remove a song from a playlist
export async function removeSongFromPlaylist(req, res) {
  const { playlistId, songId } = req.body;
  const userId = req.user.id; 

  if (!playlistId || !songId) {
    return res
      .status(400)
      .json({ message: "Playlist ID and song ID are required" });
  }

  try {
    // Check if playlist belongs to user
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    // Remove song from playlist
    const [result] = await pool.query(
      "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
      [playlistId, songId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Song not found in playlist" });
    }

    res
      .status(200)
      .json({ message: "Song removed from playlist successfully" });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
