import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import moment from "moment";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Validate date of birth (must be at least 13 years old)
const validateDateOfBirth = (dateOfBirth) => {
  if (!moment(dateOfBirth, moment.ISO_8601, true).isValid()) {
    throw new Error("Invalid dateOfBirth format");
  }
  const dob = moment(dateOfBirth);
  const age = moment().diff(dob, "years");
  if (age < 13) {
    throw new Error("User must be at least 13 years old");
  }
  return dob.format("YYYY-MM-DD");
};

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
    try {
      await User.findByEmail(email);
      return res.status(409).json({ message: "Email already exists" });
    } catch (error) {
      if (error.message !== "User not found") {
        throw error;
      }
    }

    // Validate date of birth
    const formattedDate = validateDateOfBirth(dateOfBirth);

    // Create new user
    await User.create(email, password, name, formattedDate);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    if (
      error.message === "Invalid email format" ||
      error.message === "Password must be at least 4 characters long" ||
      error.message ===
        "Password must contain at least one uppercase letter, one lowercase letter, and one number" ||
      error.message === "Name must be a non-empty string" ||
      error.message === "Invalid dateOfBirth format" ||
      error.message === "User must be at least 13 years old" ||
      error.message === "Invalid role"
    ) {
      return res.status(400).json({ message: error.message });
    }
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
        id: user.id,
        email: user.email,
        name: user.name,
        dateOfBirth: user.date_of_birth,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    if (
      error.message === "User not found" ||
      error.message === "Invalid email format"
    ) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all users
export async function getUsers(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }
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
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Search users by name
export async function searchUsersByName(req, res) {
  const { name } = req.query;

  if (!name) {
    return res
      .status(400)
      .json({ message: "Name query parameter is required" });
  }

  try {
    const users = await User.searchByName(name);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    if (error.message === "No users found") {
      return res.status(404).json({ message: "No users found" });
    }
    if (error.message === "Search name must be a non-empty string") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update user
export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, dateOfBirth, password } = req.body;

  // Check if at least one field is provided
  if (!name && !dateOfBirth && !password) {
    return res.status(400).json({
      message:
        "At least one field (name, dateOfBirth, password) must be provided",
    });
  }

  // Check if user is authorized (own account or admin)
  if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
    return res.status(403).json({
      message:
        "Unauthorized: You can only update your own account or must be an admin",
    });
  }

  try {
    // Find user
    const user = await User.findById(id);

    // Prepare update fields
    const updates = {};
    if (name) updates.name = name;
    if (dateOfBirth) {
      updates.date_of_birth = validateDateOfBirth(dateOfBirth);
    }
    if (password) updates.password = password;

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
    if (
      error.message === "User not found" ||
      error.message === "No fields to update" ||
      error.message === "User not found or no changes made" ||
      error.message === "Name must be a non-empty string" ||
      error.message === "Invalid dateOfBirth format" ||
      error.message === "User must be at least 13 years old" ||
      error.message === "Password must be at least 8 characters long" ||
      error.message ===
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete user
export async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    // Find user
    const user = await User.findById(id);

    // Prevent admin from deleting their own account
    if (req.user.id === parseInt(id) && req.user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Cannot delete your own admin account" });
    }

    // Delete user
    await User.delete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.message === "Cannot delete your own admin account") {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
