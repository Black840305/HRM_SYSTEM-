const express = require("express");
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware"); // ✅ Đúng

const router = express.Router();

router.get(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  getAllDepartments
);
router.get("/:id", verifyAccessToken, getDepartmentById);
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  createDepartment
);
router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  updateDepartment
);
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteDepartment
);

module.exports = router;
