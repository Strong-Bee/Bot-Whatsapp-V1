const userModel = require("../models/UserModel");
const authMiddleware = require("../middleware/auth");
const logger = require("../utils/logger");
const Helper = require("../utils/helper");

class AuthController {
  // Register user (hanya owner)
  async register(req, res) {
    try {
      const { phone, name, password, role } = req.body;

      // Validasi input
      if (!phone || !name || !password) {
        return res.status(400).json({
          success: false,
          message: "Phone, name, dan password wajib diisi!",
        });
      }

      // Validasi format nomor
      if (!Helper.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid!",
        });
      }

      // Validasi password
      const passValid = Helper.validatePasswordStrength(password);
      if (!passValid.valid) {
        return res.status(400).json({
          success: false,
          message: passValid.message,
        });
      }

      // Cek apakah user sudah ada
      const existingUser = userModel.findUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Nomor telepon sudah terdaftar!",
        });
      }

      // Hanya owner yang bisa membuat admin
      if (role === "admin" && req.user.role !== "owner") {
        return res.status(403).json({
          success: false,
          message: "Hanya owner yang dapat membuat admin!",
        });
      }

      const newUser = userModel.createUser(
        phone,
        name,
        role || "user",
        password,
      );

      logger.info(
        `User registered: ${phone} (${newUser.role}) by ${req.user.phone}`,
      );

      res.status(201).json({
        success: true,
        message: "User berhasil didaftarkan!",
        data: {
          id: newUser.id,
          phone: newUser.phone,
          name: newUser.name,
          role: newUser.role,
          permissions: newUser.permissions,
        },
      });
    } catch (error) {
      logger.error(`Register error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: "Phone dan password wajib diisi!",
        });
      }

      const user = userModel.findUserByPhone(phone);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Nomor telepon atau password salah!",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Akun Anda telah dinonaktifkan!",
        });
      }

      const isValid = userModel.validatePassword(phone, password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Nomor telepon atau password salah!",
        });
      }

      const token = authMiddleware.generateToken(user);

      logger.info(`User logged in: ${phone} (${user.role})`);

      res.json({
        success: true,
        message: "Login berhasil!",
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
          },
        },
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = userModel.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error(`Get profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { name, password } = req.body;
      const userId = req.user.id;

      const updates = {};
      if (name) updates.name = name;
      if (password) {
        const passValid = Helper.validatePasswordStrength(password);
        if (!passValid.valid) {
          return res.status(400).json({
            success: false,
            message: passValid.message,
          });
        }
        updates.password = password;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang diupdate",
        });
      }

      const updatedUser = userModel.updateUser(userId, updates);

      logger.info(`User updated: ${updatedUser.phone}`);

      res.json({
        success: true,
        message: "Profile berhasil diupdate!",
        data: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      logger.error(`Update profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all users (hanya admin/owner)
  async getAllUsers(req, res) {
    try {
      const users = userModel.getAllUsers();

      res.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      logger.error(`Get all users error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user by ID (hanya admin/owner)
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = userModel.findUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          permissions: user.permissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      logger.error(`Get user by ID error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update user (hanya owner)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, role, isActive, password } = req.body;

      const user = userModel.findUserById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Cek jika user adalah owner
      if (user.role === "owner" && req.user.role !== "owner") {
        return res.status(403).json({
          success: false,
          message: "Hanya owner yang dapat mengubah data owner!",
        });
      }

      // Cek jika mencoba mengubah owner
      if (user.role === "owner" && role && role !== "owner") {
        return res.status(403).json({
          success: false,
          message: "Tidak dapat mengubah role owner!",
        });
      }

      const updates = {};
      if (name) updates.name = name;
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) {
        const passValid = Helper.validatePasswordStrength(password);
        if (!passValid.valid) {
          return res.status(400).json({
            success: false,
            message: passValid.message,
          });
        }
        updates.password = password;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang diupdate",
        });
      }

      const updatedUser = userModel.updateUser(id, updates);

      logger.info(`User updated by ${req.user.phone}: ${updatedUser.phone}`);

      res.json({
        success: true,
        message: "User berhasil diupdate!",
        data: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      });
    } catch (error) {
      logger.error(`Update user error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete user (hanya owner)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = userModel.findUserById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      if (user.role === "owner") {
        return res.status(403).json({
          success: false,
          message: "Tidak dapat menghapus owner!",
        });
      }

      userModel.deleteUser(id);

      logger.info(`User deleted by ${req.user.phone}: ${user.phone}`);

      res.json({
        success: true,
        message: "User berhasil dihapus!",
      });
    } catch (error) {
      logger.error(`Delete user error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      res.json({
        success: true,
        message: "Logout berhasil!",
      });
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();
