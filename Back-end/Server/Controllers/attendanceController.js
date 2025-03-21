const Attendance = require("../models/attendanceModel");
const Employee = require("../models/employeeModel");
exports.getAttendancesByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { limit = 10, page = 1, month, year } = req.query;

    // Build the filter
    const filter = { employee: employeeId };

    // Add date filtering for month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // If no month/year specified, default to current month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    console.log("Fetching attendance for employee:", employeeId);
    console.log("Filter criteria:", filter);

    // Count total matching records
    const total = await Attendance.countDocuments(filter);

    // Get the records with pagination
    const attendances = await Attendance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Process records to add calculated fields
    const processedAttendances = attendances.map((record) => {
      const attendance = record.toObject();

      // Add formatted date
      attendance.formattedDate = new Date(attendance.date).toLocaleDateString();

      // Calculate working hours if applicable
      if (attendance.checkInTime && attendance.checkOutTime) {
        const checkIn = new Date(attendance.checkInTime);
        const checkOut = new Date(attendance.checkOutTime);
        const diffMs = checkOut - checkIn;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        attendance.workingHours = `${hours}h ${minutes}m`;
      }

      // Generate remarks based on attendance status
      let remarks = "";
      if (attendance.isLate) remarks += "Late arrival. ";
      if (attendance.isEarlyDeparture) remarks += "Early departure. ";
      if (attendance.isLeave)
        remarks += `${attendance.leaveType || ""} Leave: ${
          attendance.leaveReason || "No reason provided"
        }. `;
      if (attendance.overtimeHours > 0)
        remarks += `Overtime: ${attendance.overtimeHours}h (${
          attendance.overtimeReason || "No reason provided"
        }). `;
      if (attendance.note) remarks += attendance.note;

      attendance.remarks = remarks.trim() || "Regular attendance";

      return attendance;
    });

    res.json({
      data: processedAttendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAttendancesByEmployee:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    res.status(500).json({
      message: "Server error while fetching employee attendance data",
      error: err.message,
    });
  }
};

