const express = require("express");
const {
  getAllActivityLogs,
  getActivityLogById,
  createActivityLog,
  updateActivityLog,
  deleteActivityLog,
} = require("../controllers/activityLogController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

router.get(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  getAllActivityLogs
);
router.get("/:id", verifyAccessToken, getActivityLogById);
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  createActivityLog
);
router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  updateActivityLog
);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteActivityLog
);

module.exports = router;
