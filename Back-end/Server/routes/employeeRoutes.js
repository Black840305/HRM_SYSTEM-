const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const {
  verifyAccessToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const router = express.Router();

// Configure multer storage for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/avatars";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "avatar-" + uniqueSuffix + ext);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// 📌 Admin có quyền xem toàn bộ danh sách nhân viên
router.get("/", verifyAccessToken, authorizeRoles(["admin"]), getAllEmployees);

router.get("/check", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Find user by email first
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ exists: false });
    }

    // Then find employee linked to that user
    const employee = await Employee.findOne({ user: user._id });

    if (employee) {
      return res.status(200).json({
        exists: true,
        employeeId: employee._id.toString(),
      });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking employee:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 📌 Nhân viên chỉ xem thông tin của chính họ
router.get("/:id", verifyAccessToken, getEmployeeById);

// 📌 Admin có quyền tạo nhân viên mới
router.post("/", verifyAccessToken, authorizeRoles(["admin"]), createEmployee);

// 📌 Admin có quyền cập nhật thông tin nhân viên
router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  updateEmployee
);

// 📌 Admin có quyền xóa nhân viên
router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles(["admin"]),
  deleteEmployee
);

// 📌 Avatar upload endpoint - both admin and employee can upload their own avatar
router.post(
  "/:id/avatar",
  verifyAccessToken,
  (req, res, next) => {
    // Handle file upload
    upload.single("avatar")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        // An unknown error occurred
        return res
          .status(500)
          .json({ message: `Server error: ${err.message}` });
      }

      // If no file was provided
      if (!req.file) {
        return res.status(400).json({ message: "Please upload an image file" });
      }

      // Continue to the next middleware
      next();
    });
  },
  async (req, res) => {
    try {
      const employeeId = req.params.id;
      const userRole = req.user.role;
      const userId = req.user.id;

      // Check if user has permission to upload avatar for this employee
      // Admin can upload for anyone, employees only for themselves
      if (userRole !== "admin" && userId !== employeeId) {
        // Remove the uploaded file
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({
          message:
            "You do not have permission to update this employee's avatar",
        });
      }

      // Find the employee in the database
      const Employee = require("../models/employeeModel"); // Import your Employee model
      const employee = await Employee.findById(employeeId);

      if (!employee) {
        // Remove the uploaded file if employee not found
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Employee not found" });
      }

      // Delete old avatar file if exists
      if (employee.avatar && fs.existsSync(employee.avatar)) {
        fs.unlinkSync(employee.avatar);
      }

      // Update employee with new avatar path
      employee.avatar = req.file.path;
      await employee.save();

      // Return success response with the avatar URL
      res.status(200).json({
        message: "Avatar uploaded successfully",
        avatarUrl: `${req.protocol}://${req.get(
          "host"
        )}/${req.file.path.replace(/\\/g, "/")}`,
      });
    } catch (error) {
      // Remove the uploaded file in case of error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Error updating avatar" });
    }
  }
);

module.exports = router;
