const User = require("../models/userModel");
const Employee = require("../models/employeeModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Hàm tạo Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Đăng ký User (Admin mới có quyền tạo User)

const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Tạo user mới
    const newUser = new User({ email, password, role: "employee" });
    await newUser.save();

    // Tạo hồ sơ nhân viên rỗng tương ứng
    const newEmployee = await Employee.create({
      name: "",
      dob: null,
      gender: "",
      address: "",
      email,
      phone: "",
      department: null,
      position: "",
      salary: 0,
      startDate: new Date(),
      avatar: "default.jpg",
      userId: newUser._id,
    });

    // ✅ Gán employeeId vào user
    await User.findByIdAndUpdate(newUser._id, { employeeId: newEmployee._id });

    res.status(201).json({
      message: "Đăng ký thành công",
      userId: newUser._id,
      employeeId: newEmployee._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// Đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email hoặc Mật khẩu không đúng!" });
    //so sánh mật khẩu
    if (password !== user.password)
      return res
        .status(400)
        .json({ message: "Email hoặc Mật khẩu không đúng!" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      userId: user._id,
      employeeId: user.employeeId || null,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// Lấy thông tin User + Employee
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).lean();
//     if (!user) {
//       return res.status(404).json({ message: "User không tồn tại" });
//     }

//     // Lấy thông tin nhân viên nhưng chỉ trả về _id dưới dạng string
//     const employee = await Employee.findOne({ user: user._id })
//       .select("_id")
//       .lean();

//     res.json({
//       id: user._id.toString(),
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       employeeId: employee ? employee._id.toString() : null, // ✅ Chuyển về string
//     });
//   } catch (error) {
//     console.error("Lỗi lấy thông tin user:", error);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Use the employeeId from the user record
    const employeeId = user.employeeId ? user.employeeId.toString() : null;

    res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: employeeId,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
module.exports = { register, login, getMe };
