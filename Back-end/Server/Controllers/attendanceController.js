const Attendance = require("../models/attendanceModel");
const Employee = require("../models/employeeModel");

exports.getAllAttendances = async (req, res) => {
  try {
    // Extract month and year from the query parameters
    const {
      employee,
      date,
      status,
      page = 1,
      limit = 10,
      month,
      year,
    } = req.query;

    // Build query filter
    const filter = {};
    if (employee) filter.employee = employee;
    if (date) filter.date = new Date(date);
    if (status) filter.status = status;

    // Add date filtering for month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Count total records matching the filter
    const total = await Attendance.countDocuments(filter);

    // Get data with pagination and populate employee information
    const attendances = await Attendance.find(filter)
      .populate({
        path: "employee",
        select: "name employeeCode department position",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: attendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAllAttendances:", err);
    res.status(500).json({
      message: "Server error while fetching attendance data",
      error: err.message,
    });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate({
      path: "employee",
      select: "name employeeCode department position email phone",
      populate: {
        path: "department",
        select: "name",
      },
    });

    if (!attendance)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json(attendance);
  } catch (err) {
    console.error("Error in getAttendanceById:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid attendance ID" });
    }

    res.status(500).json({
      message: "Server error while fetching attendance data",
      error: err.message,
    });
  }
};

exports.createAttendance = async (req, res) => {
  try {
    const {
      employee,
      date,
      checkInTime,
      checkOutTime,
      status = "pending",
      isLate,
      isEarlyDeparture,
      isLeave,
      leaveType,
      leaveReason,
      leaveDays = 1,
      overtimeHours,
      overtimeStart,
      overtimeEnd,
      overtimeReason,
      note,
    } = req.body;

    // Check if employee exists
    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if attendance record already exists for this employee on this date
    const existingAttendance = await Attendance.findOne({
      employee,
      date: new Date(date),
    });

    if (existingAttendance) {
      return res.status(400).json({
        message:
          "Attendance record already exists for this employee on this date",
      });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      employee,
      date: new Date(date),
      checkInTime: checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      status,
      isLate,
      isEarlyDeparture,
      isLeave,
      leaveType,
      leaveReason,
      leaveDays,
      overtimeHours,
      overtimeStart,
      overtimeEnd,
      overtimeReason,
      note,
    });

    await newAttendance.save();

    // Populate employee information before returning
    const populatedAttendance = await Attendance.findById(
      newAttendance._id
    ).populate({
      path: "employee",
      select: "name employeeCode department position",
      populate: {
        path: "department",
        select: "name",
      },
    });

    res.status(201).json({
      message: "Attendance record created successfully",
      data: populatedAttendance,
    });
  } catch (err) {
    console.error("Error in createAttendance:", err);
    res.status(500).json({
      message: "Server error while creating attendance record",
      error: err.message,
    });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const {
      date,
      checkInTime,
      checkOutTime,
      status,
      isLate,
      isEarlyDeparture,
      isLeave,
      leaveType,
      leaveReason,
      leaveDays,
      overtimeHours,
      overtimeStart,
      overtimeEnd,
      overtimeReason,
      note,
    } = req.body;

    // Find attendance record to update
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Update fields if present in request
    if (date) attendance.date = new Date(date);
    if (checkInTime !== undefined)
      attendance.checkInTime = checkInTime ? new Date(checkInTime) : null;
    if (checkOutTime !== undefined)
      attendance.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    if (status) attendance.status = status;
    if (isLate !== undefined) attendance.isLate = isLate;
    if (isEarlyDeparture !== undefined)
      attendance.isEarlyDeparture = isEarlyDeparture;
    if (isLeave !== undefined) attendance.isLeave = isLeave;
    if (leaveType) attendance.leaveType = leaveType;
    if (leaveReason) attendance.leaveReason = leaveReason;
    if (leaveDays !== undefined) attendance.leaveDays = leaveDays;
    if (overtimeHours !== undefined) attendance.overtimeHours = overtimeHours;
    if (overtimeStart) attendance.overtimeStart = overtimeStart;
    if (overtimeEnd) attendance.overtimeEnd = overtimeEnd;
    if (overtimeReason) attendance.overtimeReason = overtimeReason;
    if (note) attendance.note = note;

    // Update updated timestamp
    attendance.updatedAt = new Date();

    await attendance.save();

    // Populate employee information before returning
    const updatedAttendance = await Attendance.findById(
      attendance._id
    ).populate({
      path: "employee",
      select: "name employeeCode department position",
      populate: {
        path: "department",
        select: "name",
      },
    });

    res.json({
      message: "Attendance record updated successfully",
      data: updatedAttendance,
    });
  } catch (err) {
    console.error("Error in updateAttendance:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid attendance ID" });
    }

    res.status(500).json({
      message: "Server error while updating attendance record",
      error: err.message,
    });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Use deleteOne instead of remove (deprecated)
    await Attendance.deleteOne({ _id: req.params.id });

    res.json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    console.error("Error in deleteAttendance:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid attendance ID" });
    }

    res.status(500).json({
      message: "Server error while deleting attendance record",
      error: err.message,
    });
  }
};

