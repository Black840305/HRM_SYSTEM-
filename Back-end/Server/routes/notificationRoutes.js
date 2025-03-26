const express = require("express");
const {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getNotificationsForEmployee,
  getNotificationsForDepartment
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
// Route để lấy thông báo cho một nhân viên cụ thể
router.get(
  "/employee/:employeeId",
  verifyAccessToken,
  getNotificationsForEmployee
);

router.get("/:id", verifyAccessToken, getNotificationById);
router.get(
  "/department/:departmentId",
  verifyAccessToken,
  getNotificationsForDepartment
);
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
