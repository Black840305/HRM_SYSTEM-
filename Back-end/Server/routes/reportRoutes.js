const express = require("express");
const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles(["admin"]), getAllReports);
router.get("/:id", verifyAccessToken, getReportById);
router.post("/", verifyAccessToken, authorizeRoles(["admin"]), createReport);
router.put("/:id", verifyAccessToken, authorizeRoles(["admin"]), updateReport);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteReport
);

module.exports = router;