// New methods

exports.getAttendancesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 31 } = req.query;

    // Build query filter
    const filter = { employee: employeeId };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Count total records matching the filter
    const total = await Attendance.countDocuments(filter);

    // Get employee attendance data
    const attendances = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: attendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAttendancesByEmployee:", err);
    res.status(500).json({
      message: "Server error while fetching employee attendance data",
      error: err.message,
    });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee has already checked in today
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    const checkInTime = new Date();

    // Check if late (assuming work starts at 8:00)
    const workStartTime = new Date(today);
    workStartTime.setHours(8, 0, 0, 0);
    const isLate = checkInTime > workStartTime;

    if (!attendance) {
      // If no attendance record for today, create a new one
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        checkInTime,
        isLate,
        status: "pending",
      });
    } else {
      // If record exists, update check-in information
      attendance.checkInTime = checkInTime;
      attendance.isLate = isLate;
    }

    await attendance.save();

    res.json({
      message: "Check-in successful",
      data: attendance,
    });
  } catch (err) {
    console.error("Error in checkIn:", err);
    res
      .status(500)
      .json({ message: "Server error during check-in", error: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find employee's attendance record for today
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No check-in record found for today" });
    }

    const checkOutTime = new Date();

    // Check if early departure (assuming work ends at 17:00)
    const workEndTime = new Date(today);
    workEndTime.setHours(17, 0, 0, 0);
    const isEarlyDeparture = checkOutTime < workEndTime;

    // Update check-out information
    attendance.checkOutTime = checkOutTime;
    attendance.isEarlyDeparture = isEarlyDeparture;

    // Calculate overtime hours if applicable
    if (checkOutTime > workEndTime) {
      const overtimeMinutes = (checkOutTime - workEndTime) / (1000 * 60);
      attendance.overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100; // Round to 2 decimal places
      attendance.overtimeStart = "17:00";
      attendance.overtimeEnd = `${checkOutTime.getHours()}:${checkOutTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }

    await attendance.save();

    res.json({
      message: "Check-out successful",
      data: attendance,
    });
  } catch (err) {
    console.error("Error in checkOut:", err);
    res
      .status(500)
      .json({ message: "Server error during check-out", error: err.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    // Create date range for selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all attendance records for employee in the month
    const attendances = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate statistics
    const workDays = attendances.filter((a) => !a.isLeave).length;
    const leaveDays = attendances
      .filter((a) => a.isLeave)
      .reduce((total, a) => total + (a.leaveDays || 1), 0);
    const lateDays = attendances.filter((a) => a.isLate).length;
    const earlyDepartureDays = attendances.filter(
      (a) => a.isEarlyDeparture
    ).length;

    // Calculate total overtime hours
    const totalOvertimeHours = attendances.reduce(
      (total, a) => total + (a.overtimeHours || 0),
      0
    );

    res.json({
      employeeId,
      month,
      year,
      summary: {
        workDays,
        leaveDays,
        lateDays,
        earlyDepartureDays,
        totalOvertimeHours,
      },
      details: attendances,
    });
  } catch (err) {
    console.error("Error in getAttendanceSummary:", err);
    res.status(500).json({
      message: "Server error while fetching attendance summary",
      error: err.message,
    });
  }
};

exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // Create date range for selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all attendance records for the month
    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate({
      path: "employee",
      select: "name employeeCode department position",
      populate: {
        path: "department",
        select: "name",
      },
    });

    // Group attendance data by employee
    const employeeAttendance = {};

    attendances.forEach((record) => {
      const employeeId = record.employee._id.toString();

      if (!employeeAttendance[employeeId]) {
        employeeAttendance[employeeId] = {
          employee: employeeId,
          daysPresent: 0,
          daysAbsent: 0,
          daysOnLeave: 0,
          overtimeHours: 0,
        };
      }

      // Update statistics based on record
      if (record.isLeave) {
        employeeAttendance[employeeId].daysOnLeave += record.leaveDays || 1;
      } else if (record.checkInTime && record.checkOutTime) {
        employeeAttendance[employeeId].daysPresent += 1;
      } else {
        employeeAttendance[employeeId].daysAbsent += 1;
      }

      employeeAttendance[employeeId].overtimeHours += record.overtimeHours || 0;
    });

    // Convert to array format expected by frontend
    const data = Object.values(employeeAttendance);

    res.json({
      data: data,
    });
  } catch (err) {
    console.error("Error in getMonthlyAttendance:", err);
    res.status(500).json({
      message: "Server error while fetching monthly attendance data",
      error: err.message,
    });
  }
};
