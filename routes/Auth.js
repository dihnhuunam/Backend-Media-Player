import express from "express";
import {
  register,
  login,
  getUsers,
  getUserById,
} from "../controllers/AuthController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);

export default router;
