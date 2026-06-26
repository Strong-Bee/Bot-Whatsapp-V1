const jwt = require("jsonwebtoken");
const userModel = require("../models/UserModel");
const logger = require("../utils/logger");

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your_secret_key";
    this.jwtExpire = process.env.JWT_EXPIRE || "7d";
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpire },
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Token tidak ditemukan",
        });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token tidak valid",
        });
      }

      const decoded = this.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Token expired atau tidak valid",
        });
      }

      const user = userModel.findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Akun Anda dinonaktifkan",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error(`Auth error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Akses ditolak. Diperlukan role: ${roles.join(", ")}`,
        });
      }

      next();
    };
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const userWithPermissions = userModel.findUserById(req.user.id);
      if (!userWithPermissions) {
        return res.status(401).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      if (!userWithPermissions.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `Akses ditolak. Diperlukan permission: ${permission}`,
        });
      }

      next();
    };
  }

  requireOwner() {
    return this.requireRole(["owner"]);
  }

  requireAdmin() {
    return this.requireRole(["admin", "owner"]);
  }

  requireUser() {
    return this.requireRole(["user", "admin", "owner"]);
  }
}

module.exports = new AuthMiddleware();
