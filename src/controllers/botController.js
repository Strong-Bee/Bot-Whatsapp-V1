const whatsappService = require("../services/whatsappService");
const logger = require("../utils/logger");
const Helper = require("../utils/helper");
const subscriptionModel = require("../models/SubscriptionModel");
const userModel = require("../models/UserModel");

class BotController {
  // Get status bot
  getStatus(req, res) {
    try {
      const status = whatsappService.getStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error getting status: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send message
  async sendMessage(req, res) {
    try {
      const { number, message } = req.body;

      if (!number || !message) {
        return res.status(400).json({
          success: false,
          message: "Parameter number dan message wajib diisi!",
        });
      }

      if (!Helper.validatePhoneNumber(number)) {
        return res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid!",
        });
      }

      const result = await whatsappService.sendMessage(number, message);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send media
  async sendMedia(req, res) {
    try {
      const { number, mediaUrl, caption } = req.body;

      if (!number || !mediaUrl) {
        return res.status(400).json({
          success: false,
          message: "Parameter number dan mediaUrl wajib diisi!",
        });
      }

      if (!Helper.isValidUrl(mediaUrl)) {
        return res.status(400).json({
          success: false,
          message: "URL media tidak valid!",
        });
      }

      const result = await whatsappService.sendMedia(
        number,
        mediaUrl,
        caption || "",
      );
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error sending media: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send image from file
  async sendImage(req, res) {
    try {
      const { number, imagePath, caption } = req.body;

      if (!number || !imagePath) {
        return res.status(400).json({
          success: false,
          message: "Parameter number dan imagePath wajib diisi!",
        });
      }

      const result = await whatsappService.sendImage(
        number,
        imagePath,
        caption || "",
      );
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error sending image: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send buttons
  async sendButtons(req, res) {
    try {
      const { number, message, buttons, title } = req.body;

      if (!number || !message || !buttons || !Array.isArray(buttons)) {
        return res.status(400).json({
          success: false,
          message:
            "Parameter number, message, dan buttons (array) wajib diisi!",
        });
      }

      const result = await whatsappService.sendButtons(
        number,
        message,
        buttons,
        title || "",
      );
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error sending buttons: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Broadcast message
  async broadcastMessage(req, res) {
    try {
      const { numbers, message } = req.body;

      if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Parameter numbers (array) dan message wajib diisi!",
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Parameter message wajib diisi!",
        });
      }

      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (const number of numbers) {
        try {
          if (!Helper.validatePhoneNumber(number)) {
            results.push({
              number,
              status: "failed",
              error: "Format nomor tidak valid",
            });
            failedCount++;
            continue;
          }

          await whatsappService.sendMessage(number, message);
          results.push({ number, status: "success" });
          successCount++;

          // Delay untuk menghindari rate limit
          await Helper.sleep(1000);
        } catch (error) {
          results.push({ number, status: "failed", error: error.message });
          failedCount++;
        }
      }

      res.json({
        success: true,
        data: {
          total: numbers.length,
          success: successCount,
          failed: failedCount,
          details: results,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error broadcasting: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get contact info
  async getContact(req, res) {
    try {
      const { number } = req.params;

      if (!number) {
        return res.status(400).json({
          success: false,
          message: "Parameter number wajib diisi!",
        });
      }

      const contact = await whatsappService.getContact(number);
      res.json({
        success: true,
        data: {
          id: contact.id._serialized,
          number: contact.id.user,
          name: contact.name || contact.pushname || "Unknown",
          isGroup: contact.isGroup,
          isMe: contact.isMe,
          isOnline: contact.isOnline,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error getting contact: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Webhook
  async webhook(req, res) {
    try {
      const { event, data } = req.body;

      if (!event || !data) {
        return res.status(400).json({
          success: false,
          message: "Parameter event dan data wajib diisi!",
        });
      }

      logger.info(`Webhook received: ${event}`);

      // Process webhook data
      if (event === "message" && data.from && data.body) {
        await whatsappService.sendMessage(
          data.from,
          `📨 Terima kasih! Pesan Anda: "${data.body}" telah diterima.`,
        );
      }

      res.json({
        success: true,
        message: "Webhook processed",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Webhook error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get bot stats (admin only via API)
  async getBotStats(req, res) {
    try {
      const status = whatsappService.getStatus();
      const totalUsers = userModel.getAllUsers().length;
      const subscriptions = subscriptionModel.getAllSubscriptions();
      const activeSubs = subscriptionModel.getActiveSubscriptions();

      res.json({
        success: true,
        data: {
          bot: {
            status: status.status,
            isReady: status.isReady,
            phone: status.phone || "N/A",
            name: status.name || "N/A",
            mode: status.mode || "stealth",
          },
          users: {
            total: totalUsers,
            owner: userModel.getAllUsers().filter((u) => u.role === "owner")
              .length,
            admin: userModel.getAllUsers().filter((u) => u.role === "admin")
              .length,
            user: userModel.getAllUsers().filter((u) => u.role === "user")
              .length,
          },
          subscriptions: {
            total: subscriptions.length,
            active: activeSubs.length,
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error getting bot stats: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new BotController();
