import express from "express";
import {
  register,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/AuthController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { adminMiddleware } from "../middleware/AdminMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, getUsers);
router.get("/users/:id", authMiddleware, getUserById);
router.put("/users/:id", authMiddleware, updateUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUser);

export default router;
