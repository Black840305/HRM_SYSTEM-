import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css"; // Ensure you have this CSS file

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
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
        console.log(
          "Fetching admin data with token:",
          token.substring(0, 10) + "..."
        );

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

        // Fetch all employees
        const employeesRes = await axios.get(
          "http://localhost:3000/api/employees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Filter out admin from the employee list
        const filteredEmployees = employeesRes.data.filter(
          (emp) => emp._id !== data.employeeId
        );
        setEmployees(filteredEmployees);
        setFilteredEmployees(filteredEmployees); // Initialize filtered list

        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchAdminData();
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

  // In AdminDashboard.js
  const handleViewEmployee = (employeeId) => {
    const selectedEmployee = employees.find((emp) => emp._id == employeeId);
    navigate(`/admin/employee/${employeeId}`, {
      state: { employee: selectedEmployee },
    });
  };

  const handleAddEmployee = () => {
    navigate("/admin/add-employee");
  };

  const handleEditEmployee = (employeeId) => {
    navigate(`/admin/edit-employee/${employeeId}`);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:3000/api/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update employee list after deletion
      setEmployees(employees.filter((emp) => emp._id !== employeeId));
      setFilteredEmployees(
        filteredEmployees.filter((emp) => emp._id !== employeeId)
      );

      alert("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("An error occurred while deleting the employee. Please try again.");
    }
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Filter employees based on search term
    const filtered = employees.filter((emp) =>
      `${emp.name} ${emp.email} ${emp.department} ${emp.position}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 onClick={() => navigate("/admin-dashboard")}>Admin DashBoard</h1>
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
            <li className="active" onClick={() => navigate("/admin-dashboard")}>
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
            <h2>Manage Employees</h2>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button className="add-employee-btn" onClick={handleAddEmployee}>
              + Add New Employee
            </button>
          </div>

          <div className="employee-list">
            <table>
              <thead>
                <tr>
                  {/* <th>ID</th> */}
                  <th>Name</th>
                  {/* <th>Date of Birth</th> */}
                  <th>Gender</th>
                  {/* <th>Address</th>
                  <th>Phone</th> */}
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Salary</th>
                  <th>Start Date</th>
                  {/* <th>Avatar</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    {/* <td>{emp._id.substring(0, 6)}...</td> */}
                    <td>{emp.name}</td>
                    <td>{emp.gender}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position || "Not Updated"}</td>
                    <td>
                      {emp.salary?.toLocaleString("vi-VN") || "Not Updated"} VND
                    </td>
                    <td>{emp.startDate}</td>
                    <td className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewEmployee(emp._id)}
                      >
                        👁️
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditEmployee(emp._id)}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteEmployee(emp._id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
