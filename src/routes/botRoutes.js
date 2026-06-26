const express = require("express");
const router = express.Router();
const botController = require("../controllers/botController");
const authMiddleware = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
// Webhook - Public (untuk integrasi dengan layanan lain)
router.post("/webhook", botController.webhook);

// ==================== PROTECTED ROUTES ====================
// Get bot status - Semua user yang sudah login
router.get("/status", authMiddleware.authenticate, botController.getStatus);

// Get bot stats - Admin/Owner
router.get(
  "/stats",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.getBotStats,
);

// ==================== BOT ACTION ROUTES ====================
// Send message - Admin/Owner
router.post(
  "/send-message",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.sendMessage,
);

// Send media via URL - Admin/Owner
router.post(
  "/send-media",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.sendMedia,
);

// Send image from file - Admin/Owner
router.post(
  "/send-image",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.sendImage,
);

// Send buttons - Admin/Owner
router.post(
  "/send-buttons",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.sendButtons,
);

// Broadcast message - Admin/Owner
router.post(
  "/broadcast",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.broadcastMessage,
);

// Get contact info - Admin/Owner
router.get(
  "/contact/:number",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin(),
  botController.getContact,
);

module.exports = router;
