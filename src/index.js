const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const config = require("./config/config");
const logger = require("./utils/logger");
const whatsappService = require("./services/whatsappService");
const botRoutes = require("./routes/botRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userModel = require("./models/UserModel");
const subscriptionModel = require("./models/SubscriptionModel");

// Initialize Express
const app = express();

// Middleware untuk Express 5
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/public", express.static("public"));

// Routes
app.use("/api/bot", botRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);

// Homepage
app.get("/", (req, res) => {
  res.json({
    name: "WhatsApp Bot Express",
    version: "1.0.0",
    status: "running",
    environment: config.nodeEnv,
    authentication: {
      type: "JWT",
      roles: ["owner", "admin", "user"],
      endpoints: {
        register: "/api/auth/register (POST) - Owner only",
        login: "/api/auth/login (POST)",
        profile: "/api/auth/profile (GET)",
        users: "/api/auth/users (GET) - Admin/Owner",
        updateUser: "/api/auth/users/:id (PUT) - Owner only",
        deleteUser: "/api/auth/users/:id (DELETE) - Owner only",
      },
    },
    payment: {
      gateway: "Midtrans",
      endpoints: {
        create: "/api/payment/create (POST)",
        status: "/api/payment/status/:orderId (GET)",
        history: "/api/payment/history/:phone (GET)",
        notification: "/api/payment/notification (POST) - Webhook",
      },
    },
    endpoints: {
      health: "/health",
      api: "/api",
      bot: {
        status: "/api/bot/status",
        sendMessage: "/api/bot/send-message (POST)",
        sendMedia: "/api/bot/send-media (POST)",
        sendImage: "/api/bot/send-image (POST)",
        sendButtons: "/api/bot/send-buttons (POST)",
        broadcast: "/api/bot/broadcast (POST)",
        contact: "/api/bot/contact/:number (GET)",
        webhook: "/api/bot/webhook (POST)",
        block: "/api/bot/block (POST)",
        unblock: "/api/bot/unblock (POST)",
        blocked: "/api/bot/blocked (GET)",
      },
    },
    docs: "https://github.com/yourusername/whatsapp-bot-express",
  });
});

// Health check
app.get("/health", (req, res) => {
  const status = whatsappService.getStatus();
  const totalUsers = userModel.getAllUsers().length;
  const subscriptions = subscriptionModel.getAllSubscriptions();
  const activeSubs = subscriptionModel.getActiveSubscriptions();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    bot: {
      status: status.status,
      isReady: status.isReady,
      phone: status.phone || "N/A",
      name: status.name || "N/A",
      mode: status.mode || "stealth",
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: config.nodeEnv,
    },
    users: {
      total: totalUsers,
      owner: userModel.getAllUsers().filter((u) => u.role === "owner").length,
      admin: userModel.getAllUsers().filter((u) => u.role === "admin").length,
      user: userModel.getAllUsers().filter((u) => u.role === "user").length,
    },
    subscriptions: {
      total: subscriptions.length,
      active: activeSubs.length,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Error handler untuk Express 5
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  logger.error(err.stack);

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired, silakan login ulang",
      timestamp: new Date().toISOString(),
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.success(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info("📱 Menjalankan WhatsApp Bot...");
  logger.info(`📊 Node.js version: ${process.version}`);
  logger.info(`🔐 Authentication: JWT with Role-based Access Control`);
  logger.info(`👥 Total users: ${userModel.getAllUsers().length}`);
  logger.info(
    `💳 Total subscriptions: ${subscriptionModel.getAllSubscriptions().length}`,
  );
  logger.info(
    `🟢 Active subscriptions: ${subscriptionModel.getActiveSubscriptions().length}`,
  );
});

// Initialize WhatsApp client
try {
  whatsappService.initialize();
} catch (error) {
  logger.error(`Failed to initialize WhatsApp client: ${error.message}`);
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n🔄 Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info("📡 HTTP server closed");

    try {
      await whatsappService.destroy();
      logger.success("✅ Bot shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.warn("⚠️ Force shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`💥 Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
  logger.error(reason.stack || reason);
});

// Handle process warnings
process.on("warning", (warning) => {
  logger.warn(`⚠️ Process Warning: ${warning.name} - ${warning.message}`);
  if (warning.stack) {
    logger.warn(warning.stack);
  }
});

module.exports = app;
