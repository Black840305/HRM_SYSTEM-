import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/HandleEditEmployee.css";

const HandleEditEmployee = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [employeeData, setEmployeeData] = useState({
    name: "",
    email: "", // Added email field
    dob: "",
    gender: "",
    address: "",
    phone: "",
    department: { _id: "" },
    position: "",
    salary: "",
    startDate: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const API_BASE_URL = "http://localhost:3000";

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        console.log("Fetching employee with ID:", employeeId);

        const { data } = await axios.get(
          `${API_BASE_URL}/api/employees/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Employee data received:", data);
        console.log("Raw department data:", data.department);

        // Format date strings for input fields
        const formattedData = {
          ...data,
          email: data.email || (data.user && data.user.email) || "", // Get email from user object if available
          dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          // Make sure department is properly formatted as an object with _id
          department: data.department
            ? typeof data.department === "object"
              ? data.department
              : { _id: data.department }
            : { _id: "" },
        };

        console.log("Formatted data:", formattedData);
        setEmployeeData(formattedData);

        // Set avatar preview if employee has an avatar
        if (data.avatar) {
          // Convert relative path to full URL
          const avatarPath = data.avatar.startsWith("/")
            ? data.avatar
            : `/${data.avatar}`;

          setAvatarPreview(`${API_BASE_URL}${avatarPath}`);
        }

        // Fetch departments
        const departmentsResponse = await axios.get(
          `${API_BASE_URL}/api/departments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Departments fetched:", departmentsResponse.data);
        setDepartments(departmentsResponse.data);

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

    fetchEmployeeData();
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Make sure we have a department ID, not name
      const departmentId =
        typeof employeeData.department === "object"
          ? employeeData.department._id
          : employeeData.department;

      console.log("Department being sent:", departmentId);

      // Prepare data with all required fields
      const updatedData = {
        name: employeeData.name,
        email: employeeData.email, // Include email in the update
        dob: employeeData.dob,
        gender: employeeData.gender,
        address: employeeData.address,
        phone: employeeData.phone,
        department: departmentId,
        position: employeeData.position,
        salary: Number(employeeData.salary),
        startDate: employeeData.startDate,
      };

      console.log("Sending update data:", updatedData);

      const response = await axios.put(
        `${API_BASE_URL}/api/employees/${employeeId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Employee updated successfully!", response.data);
      alert("Employee updated successfully!");
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("Error updating employee:", error);
      console.error("Error response:", error.response?.data);
      setError(
        `Error updating employee: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      alert("Please select an image file first");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("avatar", file);

      // Add email to formData to satisfy the validation requirement
      formData.append("email", employeeData.email);

      const response = await axios.post(
        `${API_BASE_URL}/api/employees/${employeeId}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      // Log the response to see what we're getting back
      console.log("Avatar upload response:", response.data);

      // Update avatar preview with the new URL
      if (response.data && response.data.avatar) {
        const avatarPath = response.data.avatar.startsWith("/")
          ? response.data.avatar
          : `/${response.data.avatar}`;

        setAvatarPreview(`${API_BASE_URL}${avatarPath}`);

        // Update employee data with the new avatar
        setEmployeeData({
          ...employeeData,
          avatar: response.data.avatar,
        });
      }

      alert("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert(
        `Error uploading avatar: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading)
    return <div className="loading">Loading employee details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!employeeData)
    return <div className="error-message">No employee data found</div>;

  return (
    <div className="employee-edit-container">
      <div className="employee-edit-card">
        <h1 className="employee-edit-title">Edit Employee</h1>

        {/* Avatar Upload Section */}
        <div className="avatar-section">
          <div className="avatar-container">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Employee Avatar"
                className="avatar-preview"
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>
          <div className="avatar-upload-controls">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="select-avatar-btn"
              onClick={triggerFileInput}
            >
              Select Image
            </button>
            <button
              type="button"
              className="upload-avatar-btn"
              onClick={handleAvatarUpload}
              disabled={isUploading || !fileInputRef.current?.files[0]}
            >
              {isUploading
                ? `Uploading... ${uploadProgress}%`
                : "Upload Avatar"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="employee-edit-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={employeeData.name || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, name: e.target.value })
              }
              className="form-input"
            />

            {/* Add Email field */}
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={employeeData.email || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, email: e.target.value })
              }
              className="form-input"
              required
            />

            <label htmlFor="dob" className="form-label">
              Date of Birth
            </label>
            <input
              type="date"
              id="dob"
              value={employeeData.dob || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, dob: e.target.value })
              }
              className="form-input"
            />

            <label htmlFor="gender" className="form-label">
              Gender
            </label>
            <select
              id="gender"
              value={employeeData.gender || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, gender: e.target.value })
              }
              className="form-input"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={employeeData.address || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, address: e.target.value })
              }
              className="form-input"
            />

            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              type="text"
              id="phone"
              value={employeeData.phone || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, phone: e.target.value })
              }
              className="form-input"
            />

            <label htmlFor="department" className="form-label">
              Department
            </label>
            <select
              id="department"
              value={employeeData.department?._id || ""}
              onChange={(e) => {
                const selectedDeptId = e.target.value;
                setEmployeeData({
                  ...employeeData,
                  department: { _id: selectedDeptId }, // Save only the ID
                });
              }}
              className="form-input"
            >
              <option value="">Select a department</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>

            <label htmlFor="position" className="form-label">
              Position
            </label>
            <input
              type="text"
              id="position"
              value={employeeData.position || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, position: e.target.value })
              }
              className="form-input"
            />

            <label htmlFor="salary" className="form-label">
              Salary
            </label>
            <input
              type="number"
              id="salary"
              value={employeeData.salary || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, salary: e.target.value })
              }
              className="form-input"
            />

            <label htmlFor="startDate" className="form-label">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={employeeData.startDate || ""}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, startDate: e.target.value })
              }
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              Save Changes
            </button>
            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/admin-dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HandleEditEmployee;
