import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/EmployeeDashboard.css"; // Ensure you have this CSS file

const EmployeeDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token found, redirecting to login.");
        return navigate("/");
      }

      try {
        // First verify authentication using api/auth/me
        const authResponse = await axios.get(
          "http://localhost:3000/api/auth/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!authResponse.data?.employeeId) {
          console.error("Invalid employeeId:", authResponse.data.employeeId);
          return navigate("/");
        }

        const employeeId = authResponse.data.employeeId;
        // Save employeeId to localStorage for future use
        localStorage.setItem("employeeId", employeeId);

        // Fetch employee info
        const { data } = await axios.get(
          `http://localhost:3000/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployeeData(data);

        // Fetch attendance records
        const attendanceRes = await axios.get(
          `http://localhost:3000/api/attendance/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Check the structure of the response and handle appropriately
        setAttendanceRecords(attendanceRes.data.data || attendanceRes.data);

        // Fetch salary details
        const salaryRes = await axios.get(
          `http://localhost:3000/api/payroll/employee/${employeeId}/latest`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSalaryDetails(salaryRes.data.data); // Access .data property from the response

        // Fetch notifications
        // const notificationsRes = await axios.get(
        //   `http://localhost:3000/api/notifications/${employeeId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );
        // setNotifications(notificationsRes.data);

        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchEmployeeData();
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
      localStorage.removeItem("employeeId");
      navigate("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");
    navigate("/");
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="employee-dashboard">
      <div className="employee-header">
        <h1>Employee Dashboard</h1>
        <div className="employee-info">
          <span>Welcome, {employeeData?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="employee-content">
        <div className="employee-sidebar">
          <h3>Personal Info</h3>
          <ul>
            <li onClick={() => navigate("/employee-profile")}>View Profile</li>
            <li onClick={() => navigate("/employee/attendance")}>Attendance</li>
            <li onClick={() => navigate("/employee/salary")}>Salary</li>
            <li onClick={() => navigate("/employee/notifications")}>
              Notifications
            </li>
          </ul>
        </div>

        <div className="employee-main">
          <h2>Your Information</h2>
          <p>
            <strong>Name:</strong> {employeeData?.name}
          </p>
          <p>
            <strong>Email:</strong> {employeeData?.email}
          </p>
          <p>
            <strong>Department:</strong>{" "}
            {employeeData?.department?.name || employeeData?.department}
          </p>
          <p>
            <strong>Position:</strong> {employeeData?.position}
          </p>
          <p>
            <strong>Salary:</strong>{" "}
            {salaryDetails
              ? `${salaryDetails.baseSalary?.toLocaleString("vi-VN")} VND`
              : "Not available"}
          </p>

          <h2>Attendance Records</h2>
          {attendanceRecords.length === 0 ? (
            <p>No attendance records found for this month.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords?.map((record) => (
                  <tr key={record?._id}>
                    <td>{new Date(record?.date).toLocaleDateString()}</td>
                    <td>
                      {record?.checkInTime
                        ? new Date(record?.checkInTime).toLocaleTimeString()
                        : "N/A"}
                    </td>
                    <td>
                      {record?.checkOutTime
                        ? new Date(record?.checkOutTime).toLocaleTimeString()
                        : "N/A"}
                    </td>
                    <td>{record?.workingHours || "N/A"}</td>
                    <td>{record?.status}</td>
                    <td>{record?.remarks || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Notifications</h2>
          {/* {notifications.length === 0 ? (
            <p>No notifications at this time.</p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification._id}>
                  {notification.message} -{" "}
                  {new Date(notification.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
