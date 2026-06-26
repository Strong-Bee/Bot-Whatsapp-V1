const midtransClient = require("midtrans-client");
const logger = require("../utils/logger");
const Helper = require("../utils/helper");

class MidtransService {
  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY;
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY;
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    this.notificationUrl = process.env.MIDTRANS_PAYMENT_NOTIFICATION_URL;
    this.finishUrl = process.env.MIDTRANS_FINISH_URL;
    this.unfinishUrl = process.env.MIDTRANS_UNFINISH_URL;
    this.errorUrl = process.env.MIDTRANS_ERROR_URL;

    this.snap = null;
    this.core = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!this.serverKey || !this.clientKey) {
        logger.warn("⚠️ Midtrans credentials not configured.");
        return;
      }

      this.snap = new midtransClient.Snap({
        isProduction: this.isProduction,
        serverKey: this.serverKey,
        clientKey: this.clientKey,
      });

      this.core = new midtransClient.CoreApi({
        isProduction: this.isProduction,
        serverKey: this.serverKey,
        clientKey: this.clientKey,
      });

      logger.success("✅ Midtrans initialized");
    } catch (error) {
      logger.error(`❌ Midtrans initialization failed: ${error.message}`);
    }
  }

  // Create payment transaction
  async createTransaction(
    orderId,
    amount,
    customerName,
    customerPhone,
    customerEmail = "",
  ) {
    try {
      if (!this.snap) {
        throw new Error("Midtrans not initialized");
      }

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: customerName,
          phone: customerPhone,
          email: customerEmail || `${customerPhone}@whatsapp.bot`,
        },
        item_details: [
          {
            id: "subscription",
            price: amount,
            quantity: 1,
            name: `WhatsApp Bot Subscription - ${customerName}`,
          },
        ],
        credit_card: {
          secure: true,
        },
        callbacks: {
          finish: this.finishUrl,
          unfinish: this.unfinishUrl,
          error: this.errorUrl,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);

      logger.info(`✅ Midtrans transaction created: ${orderId}`);

      return {
        success: true,
        data: {
          orderId: orderId,
          amount: amount,
          token: transaction.token,
          redirectUrl: transaction.redirect_url,
          paymentUrl: transaction.redirect_url,
        },
      };
    } catch (error) {
      logger.error(`❌ Midtrans transaction failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Create subscription payment
  async createSubscriptionPayment(phone, name, durationDays = 30) {
    const price = parseInt(process.env.SUBSCRIPTION_PRICE) || 100000;
    const amount = price * (durationDays / 30);
    const orderId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const transaction = await this.createTransaction(
      orderId,
      Math.round(amount),
      name,
      phone,
    );

    if (transaction.success) {
      // Save payment to database
      const googleSheetsService = require("./GoogleSheetsService");
      const payment = {
        paymentId: orderId,
        orderId: orderId,
        phone: phone,
        name: name,
        amount: Math.round(amount),
        paymentType: "midtrans",
        status: "pending",
        transactionTime: new Date().toISOString(),
        paymentUrl: transaction.data.redirectUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await googleSheetsService.savePayment(payment);

      return {
        success: true,
        data: {
          orderId: orderId,
          paymentUrl: transaction.data.redirectUrl,
          amount: Math.round(amount),
          durationDays: durationDays,
        },
        message: `💰 *Pembayaran Subscription*\n━━━━━━━━━━━━━━━━━━\n📱 Phone: ${phone}\n👤 Name: ${name}\n💰 Amount: Rp${Math.round(amount).toLocaleString()}\n📅 Duration: ${durationDays} hari\n━━━━━━━━━━━━━━━━━━\n🔗 Klik link berikut untuk pembayaran:\n${transaction.data.redirectUrl}\n\n⏳ Pembayaran berlaku 24 jam.`,
      };
    }

    return {
      success: false,
      message: "❌ Gagal membuat pembayaran. Silakan coba lagi.",
    };
  }

  // Get transaction status
  async getTransactionStatus(orderId) {
    try {
      if (!this.core) {
        throw new Error("Midtrans not initialized");
      }

      const status = await this.core.transaction.status(orderId);

      return {
        success: true,
        data: {
          orderId: status.order_id,
          transactionId: status.transaction_id,
          status: status.transaction_status,
          statusMessage: status.status_message,
          paymentType: status.payment_type,
          grossAmount: status.gross_amount,
          transactionTime: status.transaction_time,
          fraudStatus: status.fraud_status,
          vaNumbers: status.va_numbers || [],
          pdfUrl: status.pdf_url,
        },
      };
    } catch (error) {
      logger.error(`❌ Midtrans status check failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId) {
    const status = await this.getTransactionStatus(orderId);
    return status;
  }

  // Cancel transaction
  async cancelTransaction(orderId) {
    try {
      if (!this.core) {
        throw new Error("Midtrans not initialized");
      }

      const result = await this.core.transaction.cancel(orderId);

      logger.info(`✅ Midtrans transaction cancelled: ${orderId}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error(`❌ Midtrans cancellation failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Handle payment notification
  async handleNotification(notificationData) {
    try {
      if (!this.core) {
        throw new Error("Midtrans not initialized");
      }

      const statusResponse =
        await this.core.transaction.notification(notificationData);

      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      let status = "pending";
      let message = "";

      // Determine payment status
      if (transactionStatus === "capture") {
        if (fraudStatus === "challenge") {
          status = "challenge";
          message = "Payment is challenged";
        } else if (fraudStatus === "accept") {
          status = "success";
          message = "Payment successful";
        }
      } else if (transactionStatus === "settlement") {
        status = "success";
        message = "Payment settled";
      } else if (transactionStatus === "deny") {
        status = "deny";
        message = "Payment denied";
      } else if (transactionStatus === "cancel") {
        status = "cancel";
        message = "Payment cancelled";
      } else if (transactionStatus === "expire") {
        status = "expire";
        message = "Payment expired";
      } else if (transactionStatus === "pending") {
        status = "pending";
        message = "Payment pending";
      }

      return {
        success: true,
        data: {
          orderId,
          status,
          message,
          fullResponse: statusResponse,
        },
      };
    } catch (error) {
      logger.error(
        `❌ Midtrans notification handling failed: ${error.message}`,
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Handle successful payment
  async handleSuccessfulPayment(orderId, transactionData) {
    try {
      const googleSheetsService = require("./GoogleSheetsService");
      const subscriptionModel = require("../models/SubscriptionModel");

      // Get payment data
      const payment = await googleSheetsService.getPaymentFromSheet(orderId);
      if (!payment) {
        return {
          success: false,
          message: "Payment not found",
        };
      }

      // Update payment status
      payment.status = "success";
      payment.updatedAt = new Date().toISOString();
      await googleSheetsService.updatePaymentInSheet(orderId, payment);

      // Create or extend subscription
      const price = parseInt(process.env.SUBSCRIPTION_PRICE) || 100000;
      const durationDays = Math.round((payment.amount / price) * 30);

      const existingSub = subscriptionModel.getSubscriptionByPhone(
        payment.phone,
      );
      if (existingSub) {
        // Extend existing subscription
        subscriptionModel.extendSubscription(payment.phone, durationDays);
        logger.info(
          `Subscription extended for ${payment.phone} (+${durationDays} days)`,
        );
      } else {
        // Create new subscription
        subscriptionModel.createSubscription(
          payment.phone,
          payment.name,
          durationDays,
        );
        logger.info(
          `New subscription created for ${payment.phone} (${durationDays} days)`,
        );
      }

      return {
        success: true,
        message: "✅ Pembayaran berhasil! Subscription Anda telah diaktifkan.",
      };
    } catch (error) {
      logger.error(`❌ Handle successful payment failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Generate payment link for WhatsApp
  generatePaymentLink(orderId, amount, customerName, customerPhone) {
    const baseUrl = this.isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";

    return `${baseUrl}/payment/${orderId}`;
  }
}

module.exports = new MidtransService();
