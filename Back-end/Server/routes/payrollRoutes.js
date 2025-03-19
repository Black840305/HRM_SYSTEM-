const express = require("express");
const {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
} = require("../controllers/payrollController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles(["admin"]), getAllPayrolls);
router.get("/:id", verifyAccessToken, getPayrollById);
router.post("/", verifyAccessToken, authorizeRoles(["admin"]), createPayroll);
router.put("/:id", verifyAccessToken, authorizeRoles(["admin"]), updatePayroll);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deletePayroll
);

module.exports = router;
