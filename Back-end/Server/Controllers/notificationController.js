// 📌 Lấy tất cả thông báo
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

// 📌 Lấy thông báo theo ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notifications.findById(req.params.id)
      .populate("recipients", "name email")
      .populate("targetDepartment", "name");

    if (!notification)
      return res.status(404).json({ msg: "Không tìm thấy thông báo" });

    res.json(notification);
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông báo:", err);
    res.status(500).json({ msg: "Lỗi server khi lấy thông báo" });
  }
};

// 📌 Tạo mới thông báo
const createNotification = async (req, res) => {
  const { title, message, recipients, targetDepartment, urgency, status } =
    req.body;

  try {
    const newNotification = new Notifications({
      title,
      message,
      recipients: recipients ? recipients.map((id) => id) : [],
      targetDepartment: targetDepartment || null,
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
};
