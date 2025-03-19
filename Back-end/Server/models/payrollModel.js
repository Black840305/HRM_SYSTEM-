const mongoose = require("mongoose");

const PayrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: [
      {
        type: { type: String },
        amount: { type: Number },
        description: { type: String },
      },
    ],
    bonuses: [
      {
        type: { type: String },
        amount: { type: Number },
        description: { type: String },
      },
    ],
    deductions: [
      {
        type: { type: String },
        amount: { type: Number },
        description: { type: String },
      },
    ],
    // Thông tin liên quan đến chấm công
    workingDays: {
      type: Number,
      default: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "paid"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "cash", "other"],
      default: "bank",
    },
    bankInfo: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

// Tạo index cho truy vấn hiệu quả
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", PayrollSchema);
