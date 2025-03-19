const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Payroll = require("../models/payrollModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Department = require("../models/departmentModel");
const mongoose = require("mongoose");
// Controller lấy tất cả nhân viên
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("user", "email role")
      .populate("department", "name")
      .populate("salary", "baseSalary allowances bonuses deductions");

    // Xử lý trả về kết quả với kiểm tra null/undefined
    const result = employees.map((employee) => ({
      _id: employee._id,
      name: employee.name || "Chưa cập nhật",
      email: employee.user?.email || "Chưa cập nhật",
      dob: employee.dob
        ? employee.dob instanceof Date
          ? employee.dob.toISOString().split("T")[0]
          : "Chưa cập nhật"
        : "Chưa cập nhật",
      gender: employee.gender || "Chưa cập nhật",
      address: employee.address || "Chưa cập nhật",
      phone: employee.phone || "Chưa cập nhật",
      department: employee.department?.name || "Chưa cập nhật",
      position: employee.position || "Chưa cập nhật",
      salary: employee.salary?.baseSalary || 0,
      allowances:
        employee.salary?.allowances.map((item) => ({
          type: item.type,
          amount: item.amount,
          description: item.description,
        })) || [],

      // Accessing bonuses
      bonuses:
        employee.salary?.bonuses.map((item) => ({
          type: item.type,
          amount: item.amount,
          description: item.description,
        })) || [],

      // Accessing deductions
      deductions:
        employee.salary?.deductions.map((item) => ({
          type: item.type,
          amount: item.amount,
          description: item.description,
        })) || [],

      startDate: employee.startDate
        ? employee.startDate instanceof Date
          ? employee.startDate.toISOString().split("T")[0]
          : "Chưa cập nhật"
        : "Chưa cập nhật",
      avatar: employee.avatar || "",
      role: employee.user?.role || "employee",
    }));

    return res.json(result);
  } catch (err) {
    console.error("Error fetching employees:", err);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách nhân viên",
      error: err.message,
    });
  }
};

