const mongoose = require("mongoose");

// Import all models
const UserRouter = require("./UserRouter");
const employeeRouter = require("./employeeRouter");
const departmentRouter = require("./departmentRouter");
const salaryRouter = require("./salaryRouter");
const attendanceRouter = require("./attendanceRouter");
const notificationRouter = require("./notificationRouter");
const activityLogRouter = require("./activityLogRouter");

// Export all models
module.exports = {
  UserRouter,
  employeeRouter,
  departmentRouter,
  salaryRouter,
  attendanceRouter,
  notificationRouter,
  activityLogRouter,
};

// Connect to MongoDB
