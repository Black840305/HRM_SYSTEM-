const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyDeparture: {
      type: Boolean,
      default: false,
    },
    isLeave: {
      type: Boolean,
      default: false,
    },
    leaveType: {
      type: String,
      enum: ["annual", "sick", "maternity", "bereavement", "unpaid"],
    },
    leaveStartDate: {
      type: Date,
    },
    leaveEndDate: {
      type: Date,
    },
    leaveDays: {
      type: Number,
    },
    leaveReason: {
      type: String,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimeStart: {
      type: String,
    },
    overtimeEnd: {
      type: String,
    },
    overtimeReason: {
      type: String,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Tạo index cho truy vấn hiệu quả
AttendanceSchema.index({ employee: 1, date: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
