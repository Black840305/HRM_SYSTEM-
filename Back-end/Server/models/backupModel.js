const mongoose = require("mongoose");

const BackupSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backup", BackupSchema);
