import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";

const SalaryManagement = () => {
  const [adminData, setAdminData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    baseSalary: 0,
    allowances: [],
    bonuses: [],
    deductions: [],
    effectiveDate: "",
    note: "",
  });
  const [showHistory, setShowHistory] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [newAllowance, setNewAllowance] = useState({
    type: "",
    amount: 0,
    description: "",
  });
  const [newBonus, setNewBonus] = useState({
    type: "",
    amount: 0,
    description: "",
  });
  const [newDeduction, setNewDeduction] = useState({
    type: "",
    amount: 0,
    description: "",
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

        // Fetch all employees with their salary details
        const employeesRes = await axios.get(
          "http://localhost:3000/api/employees?includeSalary=true",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setEmployees(employeesRes.data);
        setFilteredEmployees(employeesRes.data);
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

    const filtered = employees.filter((emp) =>
      `${emp.name} ${emp.email} ${emp.position}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleAdjustSalary = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      baseSalary: employee.salary || 0,
      allowances: employee.allowances || [],
      bonuses: employee.bonuses || [],
      deductions: employee.deductions || [],
      effectiveDate: new Date().toISOString().split("T")[0],
      note: "",
    });
    setShowAdjustForm(true);
    setShowHistory(false);
  };

  const handleViewHistory = async (employee) => {
    setCurrentEmployee(employee);
    setShowAdjustForm(false);
    setShowHistory(true);

    const token = localStorage.getItem("token");

    try {
      const historyRes = await axios.get(
        `http://localhost:3000/api/employees/${employee._id}/salary-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSalaryHistory(historyRes.data);
    } catch (error) {
      console.error("Error fetching salary history:", error);
      alert(
        "An error occurred while fetching salary history. Please try again."
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "note" ? value : parseFloat(value) || 0,
    });
  };

  // Handlers for allowances
  const handleAllowanceChange = (e) => {
    const { name, value } = e.target;
    setNewAllowance({
      ...newAllowance,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    });
  };

  const addAllowance = () => {
    if (newAllowance.type && newAllowance.amount > 0) {
      setFormData({
        ...formData,
        allowances: [...formData.allowances, { ...newAllowance }],
      });
      setNewAllowance({ type: "", amount: 0, description: "" });
    }
  };

  const removeAllowance = (index) => {
    const updatedAllowances = [...formData.allowances];
    updatedAllowances.splice(index, 1);
    setFormData({ ...formData, allowances: updatedAllowances });
  };

  // Handlers for bonuses
  const handleBonusChange = (e) => {
    const { name, value } = e.target;
    setNewBonus({
      ...newBonus,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    });
  };

  const addBonus = () => {
    if (newBonus.type && newBonus.amount > 0) {
      setFormData({
        ...formData,
        bonuses: [...formData.bonuses, { ...newBonus }],
      });
      setNewBonus({ type: "", amount: 0, description: "" });
    }
  };

  const removeBonus = (index) => {
    const updatedBonuses = [...formData.bonuses];
    updatedBonuses.splice(index, 1);
    setFormData({ ...formData, bonuses: updatedBonuses });
  };

  // Handlers for deductions
  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setNewDeduction({
      ...newDeduction,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    });
  };

  const addDeduction = () => {
    if (newDeduction.type && newDeduction.amount > 0) {
      setFormData({
        ...formData,
        deductions: [...formData.deductions, { ...newDeduction }],
      });
      setNewDeduction({ type: "", amount: 0, description: "" });
    }
  };

  const removeDeduction = (index) => {
    const updatedDeductions = [...formData.deductions];
    updatedDeductions.splice(index, 1);
    setFormData({ ...formData, deductions: updatedDeductions });
  };

  const calculateTotalSalary = () => {
    const allowancesTotal = formData.allowances.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const bonusesTotal = formData.bonuses.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const deductionsTotal = formData.deductions.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    return (
      parseFloat(formData.baseSalary) +
      allowancesTotal +
      bonusesTotal -
      deductionsTotal
    );
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      // Update employee salary
      await axios.put(
        `http://localhost:3000/api/employees/salary/${currentEmployee._id}`,
        {
          ...formData,
          totalSalary: calculateTotalSalary(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh employee data
      const employeesRes = await axios.get(
        "http://localhost:3000/api/employees?includeSalary=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEmployees(employeesRes.data);
      setFilteredEmployees(
        employeesRes.data.filter((emp) =>
          `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.position}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );

      setShowAdjustForm(false);
      setCurrentEmployee(null);
      alert("Salary updated successfully!");
    } catch (error) {
      console.error("Error updating salary:", error);
      alert("An error occurred while updating salary. Please try again.");
    }
  };

  const handleCancelForm = () => {
    setShowAdjustForm(false);
    setShowHistory(false);
    setCurrentEmployee(null);
  };

  const calculateEmployeeTotalSalary = (employee) => {
    const baseSalary = employee.salary || 0;

    const allowancesTotal = (employee.allowances || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const bonusesTotal = (employee.bonuses || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const deductionsTotal = (employee.deductions || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    return baseSalary + allowancesTotal + bonusesTotal - deductionsTotal;
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
              className="unactive"
              onClick={() => navigate("/admin/departments")}
            >
              Departments
            </li>
            <li className="active" onClick={() => navigate("/admin/salary")}>
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
            <h2>Salary Management</h2>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          {showAdjustForm && currentEmployee && (
            <div className="form-container">
              <h3>Adjust Salary for {currentEmployee.name}</h3>
              <form onSubmit={handleSubmitForm}>
                <div className="form-group">
                  <label>Base Salary (VND)</label>
                  <input
                    type="number"
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* Allowances Section */}
                <div className="form-section">
                  <h4>Allowances</h4>

                  {formData.allowances.map((allowance, index) => (
                    <div key={index} className="existing-item">
                      <span>
                        {allowance.type}:{" "}
                        {allowance.amount.toLocaleString("vi-VN")} VND
                      </span>
                      <span className="description">
                        {allowance.description}
                      </span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeAllowance(index)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <div className="add-new-item">
                    <input
                      type="text"
                      name="type"
                      placeholder="Type"
                      value={newAllowance.type}
                      onChange={handleAllowanceChange}
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      value={newAllowance.amount}
                      onChange={handleAllowanceChange}
                    />
                    <input
                      type="text"
                      name="description"
                      placeholder="Description"
                      value={newAllowance.description}
                      onChange={handleAllowanceChange}
                    />
                    <button type="button" onClick={addAllowance}>
                      Add Allowance
                    </button>
                  </div>
                </div>

                {/* Bonuses Section */}
                <div className="form-section">
                  <h4>Bonuses</h4>

                  {formData.bonuses.map((bonus, index) => (
                    <div key={index} className="existing-item">
                      <span>
                        {bonus.type}: {bonus.amount.toLocaleString("vi-VN")} VND
                      </span>
                      <span className="description">{bonus.description}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeBonus(index)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <div className="add-new-item">
                    <input
                      type="text"
                      name="type"
                      placeholder="Type"
                      value={newBonus.type}
                      onChange={handleBonusChange}
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      value={newBonus.amount}
                      onChange={handleBonusChange}
                    />
                    <input
                      type="text"
                      name="description"
                      placeholder="Description"
                      value={newBonus.description}
                      onChange={handleBonusChange}
                    />
                    <button type="button" onClick={addBonus}>
                      Add Bonus
                    </button>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="form-section">
                  <h4>Deductions</h4>

                  {formData.deductions.map((deduction, index) => (
                    <div key={index} className="existing-item">
                      <span>
                        {deduction.type}:{" "}
                        {deduction.amount.toLocaleString("vi-VN")} VND
                      </span>
                      <span className="description">
                        {deduction.description}
                      </span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeDeduction(index)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <div className="add-new-item">
                    <input
                      type="text"
                      name="type"
                      placeholder="Type"
                      value={newDeduction.type}
                      onChange={handleDeductionChange}
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      value={newDeduction.amount}
                      onChange={handleDeductionChange}
                    />
                    <input
                      type="text"
                      name="description"
                      placeholder="Description"
                      value={newDeduction.description}
                      onChange={handleDeductionChange}
                    />
                    <button type="button" onClick={addDeduction}>
                      Add Deduction
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Salary (VND)</label>
                  <input
                    type="number"
                    value={calculateTotalSalary()}
                    readOnly
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Note</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleFormChange}
                    rows="3"
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">
                    Update Salary
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

          {showHistory && currentEmployee && (
            <div className="history-container">
              <h3>Salary History for {currentEmployee.name}</h3>
              {salaryHistory.length > 0 ? (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Base Salary</th>
                      <th>Allowances</th>
                      <th>Bonuses</th>
                      <th>Deductions</th>
                      <th>Total</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((record, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(record.effectiveDate).toLocaleDateString()}
                        </td>
                        <td>{record.baseSalary.toLocaleString("vi-VN")} VND</td>
                        <td>
                          {record.allowances && record.allowances.length > 0 ? (
                            <ul>
                              {record.allowances.map((a, i) => (
                                <li key={i}>
                                  {a.type}: {a.amount.toLocaleString("vi-VN")}{" "}
                                  VND
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>
                          {record.bonuses && record.bonuses.length > 0 ? (
                            <ul>
                              {record.bonuses.map((b, i) => (
                                <li key={i}>
                                  {b.type}: {b.amount.toLocaleString("vi-VN")}{" "}
                                  VND
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>
                          {record.deductions && record.deductions.length > 0 ? (
                            <ul>
                              {record.deductions.map((d, i) => (
                                <li key={i}>
                                  {d.type}: {d.amount.toLocaleString("vi-VN")}{" "}
                                  VND
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>
                          {record.totalSalary > 0
                            ? record.totalSalary.toLocaleString("vi-VN") +
                              " VND"
                            : "Chưa cập nhật"}
                        </td>
                        <td>{record.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-message">
                  No salary history available.
                </div>
              )}
              <button className="cancel-btn" onClick={handleCancelForm}>
                Close
              </button>
            </div>
          )}

          <div className="employee-list">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Base Salary</th>
                  <th>Allowances</th>
                  <th>Bonuses</th>
                  <th>Deductions</th>
                  <th>Total Salary</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position || "Not set"}</td>
                    <td>{(emp.salary || 0).toLocaleString("vi-VN")} VND</td>
                    <td>
                      {emp.allowances && emp.allowances.length > 0 ? (
                        <ul className="compact-list">
                          {emp.allowances.map((a, i) => (
                            <li key={i}>
                              {a.type}: {a.amount.toLocaleString("vi-VN")} VND
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {emp.bonuses && emp.bonuses.length > 0 ? (
                        <ul className="compact-list">
                          {emp.bonuses.map((b, i) => (
                            <li key={i}>
                              {b.type}: {b.amount.toLocaleString("vi-VN")} VND
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {emp.deductions && emp.deductions.length > 0 ? (
                        <ul className="compact-list">
                          {emp.deductions.map((d, i) => (
                            <li key={i}>
                              {d.type}: {d.amount.toLocaleString("vi-VN")} VND
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {calculateEmployeeTotalSalary(emp).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VND
                    </td>
                    <td>
                      {emp.salaryUpdatedAt
                        ? new Date(emp.salaryUpdatedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleAdjustSalary(emp)}
                        title="Adjust Salary"
                      >
                        💰
                      </button>
                      <button
                        className="view-btn"
                        onClick={() => handleViewHistory(emp)}
                        title="View History"
                      >
                        📋
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

// Helper function to calculate total salary for an employee

export default SalaryManagement;
