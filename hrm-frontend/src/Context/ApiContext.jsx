import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const navigate = useNavigate();

  // ✅ Lắng nghe localStorage để cập nhật role ngay lập tức
  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = localStorage.getItem("role");
      if (newRole !== role) {
        setRole(newRole);
        if (newRole === "admin") {
          navigate("/admin-dashboard");
        } else if (newRole === "employee") {
          navigate("/employee-profile");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [role, navigate]);

  const login = async (email, password) => {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại");

    // ✅ Lưu vào localStorage TRƯỚC khi cập nhật state
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("employeeId", data.employeeId);

    setToken(data.token);
    setRole(data.role);

    // ✅ Chuyển hướng ngay lập tức dựa trên localStorage thay vì state
    if (data.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/employee-profile");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("employeeId");
    setToken(null);
    setRole(null);
    navigate("/");
  };

  return (
    <ApiContext.Provider value={{ token, role, login, logout }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);
