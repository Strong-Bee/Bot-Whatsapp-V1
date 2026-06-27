const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function getLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `${date}.log`);
}

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.length ? JSON.stringify(args) : ""}`;
  console.log(logMessage);
  fs.appendFileSync(getLogFile(), logMessage + "\n");
}

module.exports = {
  info: (msg, ...args) => log("info", msg, ...args),
  warn: (msg, ...args) => log("warn", msg, ...args),
  error: (msg, ...args) => log("error", msg, ...args),
  debug: (msg, ...args) => log("debug", msg, ...args),
};