exports.getAllAttendances = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      month,
      year,
      employeeId,
      department,
      status,
      sortBy = "date",
      sortOrder = -1,
    } = req.query;

    // Build the filter
    const filter = {};

    // Add employee filter if provided
    if (employeeId) {
      filter.employee = employeeId;
    }

    // Add date filtering for month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // If no month/year specified, default to current month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Add department filter if provided - thay đổi để sử dụng aggregation
    let departmentFilter = {};
    if (department) {
      departmentFilter = { "employee.department": department };
    }

    // Add status filters if provided
    if (status) {
      switch (status) {
        case "present":
          filter.isAbsent = { $ne: true };
          filter.isLeave = { $ne: true };
          break;
        case "absent":
          filter.isAbsent = true;
          break;
        case "late":
          filter.isLate = true;
          break;
        case "leave":
          filter.isLeave = true;
          break;
        case "overtime":
          filter.overtimeHours = { $gt: 0 };
          break;
        default:
      }
    }

    console.log("Admin fetching all attendance records");
    console.log("Filter criteria:", filter);

    // Prepare sort options
    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    // Count total matching records - đếm tổng số bản ghi thỏa mãn điều kiện
    const total = await Attendance.countDocuments(filter);

    // Get the records with pagination and POPULATE ĐÚNG CÁCH
    // Sử dụng populate nhiều cấp để lấy department name
    const attendances = await Attendance.find(filter)
      .populate({
        path: "employee",
        select: "name employeeId department position profileImage",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate("approvedBy", "name username")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Process records to add calculated fields
    const processedAttendances = attendances.map((record) => {
      const attendance = record.toObject();

      // Add formatted date
      attendance.formattedDate = new Date(attendance.date).toLocaleDateString();

      // Calculate working hours if applicable
      if (attendance.checkInTime && attendance.checkOutTime) {
        const checkIn = new Date(attendance.checkInTime);
        const checkOut = new Date(attendance.checkOutTime);
        const diffMs = checkOut - checkIn;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        attendance.workingHours = `${hours}h ${minutes}m`;
      }

      // Generate remarks based on attendance status
      let remarks = "";
      if (attendance.isLate) remarks += "Đi muộn. ";
      if (attendance.isEarlyDeparture) remarks += "Về sớm. ";
      if (attendance.isLeave)
        remarks += `Nghỉ phép ${attendance.leaveType || ""}: ${
          attendance.leaveReason || "Không có lý do"
        }. `;
      if (attendance.overtimeHours > 0)
        remarks += `Làm thêm: ${attendance.overtimeHours}h (${
          attendance.overtimeReason || "Không có lý do"
        }). `;
      if (attendance.note) remarks += attendance.note;

      attendance.remarks = remarks.trim() || "Chấm công bình thường";

      return attendance;
    });

    // Group attendance data by department (if needed)
    let departmentStats = {};
    if (req.query.includeStats === "true") {
      // Thực hiện thống kê theo phòng ban
      departmentStats = await calculateDepartmentStats(month, year);
    }

    res.json({
      data: processedAttendances,
      stats: req.query.includeStats === "true" ? departmentStats : undefined,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAllAttendance:", err);
    res.status(500).json({
      message: "Lỗi server khi tải dữ liệu chấm công",
      error: err.message,
    });
  }
};

// Hàm tính toán thống kê theo phòng ban
async function calculateDepartmentStats(month, year) {
  try {
    // Tạo khoảng thời gian
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Sử dụng aggregation để tính toán thống kê
    const stats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: "$employeeData",
      },
      {
        $lookup: {
          from: "departments",
          localField: "employeeData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      {
        $unwind: {
          path: "$departmentData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$departmentData._id",
          departmentName: { $first: "$departmentData.name" },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isAbsent", false] },
                    { $eq: ["$isLeave", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          absent: { $sum: { $cond: [{ $eq: ["$isAbsent", true] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ["$isLeave", true] }, 1, 0] } },
          overtime: { $sum: { $cond: [{ $gt: ["$overtimeHours", 0] }, 1, 0] } },
        },
      },
    ]);

    // Chuyển đổi kết quả thành đối tượng key-value
    const departmentStats = {};
    stats.forEach((stat) => {
      if (stat._id) {
        departmentStats[stat._id.toString()] = {
          name: stat.departmentName || "Chưa phân phòng",
          total: stat.total,
          present: stat.present,
          absent: stat.absent,
          late: stat.late,
          leave: stat.leave,
          overtime: stat.overtime,
        };
      }
    });

    return departmentStats;
  } catch (error) {
    console.error("Error calculating department stats:", error);
    return {};
  }
}

// Cập nhật hàm getAttendanceById
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate({
        path: "employee",
        select: "name employeeCode department position email phone",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate({
        path: "approvedBy",
        select: "name username",
      });

    if (!attendance)
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi chấm công" });

    // Convert to object to add calculated fields
    const attendanceObj = attendance.toObject();

    // Calculate working hours if both check-in and check-out times exist
    if (attendanceObj.checkInTime && attendanceObj.checkOutTime) {
      const checkIn = new Date(attendanceObj.checkInTime);
      const checkOut = new Date(attendanceObj.checkOutTime);
      const diffMs = checkOut - checkIn;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      attendanceObj.workingHours = `${hours}h ${minutes}m`;
      attendanceObj.workingHoursDecimal = parseFloat(
        (diffMs / (1000 * 60 * 60)).toFixed(2)
      );
    }

    // Calculate leave duration if applicable
    if (
      attendanceObj.isLeave &&
      attendanceObj.leaveStartDate &&
      attendanceObj.leaveEndDate
    ) {
      const start = new Date(attendanceObj.leaveStartDate);
      const end = new Date(attendanceObj.leaveEndDate);

      // If leaveDays is not set, calculate it
      if (!attendanceObj.leaveDays) {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        attendanceObj.calculatedLeaveDays = diffDays;
      }
    }

    res.json(attendanceObj);
  } catch (err) {
    console.error("Error in getAttendanceById:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "ID chấm công không hợp lệ" });
    }

    res.status(500).json({
      message: "Lỗi server khi lấy chi tiết chấm công",
      error: err.message,
    });
  }
};

// Cập nhật hàm getAttendancesByEmployee
exports.getAttendancesByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { limit = 10, page = 1, month, year } = req.query;

    // Build the filter
    const filter = { employee: employeeId };

    // Add date filtering for month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // If no month/year specified, default to current month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    console.log("Fetching attendance for employee:", employeeId);
    console.log("Filter criteria:", filter);

    // Count total matching records
    const total = await Attendance.countDocuments(filter);

    // Get the records with pagination và POPULATE ĐẦY ĐỦ
    const attendances = await Attendance.find(filter)
      .populate({
        path: "employee",
        select: "name employeeId department position",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Process records to add calculated fields
    const processedAttendances = attendances.map((record) => {
      const attendance = record.toObject();

      // Add formatted date
      attendance.formattedDate = new Date(attendance.date).toLocaleDateString();

      // Calculate working hours if applicable
      if (attendance.checkInTime && attendance.checkOutTime) {
        const checkIn = new Date(attendance.checkInTime);
        const checkOut = new Date(attendance.checkOutTime);
        const diffMs = checkOut - checkIn;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        attendance.workingHours = `${hours}h ${minutes}m`;
      }

      // Generate remarks based on attendance status
      let remarks = "";
      if (attendance.isLate) remarks += "Đi muộn. ";
      if (attendance.isEarlyDeparture) remarks += "Về sớm. ";
      if (attendance.isLeave)
        remarks += `Nghỉ phép ${attendance.leaveType || ""}: ${
          attendance.leaveReason || "Không có lý do"
        }. `;
      if (attendance.overtimeHours > 0)
        remarks += `Làm thêm: ${attendance.overtimeHours}h (${
          attendance.overtimeReason || "Không có lý do"
        }). `;
      if (attendance.note) remarks += attendance.note;

      attendance.remarks = remarks.trim() || "Chấm công bình thường";

      return attendance;
    });

    res.json({
      data: processedAttendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getAttendancesByEmployee:", err);

    // Handle invalid ID error
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "ID nhân viên không hợp lệ" });
    }

    res.status(500).json({
      message: "Lỗi server khi lấy dữ liệu chấm công của nhân viên",
      error: err.message,
    });
  }
};

// Cập nhật hàm getMonthlyAttendance để có thông tin phòng ban đầy đủ
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Cần cung cấp tháng và năm" });
    }

    // Create date range for selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Sử dụng aggregation để có thống kê chi tiết
    const result = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: "$employeeData",
      },
      {
        $lookup: {
          from: "departments",
          localField: "employeeData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      {
        $unwind: {
          path: "$departmentData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$employee",
          employeeName: { $first: "$employeeData.name" },
          employeeCode: { $first: "$employeeData.employeeCode" },
          department: { $first: "$departmentData.name" },
          departmentId: { $first: "$employeeData.department" },
          daysPresent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isAbsent", false] },
                    { $eq: ["$isLeave", false] },
                    { $ne: ["$checkInTime", null] },
                    { $ne: ["$checkOutTime", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          daysAbsent: { $sum: { $cond: [{ $eq: ["$isAbsent", true] }, 1, 0] } },
          daysLeave: {
            $sum: {
              $cond: [
                { $eq: ["$isLeave", true] },
                1,
                { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] },
              ],
            },
          },
          totalOvertimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] } },
          earlyDepartureCount: {
            $sum: { $cond: [{ $eq: ["$isEarlyDeparture", true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { employeeName: 1 },
      },
    ]);

    // Thống kê theo phòng ban
    const departmentSummary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: "$employeeData",
      },
      {
        $lookup: {
          from: "departments",
          localField: "employeeData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      {
        $unwind: {
          path: "$departmentData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$employeeData.department",
          departmentName: { $first: "$departmentData.name" },
          totalEmployees: { $addToSet: "$employee" },
          daysPresent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isAbsent", false] },
                    { $eq: ["$isLeave", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          daysAbsent: { $sum: { $cond: [{ $eq: ["$isAbsent", true] }, 1, 0] } },
          daysLeave: { $sum: { $cond: [{ $eq: ["$isLeave", true] }, 1, 0] } },
          totalOvertimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          departmentName: 1,
          employeeCount: { $size: "$totalEmployees" },
          daysPresent: 1,
          daysAbsent: 1,
          daysLeave: 1,
          totalOvertimeHours: 1,
        },
      },
      {
        $sort: { departmentName: 1 },
      },
    ]);

    res.json({
      data: result,
      departmentSummary: departmentSummary,
      month,
      year,
    });
  } catch (err) {
    console.error("Error in getMonthlyAttendance:", err);
    res.status(500).json({
      message: "Lỗi server khi lấy thống kê chấm công hàng tháng",
      error: err.message,
    });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate({
        path: "employee",
        select: "name employeeCode department position email phone",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate({
        path: "approvedBy",
        select: "name username",
      });

    if (!attendance)
      return res.status(404).json({ message: "Attendance record not found" });

    // Convert to object to add calculated fields
    const attendanceObj = attendance.toObject();

    // Calculate working hours if both check-in and check-out times exist
    if (attendanceObj.checkInTime && attendanceObj.checkOutTime) {
      const checkIn = new Date(attendanceObj.checkInTime);
      const checkOut = new Date(attendanceObj.checkOutTime);
      const diffMs = checkOut - checkIn;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      attendanceObj.workingHours = `${hours}h ${minutes}m`;
      attendanceObj.workingHoursDecimal = parseFloat(
        (diffMs / (1000 * 60 * 60)).toFixed(2)
      );
    }

    // Calculate leave duration if applicable
    if (
      attendanceObj.isLeave &&
      attendanceObj.leaveStartDate &&
      attendanceObj.leaveEndDate
    ) {
      const start = new Date(attendanceObj.leaveStartDate);
      const end = new Date(attendanceObj.leaveEndDate);

      // If leaveDays is not set, calculate it (useful for validation)
      if (!attendanceObj.leaveDays) {
        // Calculate difference in days
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        attendanceObj.calculatedLeaveDays = diffDays;
      }
    }

    res.json(attendanceObj);
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
