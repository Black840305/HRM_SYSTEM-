const express = require("express");
const {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getPayrollsByEmployee,
  getLatestPayrollByEmployee,
} = require("../controllers/payrollController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Admin routes
router.get("/", verifyAccessToken, authorizeRoles(["admin"]), getAllPayrolls);
router.post("/", verifyAccessToken, authorizeRoles(["admin"]), createPayroll);
router.put("/:id", verifyAccessToken, authorizeRoles(["admin"]), updatePayroll);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deletePayroll
);

// Routes accessible by both admin and regular employees
router.get("/:id", verifyAccessToken, getPayrollById);

// New routes for employee access
router.get("/employee/:employeeId", verifyAccessToken, getPayrollsByEmployee);
router.get(
  "/employee/:employeeId/latest",
  verifyAccessToken,
  getLatestPayrollByEmployee
);

module.exports = router;
