const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null, // Trưởng phòng/quản lý phòng ban
    },
    location: {
      type: String,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
// Thêm virtual để đếm số nhân viên trong phòng ban
DepartmentSchema.virtual("employeeCount", {
  ref: "Employee",
  localField: "_id",
  foreignField: "department",
  count: true,
});
module.exports = mongoose.model("Department", DepartmentSchema);
