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

// Search playlists by name
export async function searchPlaylists(req, res) {
  const { q } = req.query;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  if (!q) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }

  try {
    const playlists = await Playlist.searchByName(q, userId, limit, offset);
    res.status(200).json(playlists);
  } catch (error) {
    console.error("Error searching playlists:", error);
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
    if (error.message === "Playlist not found") {
      return res.status(404).json({ message: "Playlist not found" });
    }
    if (error.message === "Song not found") {
      return res.status(404).json({ message: "Song not found" });
    }
    if (error.message === "Song already exists in playlist") {
      return res
        .status(409)
        .json({ message: "Song already exists in playlist" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all songs in a playlist
export async function getPlaylistSongs(req, res) {
  const { playlistId } = req.params;
  const userId = req.user.id;

  try {
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
    if (error.message === "Playlist not found") {
      return res.status(404).json({ message: "Playlist not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Search songs in a playlist by title or artist
export async function searchSongsInPlaylist(req, res) {
  const { playlistId } = req.params;
  const { q } = req.query;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  if (!q) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }

  if (!playlistId) {
    return res.status(400).json({ message: "Playlist ID is required" });
  }

  try {
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    const songs = await PlaylistSong.searchSongsInPlaylist(
      playlistId,
      userId,
      q,
      limit,
      offset
    );
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error searching songs in playlist:", error);
    if (error.message === "Playlist not found") {
      return res.status(404).json({ message: "Playlist not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update playlist name
export async function updatePlaylistName(req, res) {
  const { playlistId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Playlist name is required" });
  }

  if (!playlistId) {
    return res.status(400).json({ message: "Playlist ID is required" });
  }

  try {
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    const affectedRows = await Playlist.updateName(playlistId, userId, name);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({ message: "Playlist name updated successfully" });
  } catch (error) {
    console.error("Error updating playlist name:", error);
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
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    const affectedRows = await PlaylistSong.removeSongFromPlaylist(
      playlistId,
      songId
    );
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Song not found in playlist" });
    }

    res
      .status(200)
      .json({ message: "Song removed from playlist successfully" });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    if (error.message === "Playlist not found") {
      return res.status(404).json({ message: "Playlist not found" });
    }
    if (error.message === "Song not found") {
      return res.status(404).json({ message: "Song not found" });
    }
    if (error.message === "Song not found in playlist") {
      return res.status(404).json({ message: "Song not found in playlist" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete a playlist
export async function deletePlaylist(req, res) {
  const { playlistId } = req.params;
  const userId = req.user.id;

  if (!playlistId) {
    return res.status(400).json({ message: "Playlist ID is required" });
  }

  try {
    const playlist = await Playlist.findByIdAndUserId(playlistId, userId);
    if (!playlist) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Playlist does not belong to user" });
    }

    await pool.query("DELETE FROM playlist_songs WHERE playlist_id = ?", [
      playlistId,
    ]);

    const [result] = await pool.query("DELETE FROM playlists WHERE id = ?", [
      playlistId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
