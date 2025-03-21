const Department = require("../models/departmentModel");
const Employee = require("../models/employeeModel"); // Cần để kiểm tra nhân viên

exports.getAllDepartments = async (req, res) => {
  try {
    // Thêm populate để lấy thông tin manager và thêm employeeCount
    const departments = await Department.find()
      .populate("manager", "name")
      .lean();

    // Tính toán employeeCount cho mỗi phòng ban
    for (let dept of departments) {
      const count = await Employee.countDocuments({ department: dept._id });
      dept.employeeCount = count;
    }

    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      "manager",
      "name"
    );
    if (!department)
      return res.status(404).json({ msg: "Department not found" });

    // Tính toán employeeCount
    const employeeCount = await Employee.countDocuments({
      department: department._id,
    });
    const result = department.toObject();
    result.employeeCount = employeeCount;

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, description, manager, location, budget } = req.body;

  if (!name) {
    return res.status(400).json({ msg: "Department name is required" });
  }

  try {
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ msg: "Department already exists" });
    }

    // Tạo department với các trường mở rộng
    const newDepartment = new Department({
      name,
      description,
      manager: manager || null,
      location: location || "",
      budget: budget || 0,
    });

    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateDepartment = async (req, res) => {
  const { name, description, manager, location, budget } = req.body;

  if (!name) {
    return res.status(400).json({ msg: "Department name is required" });
  }

  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ msg: "Department not found" });
    }

    // Kiểm tra trùng tên nếu đổi tên
    if (name !== department.name) {
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return res.status(400).json({ msg: "Department name already exists" });
      }
    }

    // Cập nhật tất cả các trường
    department.name = name;
    department.description = description || department.description;
    department.manager = manager || department.manager;
    department.location = location || department.location;
    department.budget = budget !== undefined ? budget : department.budget;

    await department.save();

    // Tính toán employeeCount
    const employeeCount = await Employee.countDocuments({
      department: department._id,
    });
    const result = department.toObject();
    result.employeeCount = employeeCount;

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Thêm API để lấy nhân viên theo phòng ban
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const employees = await Employee.find({ department: departmentId });
    res.json(employees);
  } catch (err) {
    console.error(err);
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
