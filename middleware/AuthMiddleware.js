import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function authMiddleware(req, res, next) {
  // Get token from  header Authorization
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Check if token is started with "Bearer "
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    // Authorize token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Save user (id, email, role) to request
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
