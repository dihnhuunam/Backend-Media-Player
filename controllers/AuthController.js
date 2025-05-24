import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Register
export async function register(req, res) {
  const { email, password, name, dateOfBirth } = req.body;

  if (!email || !password || !name || !dateOfBirth) {
    return res.status(400).json({
      message: "Email, password, name, and date of birth are required",
    });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create new user
    await User.create(email, password, name, dateOfBirth);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Login
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user info and token
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        name: user.name,
        dateOfBirth: user.date_of_birth,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all users
export async function getUsers(req, res) {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get user by ID
export async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update user
export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, dateOfBirth, password } = req.body;

  // Check if at least one field is provided
  if (!name && !dateOfBirth && !password) {
    return res
      .status(400)
      .json({
        message:
          "At least one field (name, dateOfBirth, password) must be provided",
      });
  }

  // Check if user is authorized (own account or admin)
  if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
    return res
      .status(403)
      .json({
        message:
          "Unauthorized: You can only update your own account or must be an admin",
      });
  }

  try {
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update fields
    const updates = {};
    if (name) updates.name = name;
    if (dateOfBirth) updates.date_of_birth = dateOfBirth;
    if (password) updates.password = await bcrypt.hash(password, 10);

    // Update user in database
    await User.update(id, updates);

    // Fetch updated user
    const updatedUser = await User.findById(id);
    res.status(200).json({
      message: "User updated successfully",
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        dateOfBirth: updatedUser.date_of_birth,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
