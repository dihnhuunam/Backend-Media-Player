import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/Auth.js";
import songRoutes from "./routes/Song.js";
import playlistRoutes from "./routes/Playlist.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
