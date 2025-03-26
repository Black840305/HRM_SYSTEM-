// 📌 Lấy tất cả thông báo
const employeeModel = require("../models/employeeModel");
const Notifications = require("../models/notificationModel");
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notifications.find()
      .populate("recipients", "name email") // Lấy thông tin người nhận
      .populate("department", "name"); // Lấy tên phòng ban

    const result = notifications.map((n) => ({
      _id: n._id,
      title: n.title || "Chưa cập nhật",
      message: n.message || "Chưa cập nhật",
      recipients: n.recipients,
      department: n.department || null,
      urgency: n.urgency,
      status: n.status,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    return res.json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông báo:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông báo" });
  }
};

const getNotificationsForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Fetch employee information to get their department
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Find notifications that are either:
    // 1. Directly sent to this employee, or
    // 2. Sent to the employee's department
    const notifications = await Notifications.find({
      $and: [
        { status: "active" }, // Only active notifications
        {
          $or: [
            { recipients: { $in: [employeeId] } }, // Direct recipient
            { department: employee.department }, // Department-wide notification
          ],
        },
      ],
    })
      .populate("recipients", "name email") // Populate recipient details
      .populate("department", "name") // Populate department details
      .sort({ createdAt: -1 }); // Sort by most recent first

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications for employee:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};
// 📌 Lấy thông báo theo ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notifications.findById(req.params.id)
      .populate("recipients", "name email")
      .populate("department", "name");

    if (!notification)
      return res.status(404).json({ msg: "Không tìm thấy thông báo" });

    res.json(notification);
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông báo:", err);
    res.status(500).json({ msg: "Lỗi server khi lấy thông báo" });
  }
};

const getNotificationsForDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Kiểm tra xem departmentId có phải là null hoặc không hợp lệ không
    if (!departmentId || departmentId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // Lấy tất cả thông báo dành cho phòng ban cụ thể
    const notifications = await Notifications.find({
      $or: [
        { department: departmentId }, // Thông báo cho cả phòng ban
        { recipients: { $exists: false } }, // Thông báo không chỉ định người nhận
      ],
      status: "active", // Chỉ lấy thông báo đang hoạt động
    })
      .populate("recipients", "name email") // Lấy thông tin người nhận
      .populate("department", "name") // Lấy tên phòng ban
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications for department:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};
// 📌 Tạo mới thông báo
const createNotification = async (req, res) => {
  const { title, message, recipients, department, urgency, status } = req.body;

  try {
    const newNotification = new Notifications({
      title,
      message,
      recipients: recipients ? recipients.map((id) => id) : [],
      department: department || null,
      urgency: urgency || "medium",
      status: status || "active",
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) {
    console.error("❌ Lỗi khi tạo thông báo:", err);
    res.status(500).json({ msg: "Lỗi server khi tạo thông báo" });
  }
};

// 📌 Cập nhật thông báo
const updateNotification = async (req, res) => {
  const { title, message, recipients, targetDepartment, urgency, status } =
    req.body;

  try {
    const notification = await Notifications.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ msg: "Không tìm thấy thông báo" });

    notification.title = title || notification.title;
    notification.message = message || notification.message;
    notification.recipients = recipients
      ? recipients.map((id) => id)
      : notification.recipients;
    notification.targetDepartment =
      targetDepartment || notification.targetDepartment;
    notification.urgency = urgency || notification.urgency;
    notification.status = status || notification.status;

    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật thông báo:", err);
    res.status(500).json({ msg: "Lỗi server khi cập nhật thông báo" });
  }
};

// 📌 Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notifications.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ msg: "Không tìm thấy thông báo" });

    await notification.deleteOne();
    res.json({ msg: "Thông báo đã được xóa" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa thông báo:", err);
    res.status(500).json({ msg: "Lỗi server khi xóa thông báo" });
  }
};

// Xuất các hàm
module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getNotificationsForEmployee,
  getNotificationsForDepartment,
};
