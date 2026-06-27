require("dotenv").config();
const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const botRoutes = require("./routes/botRoutes");
const { initializeBot } = require("./controllers/botController");
const logger = require("./utils/logger");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bot", botRoutes);

app.get("/", (req, res) => {
  res.send("WhatsApp Bot API is running");
});

initializeBot();

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  console.log(`Server running on port ${config.port}`);
});
