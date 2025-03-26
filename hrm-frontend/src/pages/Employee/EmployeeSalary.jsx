import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/EmployeeDashboard.css"; // Sử dụng CSS hiện có

const Salary = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalaryData = async () => {
      const token = localStorage.getItem("token");
      const employeeId = localStorage.getItem("employeeId");

      if (!token || !employeeId) {
        console.log("No token or employeeId found, redirecting to login.");
        return navigate("/");
      }

      try {
        // Fetch employee info
        const { data } = await axios.get(
          `http://localhost:3000/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployeeData(data);

        // Fetch latest salary details
        const salaryRes = await axios.get(
          `http://localhost:3000/api/payroll/employee/${employeeId}/latest`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSalaryDetails(salaryRes.data.data || salaryRes.data);

        // Fetch salary history
        const historyRes = await axios.get(
          `http://localhost:3000/api/payroll/employee/${employeeId}/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSalaryHistory(historyRes.data.data || historyRes.data || []);

        // Set default selected month to the most recent
        if (historyRes.data.data && historyRes.data.data.length > 0) {
          setSelectedMonth(historyRes.data.data[0].month);
        }

        setLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchSalaryData();
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

  const handleBack = () => {
    navigate("/employee-dashboard");
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString("vi-VN") + " VND";
  };

  const getSelectedSalaryDetails = () => {
    if (!selectedMonth || salaryHistory.length === 0) return null;
    return salaryHistory.find(
      (salary) =>
        salary.month === selectedMonth || salary.payPeriod === selectedMonth
    );
  };

  const renderSalaryBreakdown = (salary) => {
    if (!salary) return <p>No salary data available for selected month</p>;

    return (
      <div className="salary-breakdown">
        <div className="salary-item">
          <span>Base Salary:</span>
          <span>{formatCurrency(salary.baseSalary)}</span>
        </div>

        {salary.overtimePay !== undefined && (
          <div className="salary-item">
            <span>Overtime Pay:</span>
            <span>{formatCurrency(salary.overtimePay)}</span>
          </div>
        )}

        {salary.bonus !== undefined && (
          <div className="salary-item">
            <span>Bonus:</span>
            <span>{formatCurrency(salary.bonus)}</span>
          </div>
        )}

        {salary.allowances !== undefined && (
          <div className="salary-item">
            <span>Allowances:</span>
            <span>{formatCurrency(salary.allowances)}</span>
          </div>
        )}

        {salary.deductions !== undefined && (
          <div className="salary-item negative">
            <span>Deductions:</span>
            <span>-{formatCurrency(salary.deductions)}</span>
          </div>
        )}

        {salary.tax !== undefined && (
          <div className="salary-item negative">
            <span>Tax:</span>
            <span>-{formatCurrency(salary.tax)}</span>
          </div>
        )}

        <div className="salary-item total">
          <span>Net Salary:</span>
          <span>{formatCurrency(salary.netSalary)}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading data...</div>;

  if (error) return <div className="error-message">{error}</div>;

  const selectedSalary = getSelectedSalaryDetails();

  return (
    <div className="employee-dashboard">
      <div className="employee-header">
        <h1>Salary Information</h1>
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
            <li onClick={() => navigate("/employee/attendance")}>Attendance</li>
            <li className="active">Salary</li>
            <li onClick={() => navigate("/employee/notifications")}>
              Notifications
            </li>
          </ul>
        </div>

        <div className="employee-main">
          <div className="salary-overview">
            <h2>Current Salary Information</h2>
            <div className="salary-basic-info">
              <p>
                <strong>Position:</strong> {employeeData?.position}
              </p>
              <p>
                <strong>Department:</strong>{" "}
                {employeeData?.department?.name || employeeData?.department}
              </p>
              <p>
                <strong>Base Salary:</strong>{" "}
                {salaryDetails?.baseSalary
                  ? formatCurrency(salaryDetails.baseSalary)
                  : "Not available"}
              </p>
            </div>
          </div>

          <div className="salary-history-section">
            <h2>Salary History</h2>

            <div className="month-selector">
              <label htmlFor="month-select">Select Pay Period:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {salaryHistory.length === 0 ? (
                  <option value="">No salary records available</option>
                ) : (
                  salaryHistory.map((salary, index) => (
                    <option
                      key={index}
                      value={salary.month || salary.payPeriod}
                    >
                      {salary.month || salary.payPeriod}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="salary-details-card">
              <h3>Salary Breakdown for {selectedMonth}</h3>
              {renderSalaryBreakdown(selectedSalary)}

              {selectedSalary && selectedSalary.remarks && (
                <div className="salary-remarks">
                  <h4>Remarks:</h4>
                  <p>{selectedSalary.remarks}</p>
                </div>
              )}
            </div>
          </div>

          <div className="salary-info-box">
            <h3>Salary Policy Information</h3>
            <ul>
              <li>
                Salary is calculated based on attendance, performance, and
                position level.
              </li>
              <li>
                Overtime is paid at 1.5x normal rate for weekdays and 2x for
                weekends/holidays.
              </li>
              <li>Salary is paid on the 5th of each month.</li>
              <li>
                For any payment discrepancies, please contact HR department.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salary;
