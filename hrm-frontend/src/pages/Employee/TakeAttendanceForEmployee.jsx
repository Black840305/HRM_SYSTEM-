import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/EmployeeDashboard.css"; // Sử dụng CSS hiện có

const TakeAttendanceForEmployee = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeAndAttendance = async () => {
      const token = localStorage.getItem("token");
      const employeeId = localStorage.getItem("employeeId");

      if (!token || !employeeId) {
        return navigate("/");
      }

      try {
        // Fetch employee info
        const { data: employeeResponse } = await axios.get(
          `http://localhost:3000/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployeeData(employeeResponse);

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split("T")[0];

        // Check if there's attendance record for today
        try {
          const { data: attendanceResponse } = await axios.get(
            `http://localhost:3000/api/attendance/employee/${employeeId}/date/${today}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (attendanceResponse.data) {
            setTodayAttendance(attendanceResponse.data);
            setCheckedIn(!!attendanceResponse.data.checkInTime);
            setCheckedOut(!!attendanceResponse.data.checkOutTime);
          }
        } catch (attendanceError) {
          // If no record found, it's okay
          if (attendanceError.response?.status !== 404) {
            throw attendanceError;
          }
        }

        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchEmployeeAndAttendance();
  }, [navigate]);

  const handleCheckIn = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const employeeId = localStorage.getItem("employeeId");

    try {
      const { data } = await axios.post(
        "http://localhost:3000/api/attendance/check-in",
        { employeeId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setTodayAttendance(data.data);
        setCheckedIn(true);
        setMessage("Successfully checked in!");
      }
    } catch (error) {
      setMessage(
        `Check-in failed: ${error.response?.data?.message || error.message}`
      );
      console.error("Check-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const employeeId = localStorage.getItem("employeeId");

    try {
      const { data } = await axios.post(
        "http://localhost:3000/api/attendance/check-out",
        { employeeId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setTodayAttendance(data.data);
        setCheckedOut(true);
        setMessage("Successfully checked out!");
      }
    } catch (error) {
      setMessage(
        `Check-out failed: ${error.response?.data?.message || error.message}`
      );
      console.error("Check-out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    console.error("Error details:", error);
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

  const handleBack = () => {
    navigate("/employee-dashboard");
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="employee-dashboard">
      <div className="employee-header">
        <h1>Attendance Management</h1>
        <div className="employee-info">
          <span>Welcome, {employeeData?.name}</span>
          <button className="back-btn" onClick={handleBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="employee-content">
        <div className="employee-sidebar">
          <h3>Navigation</h3>
          <ul>
            <li onClick={() => navigate("/employee-dashboard")}>Dashboard</li>
            <li onClick={() => navigate("/employee-profile")}>View Profile</li>
            <li className="active">Attendance</li>
            <li onClick={() => navigate("/employee/salary")}>Salary</li>
            <li onClick={() => navigate("/employee/notifications")}>
              Notifications
            </li>
          </ul>
        </div>

        <div className="employee-main">
          <div className="attendance-card">
            <h2>Today's Attendance</h2>
            <div className="attendance-time-display">
              <p>Current Time: {getCurrentTime()}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="attendance-status">
              {todayAttendance ? (
                <div>
                  <p>
                    <strong>Check-In Time:</strong>{" "}
                    {todayAttendance.checkInTime
                      ? new Date(
                          todayAttendance.checkInTime
                        ).toLocaleTimeString()
                      : "Not checked in yet"}
                  </p>
                  <p>
                    <strong>Check-Out Time:</strong>{" "}
                    {todayAttendance.checkOutTime
                      ? new Date(
                          todayAttendance.checkOutTime
                        ).toLocaleTimeString()
                      : "Not checked out yet"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {todayAttendance.status || "Pending"}
                  </p>
                </div>
              ) : (
                <p>No attendance record for today yet.</p>
              )}
            </div>

            {message && <div className="message-alert">{message}</div>}

            <div className="attendance-actions">
              <button
                className="check-in-btn"
                onClick={handleCheckIn}
                disabled={checkedIn}
              >
                Check In
              </button>
              <button
                className="check-out-btn"
                onClick={handleCheckOut}
                disabled={!checkedIn || checkedOut}
              >
                Check Out
              </button>
            </div>
          </div>

          <div className="attendance-info">
            <h3>Attendance Instructions</h3>
            <ul>
              <li>Check-in should be done at the start of your work day.</li>
              <li>Check-out is required before leaving work.</li>
              <li>
                If you forget to check in/out, please contact your manager or
                HR.
              </li>
              <li>
                Regular attendance is important for your performance evaluation.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeAttendanceForEmployee;
