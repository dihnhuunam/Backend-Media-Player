import express from "express";
import { register, login, getUsers } from "../controllers/AuthController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, getUsers);

export default router;
