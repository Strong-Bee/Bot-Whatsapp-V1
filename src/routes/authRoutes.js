const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
// Login - Semua user
router.post("/login", authController.login);

// Logout - Semua user
router.post("/logout", authController.logout);

// ==================== PROTECTED ROUTES ====================
// Profile - Semua user yang sudah login
router.get("/profile", authMiddleware.authenticate, authController.getProfile);
router.put(
  "/profile",
  authMiddleware.authenticate,
  authController.updateProfile,
);

// ==================== ADMIN & OWNER ROUTES ====================
// Get all users - Admin/Owner
router.get(
  "/users",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  authController.getAllUsers,
);

// Get user by ID - Admin/Owner
router.get(
  "/users/:id",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  authController.getUserById,
);

// ==================== OWNER ONLY ROUTES ====================
// Register new user - Owner only
router.post(
  "/register",
  authMiddleware.authenticate,
  authMiddleware.requireOwner(),
  authController.register,
);

// Update user - Owner only
router.put(
  "/users/:id",
  authMiddleware.authenticate,
  authMiddleware.requireOwner(),
  authController.updateUser,
);

// Delete user - Owner only
router.delete(
  "/users/:id",
  authMiddleware.authenticate,
  authMiddleware.requireOwner(),
  authController.deleteUser,
);

module.exports = router;
