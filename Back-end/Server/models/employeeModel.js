const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    salary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    // Thông tin bổ sung cho chấm công
    workSchedule: {
      type: String,
      enum: ["full-time", "part-time", "contract"],
      default: "full-time",
    },
    workHours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" },
    },
    leaveBalance: {
      annual: { type: Number, default: 12 },
      sick: { type: Number, default: 10 },
      unpaid: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated", "on-leave"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Tạo employeeCode tự động trước khi lưu
EmployeeSchema.pre("save", function (next) {
  if (!this.employeeCode) {
    // Tạo mã nhân viên dựa trên năm hiện tại và ID
    const year = new Date().getFullYear().toString().substr(-2);
    const id = this._id.toString().substr(-4);
    this.employeeCode = `EMP${year}${id}`;
  }
  next();
});

module.exports = mongoose.model("Employee", EmployeeSchema);
