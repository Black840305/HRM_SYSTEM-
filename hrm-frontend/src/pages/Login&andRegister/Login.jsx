import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/LoginAndRegister2.css";

const LoginAndRegister = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post("http://localhost:3000/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        // Validate response data before storing
        if (!res.data?.token) {
          throw new Error("Token missing from response");
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("employeeId", res.data.employeeId);
        localStorage.setItem("role", res.data.role);

        setMessageType("success");
        setMessage("Đăng nhập thành công!");

        // Navigate based on role
        setTimeout(() => {
          if (res.data.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/employee-dashboard");
          }
        }, 800);
      } else {
        // Validate email format before submitting
        if (!validateEmail(formData.email)) {
          setMessageType("error");
          setMessage("Vui lòng nhập email hợp lệ!");
          setLoading(false);
          return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
          setMessageType("error");
          setMessage("Mật khẩu phải có ít nhất 6 ký tự!");
          setLoading(false);
          return;
        }

        const res = await axios.post(
          "http://localhost:3000/api/auth/register",
          {
            email: formData.email,
            password: formData.password,
            role: "employee",
          }
        );

        setMessageType("success");
        setMessage(res.data.message || "Đăng ký thành công!");

        setTimeout(() => {
          setIsLogin(true);
          setFormData({ email: formData.email, password: "" });
          setMessage("");
        }, 1500);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại sau!"
      );
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Left Side */}
      <div className="left-panel">
        <div className="logo">Employee Management System</div>
        <div className="nav-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Home</a>
        </div>
      </div>

      {/* Right Side */}
      <div className="right-panel">
        <div className="login-form">
          {isLogin ? (
            // Login Form
            <>
              <h1>Login</h1>
              <p>Welcome to our firm please login by your account</p>

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <i className="fas fa-user"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Username or email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <i className="fas fa-lock"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    } toggle-password`}
                    onClick={togglePasswordVisibility}
                  ></i>
                </div>

                <div className="form-options">
                  <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <a href="#" className="forgot-password">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>
                {/* <button
                  type="button"
                  className="register-btn"
                  onClick={() => setIsLogin(false)}
                >
                  REGISTER
                </button> */}

                {message && (
                  <div className={`message ${messageType}`}>{message}</div>
                )}

                <div className="social-login">
                  <p>or Login with</p>
                  <div className="social-buttons">
                    <button type="button" className="social-btn facebook">
                      <i className="fab fa-facebook-f"></i> FACEBOOK
                    </button>
                    <button type="button" className="social-btn twitter">
                      <i className="fab fa-twitter"></i> TWITTER
                    </button>
                    <button type="button" className="social-btn google">
                      <i className="fab fa-google"></i> GOOGLE
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            // Register Form
            <>
              <h1>Register</h1>
              <p>Create your account to join our company</p>

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <i className="fas fa-lock"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    } toggle-password`}
                    onClick={togglePasswordVisibility}
                  ></i>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "REGISTERING..." : "REGISTER"}
                </button>
                <button
                  type="button"
                  className="register-btn"
                  onClick={() => setIsLogin(true)}
                >
                  BACK TO LOGIN
                </button>

                {message && (
                  <div className={`message ${messageType}`}>{message}</div>
                )}

                <div className="social-login">
                  <p>or Register with</p>
                  <div className="social-buttons">
                    <button type="button" className="social-btn facebook">
                      <i className="fab fa-facebook-f"></i> FACEBOOK
                    </button>
                    <button type="button" className="social-btn twitter">
                      <i className="fab fa-twitter"></i> TWITTER
                    </button>
                    <button type="button" className="social-btn google">
                      <i className="fab fa-google"></i> GOOGLE
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginAndRegister;
