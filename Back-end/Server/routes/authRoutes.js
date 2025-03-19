const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Đăng ký (chỉ admin được phép đăng ký user mới)
router.post(
  "/register",
  verifyAccessToken,
  authorizeRoles("admin"),
  authController.register
);

// Đăng nhập
router.post("/login", authController.login);
router.get("/me", verifyAccessToken, authController.getMe);
// Lấy thông tin người dùng (kèm Employee nếu có)
// router.get("/me", verifyAccessToken, authController.getMe);

module.exports = router;
