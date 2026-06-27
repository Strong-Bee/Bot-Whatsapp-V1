const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const logger = require("../utils/logger");

let client;
let messageCallback = null;

function initialize(callback) {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./session" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    logger.info("QR Code received, scan please!");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    logger.info("WhatsApp authenticated");
  });

  client.on("ready", () => {
    logger.info("WhatsApp client is ready!");
  });

  client.on("message", async (message) => {
    if (messageCallback) {
      await messageCallback(message);
    }
  });

  client.on("disconnected", (reason) => {
    logger.warn("Client disconnected:", reason);
    initialize(callback);
  });

  messageCallback = callback;
  client.initialize();
  return client;
}

function getClient() {
  return client;
}

async function sendMessage(to, text) {
  if (!client) throw new Error("WhatsApp client not initialized");
  const formatted = to.includes("@c.us") ? to : `${to}@c.us`;
  await client.sendMessage(formatted, text);
}

module.exports = { initialize, getClient, sendMessage };
