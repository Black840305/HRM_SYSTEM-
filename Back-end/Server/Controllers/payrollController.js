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
    // Tìm bản ghi lương theo ID, populate dữ liệu nhân viên
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "name department"
    );

    const result = payroll.map((p) => ({
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
    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      baseSalary,
      allowances,
      bonuses,
      deductions,
      workingDays,
      leaveDays,
      absentDays,
      overtimeHours,
      overtimeAmount,
      status,
      paymentDate,
      paymentMethod,
      bankInfo,
      effectiveDate,
      note,
    } = req.body;

    // Tìm bản ghi lương theo ID
    const payroll = await Payroll.findById(req.params.id).session(session);
    if (!payroll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy bản ghi lương" });
    }

    // Cập nhật thông tin lương
    if (baseSalary !== undefined) payroll.baseSalary = baseSalary;
    if (allowances !== undefined) payroll.allowances = allowances;
    if (bonuses !== undefined) payroll.bonuses = bonuses;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (workingDays !== undefined) payroll.workingDays = workingDays;
    if (leaveDays !== undefined) payroll.leaveDays = leaveDays;
    if (absentDays !== undefined) payroll.absentDays = absentDays;
    if (overtimeHours !== undefined) payroll.overtimeHours = overtimeHours;
    if (overtimeAmount !== undefined) payroll.overtimeAmount = overtimeAmount;
    if (status !== undefined) payroll.status = status;
    if (paymentDate !== undefined) payroll.paymentDate = paymentDate;
    if (paymentMethod !== undefined) payroll.paymentMethod = paymentMethod;
    if (bankInfo !== undefined) payroll.bankInfo = bankInfo;
    if (effectiveDate !== undefined) payroll.effectiveDate = effectiveDate;
    if (note !== undefined) payroll.note = note;

    // Tính lại tổng lương
    const allowancesTotal = payroll.allowances.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const bonusesTotal = payroll.bonuses.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const deductionsTotal = payroll.deductions.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    payroll.totalAmount =
      payroll.baseSalary +
      allowancesTotal +
      bonusesTotal -
      deductionsTotal +
      payroll.overtimeAmount;

    // Lưu thay đổi
    await payroll.save({ session });

    // Cập nhật thông tin lương trong hồ sơ nhân viên nếu cần
    if (
      baseSalary !== undefined ||
      allowances !== undefined ||
      bonuses !== undefined ||
      deductions !== undefined
    ) {
      const employee = await Employee.findById(payroll.employee).session(
        session
      );
      if (employee) {
        if (baseSalary !== undefined) employee.salary = baseSalary;
        if (allowances !== undefined) employee.allowances = allowances;
        if (bonuses !== undefined) employee.bonuses = bonuses;
        if (deductions !== undefined) employee.deductions = deductions;
        employee.salaryUpdatedAt = new Date();
        await employee.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Trả về bản ghi lương đã cập nhật với thông tin nhân viên
    await payroll.populate("employee", "name department position");
    res.json(payroll);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating payroll:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
