const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee", // Những người nhận cụ thể
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // Phòng ban nhận thông báo
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
