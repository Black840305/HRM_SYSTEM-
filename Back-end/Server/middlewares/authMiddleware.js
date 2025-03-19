const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Middleware xác thực Token
const verifyAccessToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có Token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(403).json({ message: "Token không hợp lệ" });
  }
};

// Middleware phân quyền
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }
    next();
  };
};

// authMiddleware.js
exports.authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền truy cập" });
  }
  next();
};

module.exports = { verifyAccessToken, authorizeRoles };
