import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";

const DepartmentEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { departmentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return navigate("/");
      }

      try {
        // Lấy thông tin phòng ban
        const deptRes = await axios.get(
          `http://localhost:3000/api/departments/${departmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDepartment(deptRes.data);

        // Lấy danh sách nhân viên thuộc phòng ban
        const empRes = await axios.get(
          `http://localhost:3000/api/departments/${departmentId}/employees`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployees(empRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          `Error loading data: ${error.response?.data?.msg || error.message}`
        );
        setLoading(false);

        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/");
        }
      }
    };

    fetchData();
  }, [departmentId, navigate]);

  const handleBackToList = () => {
    navigate("/admin/departments");
  };

  const handleAddEmployee = () => {
    navigate(`/admin/employee/add?departmentId=${departmentId}`);
  };

  const handleEditEmployee = (employeeId) => {
    navigate(`/admin/employee/${employeeId}/edit`);
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 onClick={() => navigate("/admin-dashboard")}>Admin Dashboard</h1>
        <div className="admin-info">
          <button
            className="logout-btn"
            onClick={() => navigate("/admin/departments")}
          >
            ⬅️ Back to Departments
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="department-info">
          <h2>{department?.name} - Employee List</h2>
          <div className="department-details">
            <p>
              <strong>Description:</strong>{" "}
              {department?.description || "Not set"}
            </p>
            <p>
              <strong>Manager:</strong>{" "}
              {department?.manager?.name || "Not assigned"}
            </p>
            <p>
              <strong>Location:</strong> {department?.location || "Not set"}
            </p>
            <p>
              <strong>Budget:</strong>{" "}
              {department?.budget?.toLocaleString("vi-VN") || "0"} VND
            </p>
            <p>
              <strong>Total Employees:</strong> {employees.length}
            </p>
          </div>
        </div>

        <div className="admin-actions">
          <button className="add-employee-btn" onClick={handleAddEmployee}>
            + Add Employee to Department
          </button>
        </div>

        <div className="employee-list">
          {employees.length === 0 ? (
            <div className="no-data">No employees in this department</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Position</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone || "Not set"}</td>
                    <td>{emp.position || "Not set"}</td>
                    <td>
                      {emp.joinDate
                        ? new Date(emp.joinDate).toLocaleDateString("vi-VN")
                        : "Not set"}
                    </td>
                    <td className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/admin/employee/${emp._id}`)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditEmployee(emp._id)}
                        title="Edit Employee"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentEmployees;
