import express from "express";
import {
  register,
  login,
  getUsers,
  getUserById,
  updateUser,
} from "../controllers/AuthController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, getUsers);
router.get("/users/:id", authMiddleware, getUserById);
router.put("/users/:id", authMiddleware, updateUser);

export default router;