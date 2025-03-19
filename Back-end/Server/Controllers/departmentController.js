const Department = require("../models/departmentModel");
const Employee = require("../models/employeeModel"); // Cần để kiểm tra nhân viên

// Lấy danh sách phòng ban
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Lấy thông tin phòng ban theo ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return res.status(404).json({ msg: "Department not found" });
    res.json(department);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Tạo phòng ban mới
exports.createDepartment = async (req, res) => {
  const { name, description } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    return res.status(400).json({ msg: "Department name is required" });
  }

  try {
    // Kiểm tra phòng ban đã tồn tại chưa
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ msg: "Department already exists" });
    }

    const newDepartment = new Department({ name, description });
    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Cập nhật thông tin phòng ban
exports.updateDepartment = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ msg: "Department name is required" });
  }

  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }

    // Kiểm tra trùng tên nếu cập nhật
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment && existingDepartment.id !== req.params.id) {
      return res.status(400).json({ msg: "Department name already exists" });
    }

    department.name = name;
    department.description = description || department.description;

    await department.save();
    res.json(department);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Xóa phòng ban
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }

    // Kiểm tra xem có nhân viên nào thuộc phòng ban này không
    const employees = await Employee.find({ department: req.params.id });
    if (employees.length > 0) {
      return res
        .status(400)
        .json({ msg: "Cannot delete department with employees" });
    }

    await department.deleteOne();
    res.json({ msg: "Department removed" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
