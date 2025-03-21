const Payroll = require("../models/payrollModel");
const Employee = require("../models/employeeModel");
const mongoose = require("mongoose");
exports.getAllPayrolls = async (req, res) => {
  try {
    // Lấy tất cả bản ghi lương, populate dữ liệu nhân viên
    const payrolls = await Payroll.find()
      .populate(
        "employee",
        "name department baseSalary allowance bonuses deductions"
      )
      .sort({ month: -1, year: -1 });

    const result = payrolls.map((p) => ({
      _id: p._id,
      employee: {
        _id: p.employee._id,
        name: p.employee.name || "Chưa cập nhật",
        department: p.employee.department || "Chưa cập nhật",
        baseSalary: p.employee.baseSalary || 0,
      },
      month: p.month,
      year: p.year,
      baseSalary: p.baseSalary,
      allowances: p.allowances,
      bonuses: p.bonuses,
      deductions: p.deductions,
      workingDays: p.workingDays,
      leaveDays: p.leaveDays,
      absentDays: p.absentDays,
      overtimeHours: p.overtimeHours,
      overtimeAmount: p.overtimeAmount,
      totalAmount: p.totalAmount,
      status: p.status,
      paymentDate: p.paymentDate
        ? p.paymentDate.toISOString().split("T")[0]
        : "Chưa cập nhật",
      paymentMethod: p.paymentMethod,
      bankInfo: p.bankInfo,
      note: p.note,
    }));

    return res.json(result);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    // Find payroll record by ID and populate employee data
    const payroll = await Payroll.findById(req.params.id).populate({
      path: "employee",
      select: "name department position baseSalary",
    });

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Transform the payroll object into the desired format
    const result = {
      _id: payroll._id,
      employee: {
        _id: payroll.employee._id,
        name: payroll.employee.name || "Chưa cập nhật",
        department: payroll.employee.department || "Chưa cập nhật",
        position: payroll.employee.position || "Chưa cập nhật",
        baseSalary: payroll.employee.baseSalary || 0,
      },
      month: payroll.month,
      year: payroll.year,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      workingDays: payroll.workingDays,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      overtimeHours: payroll.overtimeHours,
      overtimeAmount: payroll.overtimeAmount,
      totalAmount: payroll.totalAmount,
      status: payroll.status,
      paymentDate: payroll.paymentDate
        ? payroll.paymentDate.toISOString().split("T")[0]
        : "Chưa cập nhật",
      paymentMethod: payroll.paymentMethod,
      bankInfo: payroll.bankInfo,
      note: payroll.note,
    };

    // Return the formatted payroll record
    res.json(result);
  } catch (err) {
    console.error("Error fetching payroll:", err);

    // Handle invalid ID format error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid payroll ID format" });
    }

    res.status(500).json({
      message: "Server error while fetching payroll data",
      error: err.message,
    });
  }
};

exports.createPayroll = async (req, res) => {
  const { employee, month, year, baseSalary, allowances, bonuses, deductions } =
    req.body;

  try {
    // Tạo bản ghi lương mới
    const newPayroll = await Payroll.create({
      employee,
      month,
      year,
      baseSalary,
      allowances,
      bonuses,
      deductions,
    });

    // Populate dữ liệu nhân viên
    await newPayroll.populate("employee", "name department");
    res.status(201).json(newPayroll);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    // Log để debug
    console.log("Cập nhật payroll ID:", id);
    console.log("Dữ liệu nhận được:", req.body);

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Tìm và cập nhật
    const updatedPayroll = await Payroll.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    // Kiểm tra kết quả
    if (!updatedPayroll) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi lương" });
    }

    res.status(200).json(updatedPayroll);
  } catch (error) {
    console.error("Lỗi cập nhật lương:", error);
    res.status(500).json({
      message: "Lỗi cập nhật lương",
      error: error.message,
    });
  }
};

