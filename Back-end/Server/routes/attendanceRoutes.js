const express = require("express");
const {
  getAllAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendancesByEmployee,
  checkIn,
  checkOut,
  getAttendanceSummary,
  getMonthlyAttendance,
} = require("../controllers/attendanceController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Basic CRUD routes
router.get(
  "/",
  (req, res, next) => {
    console.log("Attendance route HIT:", req.query);
    next();
  },
  verifyAccessToken,
  authorizeRoles(["admin"]),
  getAllAttendances
);
router.get("/:id", verifyAccessToken, getAttendanceById);
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  createAttendance
);
router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  updateAttendance
);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteAttendance
);

// Additional routes for specific features
router.get(
  "/employee/:employeeId",
  verifyAccessToken,
  getAttendancesByEmployee
);
router.get("/summary/:employeeId", verifyAccessToken, getAttendanceSummary);
router.post("/check-in", verifyAccessToken, checkIn);
router.post("/check-out", verifyAccessToken, checkOut);
router.get("/monthly", verifyAccessToken, getMonthlyAttendance);

module.exports = router;
