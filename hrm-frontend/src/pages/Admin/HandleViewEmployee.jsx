import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/HandleViewEmployee.css";

const HandleViewEmployee = () => {
  const { employeeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:3000";

  const [employeeData, setEmployeeData] = useState(
    location.state?.employee || null
  );
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        console.log("Fetching employee with ID:", employeeId);

        // Lấy thông tin nhân viên
        const { data } = await axios.get(
          `${API_BASE_URL}/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Employee data received:", data);
        setEmployeeData(data);

        // Lấy thông tin lương mới nhất từ bảng Payroll
        try {
          const payrollRes = await axios.get(
            `${API_BASE_URL}/api/payroll/employee/${employeeId}/latest`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Latest payroll data:", payrollRes.data);
          setPayrollData(payrollRes.data?.data || null);
        } catch (payrollError) {
          console.error("Error fetching payroll data:", payrollError);
          // Không cần set error ở đây, chỉ log lỗi
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching employee:", error);
        setError(
          `Error loading employee: ${
            error.response?.data?.message || error.message
          }`
        );
        setLoading(false);
      }
    };

    // Always fetch fresh data regardless of whether we have state data
    fetchEmployeeData();
  }, [employeeId]);

  if (loading)
    return <div className="loading">Loading employee details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!employeeData)
    return <div className="error-message">No employee data found</div>;

  // Format date of birth if it exists
  const formattedDOB = employeeData.dob
    ? new Date(employeeData.dob).toLocaleDateString()
    : "Not provided";

  // Format start date if it exists
  const formattedStartDate = employeeData.startDate
    ? new Date(employeeData.startDate).toLocaleDateString()
    : "Not provided";

  // Create full avatar URL
  const avatarUrl = employeeData.avatar
    ? `${API_BASE_URL}/${employeeData.avatar}`
    : null;

  return (
    <div className="employee-details-container">
      <h1>Employee Details</h1>

      <div className="employee-details">
        <p>
          <strong>Name:</strong> {employeeData.name}
        </p>
        <p>
          <strong>Date Of Birth:</strong> {formattedDOB}
        </p>
        <p>
          <strong>Gender:</strong> {employeeData.gender}
        </p>
        <p>
          <strong>Address:</strong> {employeeData.address || "Not provided"}
        </p>
        <p>
          <strong>Phone:</strong> {employeeData.phone || "Not provided"}
        </p>
        <p>
          <strong>Email:</strong> {employeeData.email || "Not provided"}
        </p>
        <p>
          <strong>Department:</strong>{" "}
          {employeeData.department || "Not Updated"}
        </p>
        <p>
          <strong>Position:</strong> {employeeData.position || "Not Updated"}
        </p>
        <p>
          <strong>Salary:</strong>{" "}
          {payrollData?.baseSalary
            ? payrollData.baseSalary.toLocaleString("vi-VN") + " VND"
            : "Not Updated"}
        </p>
        <p>
          <strong>Start Date:</strong> {formattedStartDate}
        </p>
        <p>
          <strong>Avatar:</strong>
          {avatarUrl && (
            <div className="employee-avatar">
              <img
                src={avatarUrl}
                alt={`${employeeData.name}'s avatar`}
                style={{ width: "500px", height: "500px" }}
              />
            </div>
          )}
        </p>
      </div>

      <button
        className="back-button"
        onClick={() => navigate("/admin-dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default HandleViewEmployee;
