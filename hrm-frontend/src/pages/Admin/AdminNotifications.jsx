import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminNotifications.css";

const AdminNotifications = () => {
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        console.log("No token found, redirecting to login.");
        return navigate("/");
      }

      if (role !== "admin") {
        console.log("Not an admin, redirecting to user profile.");
        return navigate("/employee-profile");
      }

      try {
        // Fetch admin info
        const { data } = await axios.get("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!data?.employeeId) {
          console.error("Invalid employeeId:", data.employeeId);
          return navigate("/");
        }

        // Fetch admin details
        const adminRes = await axios.get(
          `http://localhost:3000/api/employees/${data.employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAdminData(adminRes.data);

        // Fetch all notifications
        const notificationsRes = await axios.get(
          "http://localhost:3000/api/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setNotifications(notificationsRes.data);
        setFilteredNotifications(notificationsRes.data);
        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchData();
  }, [navigate]);

  const handleError = (error) => {
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    setError(
      `Error loading data: ${error.response?.data?.message || error.message}`
    );
    setLoading(false);

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Filter notifications based on search term
    const filtered = notifications.filter((notification) => {
      const deptName =
        notification.department && notification.department.name
          ? notification.department.name
          : "All Departments";

      return `${notification.title} ${notification.message} ${deptName}`
        .toLowerCase()
        .includes(value.toLowerCase());
    });
    setFilteredNotifications(filtered);
  };

  const handleAddNotification = () => {
    navigate("/admin/add-notification");
  };

  const handleEditNotification = (notificationId) => {
    navigate(`/admin/edit-notification/${notificationId}`);
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `http://localhost:3000/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update notification list after deletion
      setNotifications(
        notifications.filter(
          (notification) => notification._id !== notificationId
        )
      );
      setFilteredNotifications(
        filteredNotifications.filter(
          (notification) => notification._id !== notificationId
        )
      );

      alert("Notification deleted successfully!");
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert(
        "An error occurred while deleting the notification. Please try again."
      );
    }
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 onClick={() => navigate("/admin-dashboard")}>Admin Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, {adminData?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          <h3>Management</h3>
          <ul>
            <li
              className="unactive"
              onClick={() => navigate("/admin-dashboard")}
            >
              Employees
            </li>
            <li
              className="unactive"
              onClick={() => navigate("/admin/departments")}
            >
              Departments
            </li>
            <li className="unactive" onClick={() => navigate("/admin/salary")}>
              Salary & Benefits
            </li>
            <li
              className="unactive"
              onClick={() => navigate("/admin/attendance")}
            >
              Attendance
            </li>
            <li
              className="active"
              onClick={() => navigate("/admin/notifications")}
            >
              Notifications
            </li>
            <li className="unactive" onClick={() => navigate("/admin/Leave")}>
              Leave
            </li>
            <li className="unactive" onClick={() => navigate("/admin/reports")}>
              Reports
            </li>
            <li
              className="unactive"
              onClick={() => navigate("/admin/settings")}
            >
              Settings
            </li>
          </ul>

          <div className="admin-profile">
            <h3>Personal Info</h3>
            <button onClick={() => navigate("/admin/profile")}>
              View Profile
            </button>
          </div>
        </div>

        <div className="admin-main">
          <div className="admin-actions">
            <h2>Manage Notifications</h2>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button
              className="add-notification-btn"
              onClick={handleAddNotification}
            >
              + Add New Notification
            </button>
          </div>

          <div className="notification-list">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Target Department</th>
                  <th>Date Created</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <tr
                      key={notification._id}
                      className={`urgency-${notification.urgency || "medium"}`}
                    >
                      <td>{notification.title}</td>
                      <td className="message-cell">
                        {notification.message.length > 50
                          ? `${notification.message.substring(0, 50)}...`
                          : notification.message}
                      </td>
                      <td>
                        {notification.department
                          ? notification.department.name
                          : "All Departments"}
                      </td>
                      <td>
                        {new Date(notification.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                      <td>
                        <span
                          className={`urgency-badge ${
                            notification.urgency || "medium"
                          }`}
                        >
                          {notification.urgency || "medium"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            notification.status || "active"
                          }`}
                        >
                          {notification.status || "active"}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() =>
                            navigate(`/admin/notification/${notification._id}`)
                          }
                        >
                          👁️
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEditNotification(notification._id)
                          }
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteNotification(notification._id)
                          }
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