// Controller lấy thông tin nhân viên theo ID
const getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    if (!employeeId) {
      console.log("Employee ID is missing in the request");
      return res.status(400).json({ message: "Employee ID is missing" });
    }

    console.log(`Searching for employee with ID: ${employeeId}`);

    const employee = await Employee.findById(employeeId)
      .populate("department", "name")
      .populate("user", "username email role")
      .populate("salary", "baseSalary");

    if (!employee) {
      console.log(`Employee with ID ${employeeId} not found`);
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check access rights
    if (
      req.user.role !== "admin" &&
      (!req.user.employeeId ||
        req.user.employeeId.toString() !== employee._id.toString())
    ) {
      console.log(
        `Access denied - user ${req.user.id} tried to access employee ${employee._id}`
      );
      return res.status(403).json({
        message: "You don't have permission to access this information",
      });
    }

    // Format the result, handling null/undefined values
    const result = {
      _id: employee._id,
      name: employee.name || "Not updated",
      email: employee.user?.email || "Not updated",
      dob: employee.dob
        ? employee.dob instanceof Date
          ? employee.dob.toISOString().split("T")[0]
          : "Not updated"
        : "Not updated",
      gender: employee.gender || "Not updated",
      address: employee.address || "Not updated",
      phone: employee.phone || "Not updated",
      department: employee.department?.name || "Not updated",
      position: employee.position || "Not updated",
      salary: employee.salary?.baseSalary || 0,
      startDate: employee.startDate
        ? employee.startDate instanceof Date
          ? employee.startDate.toISOString().split("T")[0]
          : "Not updated"
        : "Not updated",
      avatar: employee.avatar || "",
      role: employee.user?.role || "employee",
    };

    return res.json(result);
  } catch (error) {
    console.error(`Error in getEmployeeById: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    upload.single("avatar")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const {
        username,
        email,
        password,
        name,
        dob,
        gender,
        address,
        phone,
        departmentId,
        position,
        baseSalary,
        startDate,
        workSchedule,
        paymentMethod,
        bankName,
        accountNumber,
        accountName,
      } = req.body;

      // Validate required fields
      if (!username || !name || !departmentId || !baseSalary) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Username or email already in use",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role: "employee",
      });

      await newUser.save();

      // Get department by ID
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Create employee record
      const newEmployee = new Employee({
        user: newUser._id,
        name,
        dob,
        gender,
        address,
        phone,
        department: departmentId, // Store departmentId as ObjectId
        position,
        startDate,
        workSchedule,
        avatar: req.file ? req.file.path : null,
      });

      await newEmployee.save();

      // Link employee ID back to user
      newUser.employeeId = newEmployee._id;
      await newUser.save();

      // Get current date for payroll
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
      const currentYear = currentDate.getFullYear();

      // Create initial payroll entry
      const newPayroll = new Payroll({
        employee: newEmployee._id,
        month: currentMonth,
        year: currentYear,
        baseSalary: Number(baseSalary) || 0,
        allowances: [],
        bonuses: [],
        deductions: [],
        workingDays: 0,
        leaveDays: 0,
        absentDays: 0,
        overtimeHours: 0,
        overtimeAmount: 0,
        totalAmount: Number(baseSalary) || 0, // Initially just the base salary
        status: "pending",
        paymentMethod: paymentMethod || "bank",
        bankInfo:
          paymentMethod === "bank"
            ? {
                bankName,
                accountNumber,
                accountName,
              }
            : null,
      });

      await newPayroll.save();

      res.status(201).json({
        message: "Employee created successfully",
        employee: {
          id: newEmployee._id,
          name: newEmployee.name,
          email: newUser.email,
        },
      });
    });
  } catch (err) {
    console.error("Error creating employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateEmployee = async (req, res) => {
  const {
    name,
    email,
    dob,
    gender,
    address,
    phone,
    department,
    position,
    salary, // This should be the baseSalary value
    startDate,
    workSchedule,
    status,
  } = req.body;

  try {
    // Find employee with proper populate
    const employee = await Employee.findById(req.params.id)
      .populate("user")
      .populate("department")
      .populate("salary");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Log what we received to help with debugging
    console.log("Updating employee:", employee);
    console.log("Request body:", req.body);

    // Email is required - update user's email if provided
    if (email && employee.user) {
      employee.user.email = email;
      await employee.user.save();
    } else if (email) {
      // If no user object but email provided
      employee.email = email;
    }

    // Check and validate department if provided
    if (department && !mongoose.Types.ObjectId.isValid(department)) {
      const departmentDoc = await Department.findOne({ name: department });
      if (!departmentDoc) {
        return res.status(400).json({
          message: "Department not found",
          receivedName: department,
        });
      }
      employee.department = departmentDoc._id;
    } else if (department) {
      // If it's already a valid ObjectId
      employee.department = department;
    }

    // Update salary (baseSalary) if provided
    if (salary !== undefined) {
      // Check if salary document exists
      if (employee.salary) {
        // Update the existing salary document
        employee.salary.baseSalary = Number(salary);
        await employee.salary.save();
      } else {
        // Create a new salary document
        const newSalary = new Payroll({
          baseSalary: Number(salary),
          allowances: [],
          bonuses: [],
          deductions: [],
        });

        const savedSalary = await newSalary.save();
        employee.salary = savedSalary._id;
      }
    }

    // Update other fields
    if (name) employee.name = name;
    if (dob) employee.dob = new Date(dob);
    if (gender) employee.gender = gender;
    if (address) employee.address = address;
    if (phone) employee.phone = phone;
    if (position) employee.position = position;
    if (startDate) employee.startDate = new Date(startDate);
    if (workSchedule) employee.workSchedule = workSchedule;
    if (status) employee.status = status;

    // Save and populate the updated employee
    const updatedEmployee = await employee.save();

    res.json(updatedEmployee);
  } catch (err) {
    console.error("Error updating employee:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({
        message: "Validation Error",
        errors,
      });
    }

    // Handle cast errors (like invalid ObjectId)
    if (err.name === "CastError") {
      return res.status(400).json({
        message: `Invalid ${err.path} format`,
        details: err.message,
        receivedValue: err.value,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate key error",
        field: Object.keys(err.keyPattern)[0],
      });
    }

    // Generic error handler
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
const deleteEmployee = async (req, res) => {
  try {
    // Tìm nhân viên theo ID
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Xóa avatar nếu có
    if (employee.avatar) {
      const fs = require("fs");
      const path = require("path");
      const avatarPath = path.join(__dirname, "..", "..", employee.avatar);

      // Kiểm tra file tồn tại trước khi xóa
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Xóa bản ghi liên quan từ bảng User
    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }

    // Xóa bản ghi liên quan từ bảng Payroll
    await Payroll.deleteMany({ employee: employee._id });

    // Xóa nhân viên
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: "Đã xóa nhân viên thành công" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean(); // ✅ Trả về object JSON thuần

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // ✅ Kiểm tra Employee
    const employee = await Employee.findOne({ user: user._id })
      .select("_id")
      .lean();

    res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: employee ? employee._id.toString() : null, // ✅ Chỉ trả về ID dạng string
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);

    res.status(500).json({ message: "Lỗi server" });
  }
};

// Configure multer storage
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

// Upload avatar endpoint
const uploadAvatar = async (req, res) => {
  try {
    // Use multer middleware for single file upload
    upload.single("avatar")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const employeeId = req.params.id;

      // Find employee and update avatar field
      const employee = await Employee.findById(employeeId);

      if (!employee) {
        // Remove uploaded file if employee not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Employee not found" });
      }

      // Delete old avatar file if exists
      if (employee.avatar && fs.existsSync(employee.avatar)) {
        fs.unlinkSync(employee.avatar);
      }

      // Update employee with new avatar path
      employee.avatar = req.file.path;
      await employee.save();

      res.status(200).json({
        message: "Avatar uploaded successfully",
        avatarUrl: `http://localhost:3000/${req.file.path.replace(/\\/g, "/")}`,
      });
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ message: "Error uploading avatar" });
  }
};

const checkEmployee = async (req, res) => {
  try {
    const { email } = req.query;
    const employee = await Employee.findOne({ email });

    if (employee) {
      return res
        .status(200)
        .json({ exists: true, employeeId: employee._id.toString() });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking employee:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMe,
  uploadAvatar,
  checkEmployee,
};
