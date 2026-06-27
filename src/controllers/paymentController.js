const fs = require("fs");
const path = require("path");
const MidtransService = require("../services/MidtransService");
const UserModel = require("../models/UserModel");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const pendingOrdersPath = path.join(
  __dirname,
  "../../data/pending_orders.json",
);

function readPendingOrders() {
  try {
    return JSON.parse(fs.readFileSync(pendingOrdersPath, "utf8"));
  } catch {
    return [];
  }
}

function writePendingOrders(orders) {
  fs.writeFileSync(pendingOrdersPath, JSON.stringify(orders, null, 2));
}

exports.createTransaction = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plans = {
      basic: { price: 50000, name: "Basic Plan", durationDays: 30 },
      premium: { price: 100000, name: "Premium Plan", durationDays: 365 },
    };
    const plan = plans[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const orderId = `ORDER-${uuidv4()}`;
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.price,
      },
      item_details: [
        {
          id: planId,
          price: plan.price,
          quantity: 1,
          name: plan.name,
        },
      ],
      customer_details: {
        first_name: user.username,
        email: `${user.username}@example.com`,
      },
    };

    const transaction = await MidtransService.createTransaction(parameter);

    const pending = readPendingOrders();
    pending.push({
      orderId,
      userId: user.id,
      planId,
      durationDays: plan.durationDays,
    });
    writePendingOrders(pending);

    res.json({
      transactionToken: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId,
    });
  } catch (err) {
    logger.error("Create transaction error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    logger.info("Payment notification:", notification);
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        const pendingOrders = readPendingOrders();
        const pending = pendingOrders.find((p) => p.orderId === orderId);
        if (pending) {
          const user = UserModel.findById(pending.userId);
          if (user) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + pending.durationDays);
            UserModel.updateUser(user.id, {
              subscription: {
                type: pending.planId,
                expiry: expiry.toISOString(),
              },
            });
            // Jika berlangganan, upgrade role ke 'subscriber' secara otomatis
            UserModel.updateUser(user.id, { role: "subscriber" });
            const remaining = pendingOrders.filter(
              (p) => p.orderId !== orderId,
            );
            writePendingOrders(remaining);
            logger.info(
              `Subscription activated for user ${user.username}, role updated to subscriber`,
            );
          }
        }
      }
    }
    res.status(200).json({ status: "OK" });
  } catch (err) {
    logger.error("Notification error:", err);
    res.status(500).json({ error: err.message });
  }
};
