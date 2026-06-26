const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
// Webhook notification from Midtrans (Public)
router.post("/notification", paymentController.paymentNotification);

// ==================== PROTECTED ROUTES ====================
// Create payment - Semua user yang sudah login
router.post(
  "/create",
  authMiddleware.authenticate,
  paymentController.createPayment,
);

// Generate payment link - Semua user yang sudah login
router.post(
  "/generate-link",
  authMiddleware.authenticate,
  paymentController.generatePaymentLink,
);

// Check payment status - Semua user yang sudah login
router.get(
  "/status/:orderId",
  authMiddleware.authenticate,
  paymentController.checkPaymentStatus,
);

// Get payment history by phone - Semua user yang sudah login
router.get(
  "/history/:phone",
  authMiddleware.authenticate,
  paymentController.getPaymentHistory,
);

// Cancel payment - Semua user yang sudah login
router.post(
  "/cancel/:orderId",
  authMiddleware.authenticate,
  paymentController.cancelPayment,
);

// ==================== ADMIN & OWNER ROUTES ====================
// Get all payments - Admin/Owner
router.get(
  "/all",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  paymentController.getAllPayments,
);

// Get payment statistics - Admin/Owner
router.get(
  "/stats",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  paymentController.getPaymentStats,
);

module.exports = router;
