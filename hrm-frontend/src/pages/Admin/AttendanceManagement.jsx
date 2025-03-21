import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Form,
  Alert,
  Badge,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaFileExport,
  FaCalendarAlt,
  FaFilter,
  FaEye,
  FaPlusCircle,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/AdminDashboard.css";
// import "../../styles/AttendanceManagement.css";

const AdminAttendanceManagement = () => {
  const [adminData, setAdminData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [newAttendance, setNewAttendance] = useState({
    employee: "",
    date: new Date(),
    checkInTime: "",
    checkOutTime: "",
    status: "present",
    isLate: false,
    isLeave: false,
    leaveType: "",
    overtimeHours: 0,
    note: "",
  });
  const [summaryStats, setSummaryStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [
    navigate,
    selectedMonth,
    selectedDepartment,
    statusFilter,
    pagination.page,
  ]);

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
      setLoading(true);
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

      // Build query parameters for attendance
      const month = selectedMonth.getMonth() + 1; // JavaScript months are 0-indexed
      const year = selectedMonth.getFullYear();

      // Prepare filters
      let apiUrl =
        `http://localhost:3000/api/attendance?` +
        `month=${month}&` +
        `year=${year}&` +
        `page=${pagination.page}&` +
        `limit=${pagination.limit}&` +
        `includeStats=true`;

      // Add department filter if selected
      if (selectedDepartment) {
        apiUrl += `&department=${selectedDepartment}`;
      }

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        apiUrl += `&status=${statusFilter}`;
      }

      // Fetch attendance records
      const attendanceRes = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Attendance API response:", attendanceRes.data);

      if (attendanceRes.data && attendanceRes.data.data) {
        setAttendanceRecords(attendanceRes.data.data);
        setFilteredRecords(attendanceRes.data.data);

        // Update pagination info
        setPagination({
          page: attendanceRes.data.pagination.page,
          limit: attendanceRes.data.pagination.limit,
          total: attendanceRes.data.pagination.total,
          totalPages: attendanceRes.data.pagination.totalPages,
        });

        // Update summary stats if available
        if (attendanceRes.data.stats) {
          const stats = {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
          };

          // Aggregate stats from all departments
          Object.values(attendanceRes.data.stats).forEach((deptStats) => {
            stats.present += deptStats.present || 0;
            stats.absent += deptStats.absent || 0;
            stats.late += deptStats.late || 0;
            stats.leave += deptStats.leave || 0;
          });

          setSummaryStats(stats);
        }
      } else {
        setAttendanceRecords([]);
        setFilteredRecords([]);
      }

      setLoading(false);
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error) => {
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    setError(
      `Lỗi khi tải dữ liệu: ${error.response?.data?.message || error.message}`
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

    if (!value.trim()) {
      setFilteredRecords(attendanceRecords);
      return;
    }

    // Filter the already fetched records based on search term
    if (Array.isArray(attendanceRecords)) {
      const filtered = attendanceRecords.filter((record) => {
        const employeeName = record.employee?.name || "";
        const department = record.employee?.department?.name || "";
        const status = record.status || "";

        return (
          employeeName.toLowerCase().includes(value.toLowerCase()) ||
          department.toLowerCase().includes(value.toLowerCase()) ||
          status.toLowerCase().includes(value.toLowerCase())
        );
      });

      setFilteredRecords(filtered);
    }
  };

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
    // The useEffect will trigger a new fetch with the updated month
  };

  const handleDepartmentFilter = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);
    // The useEffect will trigger a new fetch with the department filter
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    // The useEffect will trigger a new fetch with the status filter
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
    // The useEffect will trigger a new fetch with the updated page
  };

  const handleViewAttendance = (employeeId) => {
    navigate(`/admin/attendance/${employeeId}`);
  };

  const handleEditAttendance = (record) => {
    setCurrentRecord(record);
    setShowEditModal(true);
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi chấm công này?"))
      return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:3000/api/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show success message
      setAlert({
        show: true,
        message: "Xóa bản ghi chấm công thành công!",
        type: "success",
      });

      // Refresh data
      fetchData();

      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      setAlert({
        show: true,
        message: `Lỗi khi xóa: ${
          error.response?.data?.message || error.message
        }`,
        type: "danger",
      });
    }
  };

  const handleAddAttendance = () => {
    setNewAttendance({
      employee: "",
      date: new Date(),
      checkInTime: "",
      checkOutTime: "",
      status: "present",
      isLate: false,
      isLeave: false,
      leaveType: "",
      overtimeHours: 0,
      note: "",
    });
    setShowAddModal(true);
  };

  const saveNewAttendance = async () => {
    const token = localStorage.getItem("token");
    try {
      // Format date for API (YYYY-MM-DD format)
      const formattedDate = new Date(newAttendance.date)
        .toISOString()
        .split("T")[0];

      // Format times for API (add current date to time)
      const formattedCheckInTime = newAttendance.checkInTime
        ? `${formattedDate}T${newAttendance.checkInTime}:00`
        : null;

      const formattedCheckOutTime = newAttendance.checkOutTime
        ? `${formattedDate}T${newAttendance.checkOutTime}:00`
        : null;

      const attendanceData = {
        employee: newAttendance.employee,
        date: formattedDate,
        checkInTime: formattedCheckInTime,
        checkOutTime: formattedCheckOutTime,
        status: newAttendance.status,
        isLate: newAttendance.isLate,
        isLeave: newAttendance.status === "leave",
        leaveType: newAttendance.leaveType,
        overtimeHours: parseFloat(newAttendance.overtimeHours) || 0,
        note: newAttendance.note,
      };

      await axios.post("http://localhost:3000/api/attendance", attendanceData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Close modal and refresh data
      setShowAddModal(false);
      setAlert({
        show: true,
        message: "Thêm bản ghi chấm công thành công!",
        type: "success",
      });
      fetchData();

      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error adding attendance record:", error);
      setAlert({
        show: true,
        message: `Lỗi khi thêm bản ghi: ${
          error.response?.data?.message || error.message
        }`,
        type: "danger",
      });
    }
  };

  const saveEditedAttendance = async () => {
    const token = localStorage.getItem("token");
    try {
      if (!currentRecord || !currentRecord._id) {
        console.error("No record selected for editing");
        return;
      }

      // Format date for API (YYYY-MM-DD format)
      const formattedDate = new Date(currentRecord.date)
        .toISOString()
        .split("T")[0];

      // Format times for API
      let formattedCheckInTime = currentRecord.checkInTime;
      let formattedCheckOutTime = currentRecord.checkOutTime;

      // If checkInTime and checkOutTime are strings (HH:MM format), convert them to datetime
      if (
        typeof currentRecord.checkInTime === "string" &&
        !currentRecord.checkInTime.includes("T")
      ) {
        formattedCheckInTime = `${formattedDate}T${currentRecord.checkInTime}:00`;
      }

      if (
        typeof currentRecord.checkOutTime === "string" &&
        !currentRecord.checkOutTime.includes("T")
      ) {
        formattedCheckOutTime = `${formattedDate}T${currentRecord.checkOutTime}:00`;
      }

      const attendanceData = {
        employee: currentRecord.employee._id,
        date: formattedDate,
        checkInTime: formattedCheckInTime,
        checkOutTime: formattedCheckOutTime,
        status: currentRecord.status,
        isLate: currentRecord.isLate,
        isLeave: currentRecord.status === "leave",
        leaveType: currentRecord.leaveType,
        overtimeHours: parseFloat(currentRecord.overtimeHours) || 0,
        note: currentRecord.note,
      };

      await axios.put(
        `http://localhost:3000/api/attendance/${currentRecord._id}`,
        attendanceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Close modal and refresh data
      setShowEditModal(false);
      setAlert({
        show: true,
        message: "Cập nhật bản ghi chấm công thành công!",
        type: "success",
      });
      fetchData();

      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating attendance record:", error);
      setAlert({
        show: true,
        message: `Lỗi khi cập nhật: ${
          error.response?.data?.message || error.message
        }`,
        type: "danger",
      });
    }
  };

  const handleExportReport = async () => {
    const token = localStorage.getItem("token");
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      const response = await axios.get(
        `http://localhost:3000/api/reports/attendance/export?` +
          `month=${month}&` +
          `year=${year}&` +
          `${selectedDepartment ? `department=${selectedDepartment}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance-report-${month}-${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setAlert({
        show: true,
        message: "Đã xuất báo cáo thành công!",
        type: "success",
      });

      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error exporting report:", error);
      setAlert({
        show: true,
        message: "Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.",
        type: "danger",
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "present":
        return "bg-success";
      case "absent":
        return "bg-danger";
      case "late":
        return "bg-warning";
      case "leave":
        return "bg-info";
      case "pending":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return dateTimeStr;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Đã xảy ra lỗi!</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

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
            <h3>PERSONAL INFO</h3>
            <Button size="sm" onClick={() => navigate("/admin/profile")}>
              View Profile
            </Button>
          </div>
        </div>

        <div className="admin-main">
          {alert.show && (
            <Alert
              variant={alert.type}
              onClose={() => setAlert({ ...alert, show: false })}
              dismissible
            >
              {alert.message}
            </Alert>
          )}

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Quản lý chấm công</h4>
              <Button variant="success" onClick={handleAddAttendance}>
                <FaPlusCircle className="mr-1" /> Thêm bản ghi
              </Button>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3} className="mb-2">
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="mr-2" />
                    <DatePicker
                      selected={selectedMonth}
                      onChange={handleMonthChange}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      className="form-control"
                    />
                  </div>
                </Col>
                <Col md={3} className="mb-2">
                  <Form.Group>
                    <Form.Select
                      value={selectedDepartment}
                      onChange={handleDepartmentFilter}
                    >
                      <option value="">Tất cả phòng ban</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-2">
                  <Form.Group>
                    <Form.Select
                      value={statusFilter}
                      onChange={handleStatusFilter}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="present">Có mặt</option>
                      <option value="absent">Vắng mặt</option>
                      <option value="late">Đi muộn</option>
                      <option value="leave">Nghỉ phép</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-2">
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <Button variant="outline-primary" className="ml-2">
                      <FaSearch />
                    </Button>
                  </div>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <Card className="attendance-summary-card">
                    <Card.Body>
                      <h5>
                        Thống kê tháng {selectedMonth.getMonth() + 1}/
                        {selectedMonth.getFullYear()}
                      </h5>
                      <div className="d-flex justify-content-between mt-3">
                        <div className="summary-item">
                          <Badge bg="success" className="summary-badge">
                            {summaryStats.present}
                          </Badge>
                          <span className="summary-label">Có mặt</span>
                        </div>
                        <div className="summary-item">
                          <Badge bg="danger" className="summary-badge">
                            {summaryStats.absent}
                          </Badge>
                          <span className="summary-label">Vắng mặt</span>
                        </div>
                        <div className="summary-item">
                          <Badge bg="warning" className="summary-badge">
                            {summaryStats.late}
                          </Badge>
                          <span className="summary-label">Đi muộn</span>
                        </div>
                        <div className="summary-item">
                          <Badge bg="info" className="summary-badge">
                            {summaryStats.leave}
                          </Badge>
                          <span className="summary-label">Nghỉ phép</span>
                        </div>
                        <div className="summary-actions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleExportReport}
                          >
                            <FaFileExport /> Xuất báo cáo
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Nhân viên</th>
                    <th>Phòng ban</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Trạng thái</th>
                    <th>Giờ làm việc</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsToDisplay.length > 0 ? (
                    recordsToDisplay.map((record) => (
                      <tr key={record._id}>
                        <td>
                          {record.formattedDate ||
                            new Date(record.date).toLocaleDateString()}
                        </td>
                        <td>{record.employee?.name || "Không xác định"}</td>
                        <td>
                          {record.employee?.department.name || "Không xác định"}
                        </td>
                        <td>{formatTime(record.checkInTime)}</td>
                        <td>{formatTime(record.checkOutTime)}</td>
                        <td>
                          <Badge
                            bg={getStatusBadgeClass(
                              record.status ||
                                (record.isAbsent
                                  ? "absent"
                                  : record.isLeave
                                  ? "leave"
                                  : "present")
                            )}
                          >
                            {record.status ||
                              (record.isAbsent
                                ? "Vắng mặt"
                                : record.isLeave
                                ? "Nghỉ phép"
                                : "Có mặt")}
                          </Badge>
                          {record.isLate && (
                            <Badge bg="warning" className="ml-1">
                              Đi muộn
                            </Badge>
                          )}
                        </td>
                        <td>{record.workingHours || "N/A"}</td>
                        <td
                          className="text-truncate"
                          style={{ maxWidth: "150px" }}
                        >
                          {record.note || record.remarks || "—"}
                        </td>
                        <td className="action-buttons">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="mr-1"
                            onClick={() =>
                              handleViewAttendance(record.employee?._id)
                            }
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mr-1"
                            onClick={() => handleEditAttendance(record)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteAttendance(record._id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-3">
                        Không tìm thấy dữ liệu chấm công
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Phân trang */}
              {pagination.totalPages > 1 && (
                <div className="pagination d-flex justify-content-center mt-4">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="mx-1"
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="mx-1"
                  >
                    Trước
                  </Button>
                  <span className="mx-2 d-flex align-items-center">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="mx-1"
                  >
                    Sau
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="mx-1"
                  >
                    Cuối
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modal thêm mới chấm công */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Thêm bản ghi chấm công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nhân viên</Form.Label>
                  <Form.Select
                    value={newAttendance.employee}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        employee: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeId || emp.employeeCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày</Form.Label>
                  <DatePicker
                    selected={newAttendance.date}
                    onChange={(date) =>
                      setNewAttendance({ ...newAttendance, date })
                    }
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giờ vào</Form.Label>
                  <Form.Control
                    type="time"
                    value={newAttendance.checkInTime}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        checkInTime: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giờ ra</Form.Label>
                  <Form.Control
                    type="time"
                    value={newAttendance.checkOutTime}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        checkOutTime: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={newAttendance.status}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        status: e.target.value,
                        isLeave: e.target.value === "leave",
                      })
                    }
                  >
                    <option value="present">Có mặt</option>
                    <option value="absent">Vắng mặt</option>
                    <option value="late">Đi muộn</option>
                    <option value="leave">Nghỉ phép</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giờ làm thêm</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.5"
                    value={newAttendance.overtimeHours}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        overtimeHours: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            {newAttendance.status === "leave" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại nghỉ phép</Form.Label>
                    <Form.Select
                      value={newAttendance.leaveType}
                      onChange={(e) =>
                        setNewAttendance({
                          ...newAttendance,
                          leaveType: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Chọn loại nghỉ phép --</option>
                      <option value="annual">Nghỉ phép năm</option>
                      <option value="sick">Nghỉ ốm</option>
                      <option value="maternity">Nghỉ thai sản</option>
                      <option value="bereavement">Nghỉ tang</option>
                      <option value="unpaid">Nghỉ không lương</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAttendance.note}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    note: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={saveNewAttendance}>
            Thêm bản ghi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal chỉnh sửa chấm công */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa bản ghi chấm công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentRecord && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nhân viên</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentRecord.employee?.name || ""}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày</Form.Label>
                    <DatePicker
                      selected={
                        currentRecord.date instanceof Date
                          ? currentRecord.date
                          : new Date(currentRecord.date)
                      }
                      onChange={(date) =>
                        setCurrentRecord({ ...currentRecord, date })
                      }
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giờ vào</Form.Label>
                    <Form.Control
                      type="time"
                      value={
                        typeof currentRecord.checkInTime === "string" &&
                        currentRecord.checkInTime.includes("T")
                          ? currentRecord.checkInTime
                              .split("T")[1]
                              .substring(0, 5)
                          : currentRecord.checkInTime || ""
                      }
                      onChange={(e) =>
                        setCurrentRecord({
                          ...currentRecord,
                          checkInTime: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giờ ra</Form.Label>
                    <Form.Control
                      type="time"
                      value={
                        typeof currentRecord.checkOutTime === "string" &&
                        currentRecord.checkOutTime.includes("T")
                          ? currentRecord.checkOutTime
                              .split("T")[1]
                              .substring(0, 5)
                          : currentRecord.checkOutTime || ""
                      }
                      onChange={(e) =>
                        setCurrentRecord({
                          ...currentRecord,
                          checkOutTime: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={currentRecord.status || ""}
                      onChange={(e) =>
                        setCurrentRecord({
                          ...currentRecord,
                          status: e.target.value,
                          isLeave: e.target.value === "leave",
                        })
                      }
                    >
                      <option value="present">Có mặt</option>
                      <option value="absent">Vắng mặt</option>
                      <option value="late">Đi muộn</option>
                      <option value="leave">Nghỉ phép</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giờ làm thêm</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentRecord.overtimeHours || 0}
                      onChange={(e) =>
                        setCurrentRecord({
                          ...currentRecord,
                          overtimeHours: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              {currentRecord.status === "leave" && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại nghỉ phép</Form.Label>
                      <Form.Select
                        value={currentRecord.leaveType || ""}
                        onChange={(e) =>
                          setCurrentRecord({
                            ...currentRecord,
                            leaveType: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Chọn loại nghỉ phép --</option>
                        <option value="annual">Nghỉ phép năm</option>
                        <option value="sick">Nghỉ ốm</option>
                        <option value="maternity">Nghỉ thai sản</option>
                        <option value="bereavement">Nghỉ tang</option>
                        <option value="unpaid">Nghỉ không lương</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={currentRecord.note || currentRecord.remarks || ""}
                  onChange={(e) =>
                    setCurrentRecord({
                      ...currentRecord,
                      note: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={saveEditedAttendance}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminAttendanceManagement;
