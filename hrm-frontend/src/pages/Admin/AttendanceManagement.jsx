import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";

const AdminAttendance = () => {
  const [adminData, setAdminData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0], // First day of current month
    endDate: new Date().toISOString().split("T")[0], // Today
  });
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);

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

        // Fetch all departments
        const departmentsRes = await axios.get(
          "http://localhost:3000/api/departments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDepartments(departmentsRes.data);

        // Fetch all employees
        const employeesRes = await axios.get(
          "http://localhost:3000/api/employees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployees(employeesRes.data);

        // Fetch attendance records for the current month
        const attendanceRes = await axios.get(
          `http://localhost:3000/api/attendance?startDate=${dateFilter.startDate}&endDate=${dateFilter.endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Ensure attendanceRecords is always an array
        const records = Array.isArray(attendanceRes.data)
          ? attendanceRes.data
          : [];
        setAttendanceRecords(records);
        setFilteredRecords(records);
        setLoading(false);
        console.log("Attendance records loaded:", records);
      } catch (error) {
        handleError(error);
      }
    };

    fetchData();
  }, [navigate, dateFilter.startDate, dateFilter.endDate]);

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

  const handleViewAttendance = (employeeId) => {
    navigate(`/admin/attendance/${employeeId}`);
  };

  const handleExportReport = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `http://localhost:3000/api/attendance/export?startDate=${
          dateFilter.startDate
        }&endDate=${dateFilter.endDate}${
          selectedDepartment ? `&department=${selectedDepartment}` : ""
        }`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance-report-${dateFilter.startDate}-to-${dateFilter.endDate}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("An error occurred while exporting the report. Please try again.");
    }
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    filterRecords(value, selectedDepartment);
  };

  const handleDepartmentFilter = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);

    filterRecords(searchTerm, department);
  };

  const filterRecords = (search, department) => {
    // Ensure attendanceRecords is an array before filtering
    let records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    let filtered = [...records];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((record) => {
        const employee = employees.find((emp) => emp._id === record.employee);
        if (!employee) return false;

        return (
          employee.name.toLowerCase().includes(search.toLowerCase()) ||
          employee.department?.toString().includes(search.toLowerCase()) ||
          record.status.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    // Apply department filter
    if (department) {
      filtered = filtered.filter((record) => {
        const employee = employees.find((emp) => emp._id === record.employee);
        return employee && employee.department?._id === department;
      });
    }

    // Ensure we're setting an array
    setFilteredRecords(filtered);
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp._id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  const getDepartmentName = (departmentId) => {
    const employee = employees.find((emp) => emp._id === departmentId);
    if (!employee) return "Unknown";

    const department = departments.find(
      (dept) => dept._id === employee.department
    );
    return department ? department.name : "Unknown Department";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "status-present";
      case "absent":
        return "status-absent";
      case "late":
        return "status-late";
      case "half-day":
        return "status-half-day";
      case "leave":
        return "status-leave";
      default:
        return "";
    }
  };

  // Count attendance by status for today
  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    // Ensure we're working with an array
    const records = Array.isArray(filteredRecords) ? filteredRecords : [];

    const todayRecords = records.filter(
      (r) => new Date(r.date).toISOString().split("T")[0] === today
    );

    return {
      present: todayRecords.filter((r) => r.status === "present").length,
      absent: todayRecords.filter((r) => r.status === "absent").length,
      late: todayRecords.filter((r) => r.status === "late").length,
      leave: todayRecords.filter((r) => r.status === "leave").length,
    };
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  const todayStats = getTodayStats();
  // Ensure filteredRecords is always an array before rendering
  const recordsToDisplay = Array.isArray(filteredRecords)
    ? filteredRecords
    : [];

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
              className="active"
              onClick={() => navigate("/admin/attendance")}
            >
              Attendance
            </li>
            <li
              className="unactive"
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
            <h2>Attendance Management</h2>
            <div className="filter-container">
              <div className="date-filter">
                <label>From:</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateFilter.startDate}
                  onChange={handleDateFilterChange}
                />
                <label>To:</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateFilter.endDate}
                  onChange={handleDateFilterChange}
                />
              </div>
              <div className="department-filter">
                <select
                  value={selectedDepartment}
                  onChange={handleDepartmentFilter}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Search by employee name or status..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <button className="export-btn" onClick={handleExportReport}>
                📊 Export Report
              </button>
            </div>
          </div>

          <div className="attendance-summary">
            <div className="summary-card">
              <h3>Today's Summary</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Present:</span>
                  <span className="stat-value">{todayStats.present}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Absent:</span>
                  <span className="stat-value">{todayStats.absent}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Late:</span>
                  <span className="stat-value">{todayStats.late}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">On Leave:</span>
                  <span className="stat-value">{todayStats.leave}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="attendance-list">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Work Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recordsToDisplay.length > 0 ? (
                  recordsToDisplay.map((record) => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{getEmployeeName(record.employee)}</td>
                      <td>{getDepartmentName(record.employee)}</td>
                      <td>
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString()
                          : "N/A"}
                      </td>
                      <td>
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString()
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.workHours ? record.workHours.toFixed(2) : "N/A"}
                      </td>
                      <td className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => handleViewAttendance(record.employee)}
                        >
                          👁️
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() =>
                            navigate(`/admin/edit-attendance/${record._id}`)
                          }
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No attendance records found
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

export default AdminAttendance;
