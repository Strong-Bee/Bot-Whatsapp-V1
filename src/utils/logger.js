const fs = require("fs");
const path = require("path");

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  logToFile(level, message) {
    try {
      const logFile = path.join(
        this.logDir,
        `${new Date().toISOString().split("T")[0]}.log`,
      );
      const logEntry = `[${this.getTimestamp()}] [${level}] ${message}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Silent fail untuk logging
    }
  }

  info(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${this.getTimestamp()} - ${message}`);
    this.logToFile("INFO", message);
  }

  success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${this.getTimestamp()} - ${message}`);
    this.logToFile("SUCCESS", message);
  }

  warn(message) {
    console.log(`\x1b[33m[WARN]\x1b[0m ${this.getTimestamp()} - ${message}`);
    this.logToFile("WARN", message);
  }

  error(message) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${this.getTimestamp()} - ${message}`);
    this.logToFile("ERROR", message);
  }
}

module.exports = new Logger();
