import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/HandleAddEmployee.css";

const HandleAddEmployee = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    dob: "",
    gender: "male",
    address: "",
    phone: "",
    departmentId: "", // This will be the ObjectId
    position: "",
    baseSalary: "", // Changed from salary to baseSalary to match PayrollSchema
    startDate: "",
    workSchedule: "full-time",
    avatar: null,
    // Additional payroll info
    paymentMethod: "bank",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "http://localhost:3000/api/departments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDepartments(data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, avatar: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      // Create FormData object for multipart submission
      const formDataSubmit = new FormData();

      // Append all form fields to the FormData
      Object.keys(formData).forEach((key) => {
        if (key === "avatar" && formData[key]) {
          formDataSubmit.append("avatar", formData[key]);
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataSubmit.append(key, formData[key]);
        }
      });

      // Make sure baseSalary is being included in the request
      if (!formData.baseSalary) {
        throw new Error("Base Salary is required");
      }

      // Create new employee with all required fields in one request
      await axios.post(
        "http://localhost:3000/api/employees",
        formDataSubmit,
        
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );


      alert("Employee added successfully!");
      navigate("/admin-dashboard");
    } catch (error) {
      console.error(
        "Error adding employee:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Failed to process the employee data."
      );
    }
  };

  return (
    <div className="add-employee-container">
      <h2>Add Employee</h2>
      <form onSubmit={handleSubmit}>
        <h3>User Account Information</h3>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Employee Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <h3>Personal Information</h3>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="dob"
          placeholder="Date of Birth"
          value={formData.dob}
          onChange={handleChange}
          required
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <h3>Employment Information</h3>
        <select
          name="departmentId"
          value={formData.departmentId}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="position"
          placeholder="Position"
          value={formData.position}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
        <select
          name="workSchedule"
          value={formData.workSchedule}
          onChange={handleChange}
          required
        >
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
        </select>

        <h3>Salary Information</h3>
        <input
          type="number"
          name="baseSalary"
          placeholder="Base Salary"
          value={formData.baseSalary}
          onChange={handleChange}
          required
        />
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          required
        >
          <option value="bank">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>

        {formData.paymentMethod === "bank" && (
          <>
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
            />
            <input
              type="text"
              name="accountName"
              placeholder="Account Name"
              value={formData.accountName}
              onChange={handleChange}
            />
          </>
        )}

        <h3>Profile Picture</h3>
        <input type="file" name="avatar" onChange={handleFileChange} />

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
  );
};

export default HandleAddEmployee;
