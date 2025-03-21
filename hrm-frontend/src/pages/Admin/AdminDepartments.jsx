import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css"; // Using the same CSS file

const DepartmentManagement = () => {
  const [adminData, setAdminData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manager: "",
    location: "",
    budget: 0,
  });
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
        setFilteredDepartments(departmentsRes.data);
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

    const filtered = departments.filter((dept) =>
      `${dept.name} ${dept.description} ${dept.manager}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredDepartments(filtered);
  };

  const handleAddDepartment = () => {
    setFormData({
      name: "",
      description: "",
      manager: "",
      location: "",
      budget: 0,
    });
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleEditDepartment = (department) => {
    setCurrentDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      manager: department.manager?._id || department.manager || "", // Xử lý cả trường hợp manager
      location: department.location || "",
      budget: department.budget || 0,
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `http://localhost:3000/api/departments/${departmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update department list after deletion
      setDepartments(departments.filter((dept) => dept._id !== departmentId));
      setFilteredDepartments(
        filteredDepartments.filter((dept) => dept._id !== departmentId)
      );

      alert("Department deleted successfully!");
    } catch (error) {
      console.error("Error deleting department:", error);
      alert(
        "An error occurred while deleting the department. Please try again."
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "budget" ? parseFloat(value) : value,
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      if (showAddForm) {
        // Create new department
        const response = await axios.post(
          "http://localhost:3000/api/departments",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setDepartments([...departments, response.data]);
        setFilteredDepartments([...filteredDepartments, response.data]);
        alert("Department added successfully!");
      } else if (showEditForm && currentDepartment) {
        // Update existing department
        const response = await axios.put(
          `http://localhost:3000/api/departments/${currentDepartment._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedDepartments = departments.map((dept) =>
          dept._id === currentDepartment._id ? response.data : dept
        );
        setDepartments(updatedDepartments);
        setFilteredDepartments(
          filteredDepartments.map((dept) =>
            dept._id === currentDepartment._id ? response.data : dept
          )
        );
        alert("Department updated successfully!");
      }

      // Reset form and state
      setShowAddForm(false);
      setShowEditForm(false);
      setCurrentDepartment(null);
      setFormData({
        name: "",
        description: "",
        manager: "",
        location: "",
        budget: 0,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleViewEmployees = (departmentId) => {
    navigate(`/admin/department/${departmentId}/employees`);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setCurrentDepartment(null);
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
            <li
              className="unactive"
              onClick={() => navigate("/admin-dashboard")}
            >
              Employees
            </li>
            <li
              className="active"
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
            <h2>Manage Departments</h2>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button className="add-employee-btn" onClick={handleAddDepartment}>
              + Add New Department
            </button>
          </div>

          {(showAddForm || showEditForm) && (
            <div className="form-container">
              <h3>{showAddForm ? "Add New Department" : "Edit Department"}</h3>
              <form onSubmit={handleSubmitForm}>
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                  />
                </div>
                {/* <div className="form-group">
                  <label>Manager</label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleFormChange}
                  />
                </div> */}
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Budget (VND)</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">
                    {showAddForm ? "Add Department" : "Update Department"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="employee-list">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  {/* <th>Manager</th> */}
                  <th>Location</th>
                  <th>Budget (VND)</th>
                  <th>Employee Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => (
                  <tr key={dept._id}>
                    <td>{dept.name}</td>
                    <td>{dept.description || "Not set"}</td>
                    {/* <td>{dept.manager?.name || "Not assigned"}</td>{" "} */}
                    {/* Xử lý hiển thị tên manager nếu đã populate */}
                    <td>{dept.location || "Not set"}</td>
                    <td>{dept.budget?.toLocaleString("vi-VN") || "0"} VND</td>
                    <td>{dept.employeeCount || 0}</td>
                    <td className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewEmployees(dept._id)}
                        title="View Employees"
                      >
                        👥
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditDepartment(dept)}
                        title="Edit Department"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDepartment(dept._id)}
                        title="Delete Department"
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

export default DepartmentManagement;
