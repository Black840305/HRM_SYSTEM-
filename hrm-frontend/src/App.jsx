import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Import CSS
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/antd/dist/reset.css";

// Import Pages
import Login from "./pages/Login&andRegister/Login";
import Profile from "./pages/Employee/EmployeeProfile";
import AdminDashboard from "./pages/Admin/AdminDashBoard";
import HandleEditEmployee from "./pages/Admin/HandleEditEmployee";
import HandleViewEmployee from "./pages/Admin/HandleViewEmployee";
import AdminDepartment from "./pages/Admin/AdminDepartments";
import SalaryManagement from "./pages/Admin/SalaryManagement";
import AdminAttendanceManagement from "./pages/Admin/AttendanceManagement";
import HandleAddEmployee from "./pages/Admin/HandleAddEmployee";
import AdminNotifications from "./pages/Admin/AdminNotifications";
import EmployeeNotifications from "./pages/Employee/EmployeeNotifications";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import Attendance from "./pages/Employee/TakeAttendanceForEmployee";
import Salary from "./pages/Employee/EmployeeSalary";

// Authentication Context (Optional but recommended)
const AuthContext = React.createContext(null);

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if user has appropriate role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard or unauthorized page
    return (
      <Navigate
        to={userRole === "admin" ? "/admin-dashboard" : "/employee-dashboard"}
        replace
      />
    );
  }

  // If authenticated and has correct role, render child routes
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Check authentication on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        setIsAuthenticated,
        setUserRole,
        handleLogout,
      }}
    >
      <Routes>
        {/* Public Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              userRole === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/employee-dashboard" />
              )
            ) : (
              <Login />
            )
          }
        />

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
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
          <Route
            path="/admin/salary/:employeeId"
            element={<SalaryManagement />}
          />
          <Route
            path="/admin/attendance"
            element={<AdminAttendanceManagement />}
          />
          <Route
            path="/admin/attendance/:employeeId"
            element={<AdminAttendanceManagement />}
          />
          <Route
            path="/admin/add-attendance"
            element={<AdminAttendanceManagement />}
          />
          <Route
            path="/admin/edit-attendance/:id"
            element={<AdminAttendanceManagement />}
          />
          <Route path="/admin/add-employee" element={<HandleAddEmployee />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Route>

        {/* Employee Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee-profile" element={<Profile />} />
          <Route path="/employee/attendance" element={<Attendance />} />
          <Route path="/employee/salary" element={<Salary />} />
          <Route
            path="/employee/notifications"
            element={<EmployeeNotifications />}
          />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
export { AuthContext }; // Export context for use in other components
