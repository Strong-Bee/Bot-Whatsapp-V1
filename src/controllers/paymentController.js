const midtransService = require("../services/MidtransService");
const googleSheetsService = require("../services/GoogleSheetsService");
const subscriptionModel = require("../models/SubscriptionModel");
const logger = require("../utils/logger");
const Helper = require("../utils/helper");

class PaymentController {
  // Create payment
  async createPayment(req, res) {
    try {
      const { phone, name, durationDays } = req.body;

      if (!phone || !name) {
        return res.status(400).json({
          success: false,
          message: "Phone dan name wajib diisi!",
        });
      }

      // Validasi format nomor
      if (!Helper.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid!",
        });
      }

      const days =
        durationDays || parseInt(process.env.SUBSCRIPTION_DEFAULT_DAYS) || 30;

      const result = await midtransService.createSubscriptionPayment(
        phone,
        name,
        days,
      );

      if (result.success) {
        // Log payment creation
        logger.info(`Payment created: ${result.data.orderId} for ${phone}`);

        res.json({
          success: true,
          data: {
            orderId: result.data.orderId,
            paymentUrl: result.data.paymentUrl,
            amount: result.data.amount,
            durationDays: days,
          },
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error(`Payment creation error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Payment notification (webhook from Midtrans)
  async paymentNotification(req, res) {
    try {
      const notificationData = req.body;

      logger.info(
        `Payment notification received: ${JSON.stringify(notificationData)}`,
      );

      const result = await midtransService.handleNotification(notificationData);

      if (result.success) {
        // Log notification
        logger.info(
          `Payment notification processed: ${result.data.orderId} - ${result.data.status}`,
        );

        // Handle successful payment
        if (result.data.status === "success") {
          const paymentResult = await midtransService.handleSuccessfulPayment(
            result.data.orderId,
            result.data.fullResponse,
          );

          if (paymentResult.success) {
            logger.info(
              `Subscription activated for order: ${result.data.orderId}`,
            );
          }
        }

        res.json({
          success: true,
          message: "Notification processed",
          data: {
            orderId: result.data.orderId,
            status: result.data.status,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error(`Payment notification error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID wajib diisi!",
        });
      }

      const result = await midtransService.checkPaymentStatus(orderId);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error(`Payment status check error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get payment history by phone
  async getPaymentHistory(req, res) {
    try {
      const { phone } = req.params;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone wajib diisi!",
        });
      }

      const payments = await googleSheetsService.getPaymentsByPhone(phone);

      res.json({
        success: true,
        data: payments,
        total: payments.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Payment history error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all payments (admin only)
  async getAllPayments(req, res) {
    try {
      const data = await googleSheetsService.getSheetData(
        process.env.GOOGLE_SHEETS_PAYMENT_SHEET || "Payments",
      );

      if (!data || data.length <= 1) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          timestamp: new Date().toISOString(),
        });
      }

      const payments = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          payments.push({
            paymentId: data[i][0],
            orderId: data[i][1],
            phone: data[i][2],
            name: data[i][3],
            amount: parseInt(data[i][4]),
            paymentType: data[i][5],
            status: data[i][6],
            transactionTime: data[i][7],
            paymentUrl: data[i][8] || "",
            createdAt: data[i][9],
            updatedAt: data[i][10],
          });
        }
      }

      res.json({
        success: true,
        data: payments,
        total: payments.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Get all payments error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cancel payment
  async cancelPayment(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID wajib diisi!",
        });
      }

      const result = await midtransService.cancelTransaction(orderId);

      if (result.success) {
        // Update payment status
        const payment = await googleSheetsService.getPaymentFromSheet(orderId);
        if (payment) {
          payment.status = "cancel";
          payment.updatedAt = new Date().toISOString();
          await googleSheetsService.updatePaymentInSheet(orderId, payment);
        }

        logger.info(`Payment cancelled: ${orderId}`);

        res.json({
          success: true,
          message: "Payment cancelled successfully",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error(`Payment cancellation error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Generate payment link for WhatsApp
  async generatePaymentLink(req, res) {
    try {
      const { phone, name, durationDays } = req.body;

      if (!phone || !name) {
        return res.status(400).json({
          success: false,
          message: "Phone dan name wajib diisi!",
        });
      }

      // Validasi format nomor
      if (!Helper.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid!",
        });
      }

      const days =
        durationDays || parseInt(process.env.SUBSCRIPTION_DEFAULT_DAYS) || 30;

      const result = await midtransService.createSubscriptionPayment(
        phone,
        name,
        days,
      );

      if (result.success) {
        res.json({
          success: true,
          data: {
            paymentUrl: result.data.paymentUrl,
            orderId: result.data.orderId,
            amount: result.data.amount,
            durationDays: days,
          },
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error(`Payment link generation error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get payment statistics (admin only)
  async getPaymentStats(req, res) {
    try {
      const payments = await googleSheetsService.getSheetData(
        process.env.GOOGLE_SHEETS_PAYMENT_SHEET || "Payments",
      );

      let totalPayments = 0;
      let totalAmount = 0;
      let successCount = 0;
      let pendingCount = 0;
      let failedCount = 0;

      if (payments && payments.length > 1) {
        for (let i = 1; i < payments.length; i++) {
          if (payments[i][0]) {
            totalPayments++;
            totalAmount += parseInt(payments[i][4] || 0);

            const status = payments[i][6] || "pending";
            if (status === "success") successCount++;
            else if (status === "pending") pendingCount++;
            else failedCount++;
          }
        }
      }

      res.json({
        success: true,
        data: {
          totalPayments,
          totalAmount,
          successCount,
          pendingCount,
          failedCount,
          successRate:
            totalPayments > 0
              ? ((successCount / totalPayments) * 100).toFixed(2) + "%"
              : "0%",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Payment stats error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
