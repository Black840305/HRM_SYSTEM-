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
    month: new Date().getMonth() + 1, // Tháng hiện tại (1-12)
    year: new Date().getFullYear(), // Năm hiện tại
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
  const API_URL = "http://localhost:3000/api";

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
        const { data } = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!data?.employeeId) {
          console.error("Invalid employeeId:", data.employeeId);
          return navigate("/");
        }

        // Fetch admin details
        const adminRes = await axios.get(
          `${API_URL}/employees/${data.employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAdminData(adminRes.data);

        // Fetch all employees
        const employeesRes = await axios.get(
          `${API_URL}/employees?includeSalary=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Xử lý dữ liệu nhân viên và thông tin lương
        const employeesWithSalary = await Promise.all(
          employeesRes.data.map(async (employee) => {
            try {
              // Lấy bản ghi lương mới nhất cho mỗi nhân viên
              const salaryRes = await axios.get(
                `${API_URL}/payroll/employee/${employee._id}/latest`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              // Gán thông tin lương vào nhân viên nếu có
              if (salaryRes.data && salaryRes.data.data) {
                return {
                  ...employee,
                  salary: salaryRes.data.data.baseSalary,
                  allowances: salaryRes.data.data.allowances || [],
                  bonuses: salaryRes.data.data.bonuses || [],
                  deductions: salaryRes.data.data.deductions || [],
                  totalSalary: salaryRes.data.data.totalAmount,
                  salaryUpdatedAt: salaryRes.data.data.updatedAt,
                  payrollId: salaryRes.data.data._id,
                };
              }
              return employee;
            } catch (error) {
              console.error(
                `Error fetching salary for employee ${employee._id}:`,
                error
              );
              return employee;
            }
          })
        );

        setEmployees(employeesWithSalary);
        setFilteredEmployees(employeesWithSalary);
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

    // Đặt giá trị mặc định nếu nhân viên chưa có thông tin lương
    setFormData({
      baseSalary: employee.salary || 0,
      allowances: employee.allowances || [],
      bonuses: employee.bonuses || [],
      deductions: employee.deductions || [],
      month: new Date().getMonth() + 1, // Tháng hiện tại (1-12)
      year: new Date().getFullYear(), // Năm hiện tại
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
      // Sử dụng API của Payroll để lấy lịch sử lương
      const historyRes = await axios.get(
        `${API_URL}/payroll/employee/${employee._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Lấy danh sách payroll từ response
      setSalaryHistory(historyRes.data.data || []);
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
      [name]: ["baseSalary", "month", "year"].includes(name)
        ? parseFloat(value)
        : value,
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
      if (
        !window.confirm("Bạn có chắc chắn muốn cập nhật thông tin lương này?")
      ) {
        return;
      }

      const totalAmount = calculateTotalSalary();
      const payrollData = {
        ...formData,
        employee: currentEmployee._id,
        totalAmount: totalAmount,
      };

      console.log("Sending payroll data:", payrollData);

      let response;

      // Nếu nhân viên đã có payrollId, cập nhật bản ghi lương hiện có
      if (currentEmployee.payrollId) {
        response = await axios.put(
          `${API_URL}/payroll/${currentEmployee.payrollId}`,
          payrollData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Tạo bản ghi lương mới
        response = await axios.post(`${API_URL}/payroll`, payrollData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      console.log("Server response:", response.data);

      // Hiển thị thông báo thành công
      alert(`Cập nhật lương thành công cho nhân viên ${currentEmployee.name}!`);

      // Refresh employee data
      const employeesRes = await axios.get(
        `${API_URL}/employees?includeSalary=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Tương tự như trong useEffect, cần lấy thông tin lương mới nhất cho mỗi nhân viên
      const employeesWithSalary = await Promise.all(
        employeesRes.data.map(async (employee) => {
          try {
            const salaryRes = await axios.get(
              `${API_URL}/payroll/employee/${employee._id}/latest`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (salaryRes.data && salaryRes.data.data) {
              return {
                ...employee,
                salary: salaryRes.data.data.baseSalary,
                allowances: salaryRes.data.data.allowances || [],
                bonuses: salaryRes.data.data.bonuses || [],
                deductions: salaryRes.data.data.deductions || [],
                totalSalary: salaryRes.data.data.totalAmount,
                salaryUpdatedAt: salaryRes.data.data.updatedAt,
                payrollId: salaryRes.data.data._id,
              };
            }
            return employee;
          } catch (error) {
            console.error(
              `Error fetching salary for employee ${employee._id}:`,
              error
            );
            return employee;
          }
        })
      );

      setEmployees(employeesWithSalary);
      setFilteredEmployees(
        employeesWithSalary.filter((emp) =>
          `${emp.name} ${emp.email} ${emp.position}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );

      setShowAdjustForm(false);
      setCurrentEmployee(null);
    } catch (error) {
      console.error("Error updating salary:", error);

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = "Lỗi khi cập nhật lương.";
      if (error.response) {
        errorMessage = `Lỗi: ${error.response.status} - ${
          error.response.data.message ||
          error.response.data.msg ||
          "Không có thông báo từ server"
        }`;
      } else if (error.request) {
        errorMessage =
          "Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.";
      } else {
        errorMessage = `Lỗi: ${error.message}`;
      }

      alert(errorMessage);
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Tháng</label>
                    <input
                      type="number"
                      name="month"
                      min="1"
                      max="12"
                      value={formData.month}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Năm</label>
                    <input
                      type="number"
                      name="year"
                      min="2020"
                      max="2030"
                      value={formData.year}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

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
                      <th>Pay Period</th>
                      <th>Base Salary</th>
                      <th>Allowances</th>
                      <th>Bonuses</th>
                      <th>Deductions</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{`${record.month}/${record.year}`}</td>
                        <td>{record.baseSalary.toLocaleString("vi-VN")} VND</td>
                        <td>
                          {record.allowances && record.allowances.length > 0 ? (
                            <ul className="compact-list">
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
                            <ul className="compact-list">
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
                            <ul className="compact-list">
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
                          {record.totalAmount
                            ? record.totalAmount.toLocaleString("vi-VN") +
                              " VND"
                            : "N/A"}
                        </td>
                        <td>{record.status || "pending"}</td>
                        <td>{record.note || "No note"}</td>
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
                    <td>{emp.department?.name || emp.department || "N/A"}</td>
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

export default SalaryManagement;
