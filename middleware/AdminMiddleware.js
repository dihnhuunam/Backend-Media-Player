export function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin access required" });
  }
  next();
}
