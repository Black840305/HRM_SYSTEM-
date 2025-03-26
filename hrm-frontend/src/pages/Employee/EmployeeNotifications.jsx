import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Notifications.css"; // Create this CSS file for styling

const EmployeeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      const employeeId = localStorage.getItem("employeeId");

      if (!token || !employeeId) {
        console.log("No token or employeeId found, redirecting to login.");
        return navigate("/");
      }

      try {
        // First, fetch employee details to get department
        const employeeResponse = await axios.get(
          `http://localhost:3000/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const departmentId =
          employeeResponse.data.department?._id ||
          employeeResponse.data.department;

        if (!departmentId) {
          throw new Error("No department found for this employee");
        }

        // Fetch notifications for the specific department
        const notificationsResponse = await axios.get(
          `http://localhost:3000/api/notifications/employee/${employeeId}`, // Make sure this matches your backend route exactly
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Sort notifications by date, most recent first
        const sortedNotifications = notificationsResponse.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(sortedNotifications);
        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const handleError = (error) => {
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    setError(
      `Error loading notifications: ${
        error.response?.data?.message || error.message
      }`
    );
    setLoading(false);

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("employeeId");
      navigate("/");
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:3000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state to mark notification as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="employee-notifications">
      <div className="notifications-header">
        <h1>Department Notifications</h1>
        <button
          className="back-to-dashboard"
          onClick={() => navigate("/employee-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications at this time.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${
                notification.isRead ? "read" : "unread"
              }`}
            >
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  <span className="notification-date">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeNotifications;
