import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login&andRegister/Login";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/antd/dist/reset.css";
import Profile from "./pages/Employee/EmployeeProfile";
import AdminDashboard from "./pages/Admin/AdminDashBoard";
import HandleEditEmployee from "./pages/Admin/HandleEditEmployee";
import HandleViewEmployee from "./pages/Admin/HandleViewEmployee";
import AdminDepartment from "./pages/Admin/AdminDepartments";
import SalaryManagement from "./pages/Admin/SalaryManagement";
import AttendanceManagement from "./pages/Admin/AttendanceManagement";
import HandleAddEmployee from "./pages/Admin/HandleAddEmployee";
import AdminNotifications from "./pages/Admin/AdminNotifications";
import Notifications from "./pages/Employee/EmployeeNotifications";
// import AdminLeave from "./pages/Admin/AdminLeave";
function App() {
  const [user, setUser] = useState(null);

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/admin-dashboard" />
          ) : (
            <Login setUser={setUser} />
          )
        }
      />
      <Route path="/employee-profile" element={<Profile />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/departments" element={<AdminDepartment />} />
      <Route
        path="/admin/employee/:employeeId"
        element={<HandleViewEmployee />}
      />
      <Route
        path="/admin/edit-employee/:employeeId"
        element={<HandleEditEmployee />}
      />
      <Route path="/admin/salary" element={<SalaryManagement />} />
      <Route path="/admin/salary/:employeeId" element={<SalaryManagement />} />
      <Route path="/admin/attendance" element={<AttendanceManagement />} />
      <Route
        path="/admin/attendance/:employeeId"
        element={<AttendanceManagement />}
      />
      <Route path="/admin/add-attendance" element={<AttendanceManagement />} />
      <Route
        path="/admin/edit-attendance/:id"
        element={<AttendanceManagement />}
      />
      <Route path="/admin/add-employee" element={<HandleAddEmployee />} />
      <Route
        path="/admin/notifications"
        element={
          localStorage.getItem("role") === "admin" ? (
            <AdminNotifications />
          ) : (
            <Notifications />
          )
        }
      />
      <Route path="admin/notifications/:id" element={<Notifications />} />
      {/* <Route
        path="admin/leave"
        element={
          localStorage.getItem("role") === "admin" ? <AdminLeave /> : <Leave />
        }
      /> */}
      {/* Redirect to the login page for any unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