exports.deletePayroll = async (req, res) => {
  try {
    // Tìm bản ghi lương theo ID
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ msg: "Payroll not found" });

    // Xóa bản ghi lương
    await payroll.remove();
    res.json({ msg: "Payroll removed" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Add these functions to your payrollController.js file

/**
 * Get payroll records for a specific employee
 * @route GET /api/payroll/employee/:employeeId
 * @access Private
 */
exports.getPayrollsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    // Build filter object
    const filter = { employee: employeeId };

    // Add month and year filters if provided
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    console.log("Fetching payrolls with filter:", filter);

    // Find payroll records for the employee
    const payrolls = await Payroll.find(filter)
      .populate({
        path: "employee",
        select: "name department position baseSalary",
      })
      .sort({ year: -1, month: -1 }); // Sort by most recent first

    if (payrolls.length === 0) {
      return res.status(200).json({
        message: "No payroll records found for this employee",
        data: [],
      });
    }

    // Format the payroll records
    const formattedPayrolls = payrolls.map((payroll) => ({
      _id: payroll._id,
      employee: {
        _id: payroll.employee._id,
        name: payroll.employee.name || "Chưa cập nhật",
        department: payroll.employee.department || "Chưa cập nhật",
        position: payroll.employee.position || "Chưa cập nhật",
        baseSalary: payroll.employee.baseSalary || 0,
      },
      month: payroll.month,
      year: payroll.year,
      periodLabel: `${payroll.month}/${payroll.year}`,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      workingDays: payroll.workingDays,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      overtimeHours: payroll.overtimeHours,
      overtimeAmount: payroll.overtimeAmount,
      totalAmount: payroll.totalAmount,
      status: payroll.status,
      paymentDate: payroll.paymentDate
        ? payroll.paymentDate.toISOString().split("T")[0]
        : "Chưa cập nhật",
      paymentMethod: payroll.paymentMethod,
      bankInfo: payroll.bankInfo,
      note: payroll.note,
    }));

    res.json({
      count: formattedPayrolls.length,
      data: formattedPayrolls,
    });
  } catch (err) {
    console.error("Error fetching employee payrolls:", err);

    // Handle invalid ID format error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid employee ID format" });
    }

    res.status(500).json({
      message: "Server error while fetching payroll records",
      error: err.message,
    });
  }
};

/**
 * Get the latest payroll record for a specific employee
 * @route GET /api/payroll/employee/:employeeId/latest
 * @access Private
 */
exports.getLatestPayrollByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find the most recent payroll record for the employee
    const payroll = await Payroll.findOne({ employee: employeeId })
      .populate({
        path: "employee",
        select: "name department position baseSalary",
      })
      .sort({ year: -1, month: -1 }) // Sort by most recent first
      .limit(1);

    if (!payroll) {
      return res.status(200).json({
        message: "No payroll records found for this employee",
        data: null,
      });
    }

    // Format the payroll record
    const result = {
      _id: payroll._id,
      employee: {
        _id: payroll.employee._id,
        name: payroll.employee.name || "Chưa cập nhật",
        department: payroll.employee.department || "Chưa cập nhật",
        position: payroll.employee.position || "Chưa cập nhật",
        baseSalary: payroll.employee.baseSalary || 0,
      },
      month: payroll.month,
      year: payroll.year,
      periodLabel: `${payroll.month}/${payroll.year}`,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      workingDays: payroll.workingDays,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      overtimeHours: payroll.overtimeHours,
      overtimeAmount: payroll.overtimeAmount,
      totalAmount: payroll.totalAmount,
      status: payroll.status,
      paymentDate: payroll.paymentDate
        ? payroll.paymentDate.toISOString().split("T")[0]
        : "Chưa cập nhật",
      paymentMethod: payroll.paymentMethod,
      bankInfo: payroll.bankInfo,
      note: payroll.note,
    };

    res.json({ data: result });
  } catch (err) {
    console.error("Error fetching latest employee payroll:", err);

    // Handle invalid ID format error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid employee ID format" });
    }

    res.status(500).json({
      message: "Server error while fetching latest payroll record",
      error: err.message,
    });
  }
};
