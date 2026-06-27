const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const config = require("../config/config");

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const existing = UserModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // User baru otomatis role 'user'
    const user = UserModel.createUser({
      username,
      password: hashedPassword,
      role: "user",
    });
    res.status(201).json({
      message: "User registered",
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = UserModel.findByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        subscription: user.subscription,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.linkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const all = UserModel.findAll();
    if (all.find((u) => u.phone === phone && u.id !== user.id)) {
      return res
        .status(400)
        .json({ error: "Phone already linked to another account" });
    }
    UserModel.updateUser(user.id, { phone });
    res.json({ message: "Phone linked successfully", phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ** Endpoint khusus admin / owner untuk mengubah role user lain **
exports.setRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const validRoles = ["user", "subscriber", "admin", "owner"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const targetUser = UserModel.findById(userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    // Hanya owner yang bisa menetapkan role owner
    if (role === "owner" && req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Only owner can assign owner role" });
    }
    UserModel.updateUser(userId, { role });
    res.json({
      message: `User ${targetUser.username} role updated to ${role}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
