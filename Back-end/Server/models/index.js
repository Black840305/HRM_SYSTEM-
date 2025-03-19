const mongoose = require("mongoose");

const Employee = require("./Employee.js");
const User = require("./User.js");
const Notification = require("./notification.js");
const Attendance = require("./Attendance.js");
const Department = require("./Department.js");
const ActivityLog = require("./Activitylog.js");
const Salary = require("./Salary.js");


module.exports = { Employee, User, Notification, Attendance, Department, ActivityLog, Salary };
