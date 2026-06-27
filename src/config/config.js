require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "defaultsecret",
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    merchantId: process.env.MIDTRANS_MERCHANT_ID,
  },
};
