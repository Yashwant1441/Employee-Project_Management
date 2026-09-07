const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "apex_employee_project_management_secret_key_2026";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized access. No authentication token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Session expired or invalid token. Please log in again.",
      error: error.message
    });
  }
};

module.exports = {
  requireAuth,
  JWT_SECRET
};
