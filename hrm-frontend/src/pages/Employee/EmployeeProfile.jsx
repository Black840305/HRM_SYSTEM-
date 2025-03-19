import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Profile.css";

const Profile = () => {
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();

  // const decodeToken = (token) => {
  //   try {
  //     return JSON.parse(atob(token.split(".")[1]));
  //   } catch {
  //     return null;
  //   }
  // };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("Không có token, điều hướng về login.");
        return navigate("/");
      }

      try {
        const { data } = await axios.get("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Dữ liệu từ API /me:", data); // ✅ Debug kiểm tra

        if (!data?.employeeId || typeof data.employeeId !== "string") {
          console.error("employeeId không hợp lệ:", data.employeeId);
          return navigate("/");
        }

        const res = await axios.get(
          `http://localhost:3000/api/employees/${data.employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setEmployee(res.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin cá nhân:", error);
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!employee) return <div>Đang tải thông tin cá nhân...</div>;

  const avatarUrl = employee.avatar
    ? `http://localhost:3000${employee.avatar}`
    : `http://localhost:3000/uploads/default.jpg`;

  const formatPhoneNumber = (phone) =>
    phone
      ? phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")
      : "Chưa cập nhật";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <span className="back-home" onClick={() => navigate("/dashboard")}>
            ⬅️ Trang chủ
          </span>
          <span className="logout-btn" onClick={handleLogout}>
            🚪 Đăng xuất
          </span>
        </div>
        <h1 className="profile-title">Thông Tin Cá Nhân</h1>
        <div className="profile-card">
          <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
          <h2 className="profile-name">
            {employee.firstName} {employee.lastName}
          </h2>
          <hr className="profile-divider" />
          <p>
            <strong>Email:</strong> {employee.email}
          </p>
          <p>
            <strong>Phòng ban:</strong>{" "}
            {employee.department?.name || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Tên công việc:</strong> {employee.position}
          </p>
          <p>
            <strong>Lương:</strong> {employee.salary?.toLocaleString("vi-VN")}{" "}
            VND
          </p>
          <p>
            <strong>Số điện thoại:</strong> {formatPhoneNumber(employee.phone)}
          </p>
          <p>
            <strong>Giới tính:</strong> {employee.gender}
          </p>
          <p>
            <strong>Ngày sinh:</strong>{" "}
            {employee.dateOfBirth
              ? new Date(employee.dateOfBirth).toLocaleDateString("vi-VN")
              : "Chưa cập nhật"}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {employee.address}
          </p>
          <p>
            <strong>Vai trò:</strong> {employee.role}
          </p>
          <p>
            <strong>Ngày bắt đầu làm việc:</strong>{" "}
            {employee.hireDate
              ? new Date(employee.hireDate).toLocaleDateString("vi-VN")
              : "Chưa cập nhật"}
          </p>
          <button
            className="edit-profile-btn"
            onClick={() => navigate("/edit-profile")}
          >
            ✏️ Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
