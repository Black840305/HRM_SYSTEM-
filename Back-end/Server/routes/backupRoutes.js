const express = require("express");
const {
  getAllBackups,
  getBackupById,
  createBackup,
  updateBackup,
  deleteBackup,
} = require("../controllers/backupController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles(["admin"]), getAllBackups);
router.get("/:id", verifyAccessToken, getBackupById);
router.post("/", verifyAccessToken, authorizeRoles(["admin"]), createBackup);
router.put("/:id", verifyAccessToken, authorizeRoles(["admin"]), updateBackup);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["Admin"]),
  deleteBackup
);

module.exports = router;
