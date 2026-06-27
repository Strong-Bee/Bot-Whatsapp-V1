const midtransClient = require("midtrans-client");
const config = require("../config/config");

const snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey,
});

class MidtransService {
  static async createTransaction(parameter) {
    try {
      const transaction = await snap.createTransaction(parameter);
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  static async getTransactionStatus(orderId) {
    const coreApi = new midtransClient.CoreApi({
      isProduction: config.midtrans.isProduction,
      serverKey: config.midtrans.serverKey,
      clientKey: config.midtrans.clientKey,
    });
    try {
      const status = await coreApi.transaction.status(orderId);
      return status;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MidtransService;
