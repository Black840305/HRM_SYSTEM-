const express = require("express");
const {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getEmployeeNotifications,
} = require("../controllers/notificationController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

// Add this route for employees to get their own notifications

router.get(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  getAllNotifications
);
router.get("/for-employee", verifyAccessToken, getEmployeeNotifications);
router.get("/:id", verifyAccessToken, getNotificationById);
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  createNotification
);
router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  updateNotification
);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteNotification
);

module.exports = router;
