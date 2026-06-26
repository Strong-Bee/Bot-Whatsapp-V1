const fs = require("fs");
const path = require("path");
const googleSheetsService = require("../services/GoogleSheetsService");
const logger = require("../utils/logger");

class SubscriptionModel {
  constructor() {
    this.subscriptionsPath = path.join(
      __dirname,
      "../../data/subscriptions.json",
    );
    this.ensureDataDirectory();
    this.subscriptions = this.loadSubscriptions();
    this.useGoogleSheets = false;
    this.syncWithGoogleSheets();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.subscriptionsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadSubscriptions() {
    try {
      if (fs.existsSync(this.subscriptionsPath)) {
        const data = fs.readFileSync(this.subscriptionsPath, "utf8");
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      return [];
    }
  }

  saveSubscriptions() {
    try {
      fs.writeFileSync(
        this.subscriptionsPath,
        JSON.stringify(this.subscriptions, null, 2),
      );
      this.syncToGoogleSheets();
    } catch (error) {
      console.error("Error saving subscriptions:", error);
    }
  }

  async syncWithGoogleSheets() {
    try {
      const data = await googleSheetsService.getAllSubscriptionsFromSheet();
      if (data && data.length > 0) {
        this.subscriptions = data;
        this.saveSubscriptions();
        this.useGoogleSheets = true;
        logger.info("✅ Synced subscriptions with Google Sheets");
      }
    } catch (error) {
      logger.error(`❌ Failed to sync with Google Sheets: ${error.message}`);
    }
  }

  async syncToGoogleSheets() {
    try {
      if (this.useGoogleSheets) {
        for (const sub of this.subscriptions) {
          await googleSheetsService.updateSubscriptionInSheet(
            sub.clientPhone,
            sub,
          );
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to sync to Google Sheets: ${error.message}`);
    }
  }

  createSubscription(clientPhone, clientName, durationDays = 30) {
    const existing = this.getSubscriptionByPhone(clientPhone);
    if (existing) {
      throw new Error("Client sudah memiliki subscription");
    }

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clientPhone: clientPhone,
      clientName: clientName,
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      durationDays: durationDays,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      customCommands: [],
      stats: {
        totalCommands: 0,
        lastUsed: null,
      },
    };

    this.subscriptions.push(subscription);
    this.saveSubscriptions();
    googleSheetsService.saveSubscription(subscription);

    return subscription;
  }

  getSubscriptionByPhone(phone) {
    return this.subscriptions.find(
      (sub) => sub.clientPhone === phone && sub.isActive === true,
    );
  }

  getSubscriptionById(id) {
    return this.subscriptions.find((sub) => sub.id === id);
  }

  extendSubscription(phone, additionalDays) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      throw new Error("Subscription tidak ditemukan");
    }

    const newExpiry = new Date(sub.expiryDate);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    sub.expiryDate = newExpiry.toISOString();
    sub.durationDays += additionalDays;
    sub.updatedAt = new Date().toISOString();

    this.saveSubscriptions();
    return sub;
  }

  isSubscriptionActive(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return false;

    const now = new Date();
    const expiry = new Date(sub.expiryDate);
    return now <= expiry && sub.isActive === true;
  }

  getRemainingDays(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return 0;

    const now = new Date();
    const expiry = new Date(sub.expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  deactivateSubscription(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      throw new Error("Subscription tidak ditemukan");
    }

    sub.isActive = false;
    sub.updatedAt = new Date().toISOString();
    this.saveSubscriptions();
    return sub;
  }

  getAllSubscriptions() {
    return this.subscriptions.map((sub) => ({
      ...sub,
      remainingDays: this.getRemainingDays(sub.clientPhone),
      isActive: this.isSubscriptionActive(sub.clientPhone),
    }));
  }

  getActiveSubscriptions() {
    return this.subscriptions.filter((sub) =>
      this.isSubscriptionActive(sub.clientPhone),
    );
  }

  addCustomCommand(phone, command, response) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      throw new Error("Subscription tidak ditemukan atau tidak aktif");
    }

    const existing = sub.customCommands.find((cmd) => cmd.command === command);
    if (existing) {
      throw new Error(`Command /${command} sudah ada!`);
    }

    const builtInCommands = [
      "status-bot",
      "os",
      "menu",
      "help",
      "ping",
      "info",
      "time",
      "sticker",
      "contact",
      "myrole",
      "add",
      "list",
      "edit",
      "del",
      "buy",
      "payment",
      "my-sub",
      "my-payments",
      "payment-status",
    ];
    if (builtInCommands.includes(command.toLowerCase())) {
      throw new Error(
        `Command /${command} adalah command bawaan yang tidak bisa ditambahkan!`,
      );
    }

    const newCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      command: command.toLowerCase(),
      response: response,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0,
      isActive: true,
      isBuiltIn: false,
    };

    sub.customCommands.push(newCommand);
    sub.updatedAt = new Date().toISOString();
    this.saveSubscriptions();
    return newCommand;
  }

  getCustomCommands(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return [];
    return sub.customCommands.filter((cmd) => cmd.isActive !== false);
  }

  getCustomCommand(phone, command) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return null;
    return sub.customCommands.find(
      (cmd) => cmd.command === command && cmd.isActive !== false,
    );
  }

  updateCustomCommand(phone, command, newResponse) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      throw new Error("Subscription tidak ditemukan atau tidak aktif");
    }

    const cmd = sub.customCommands.find((c) => c.command === command);
    if (!cmd) {
      throw new Error(`Command /${command} tidak ditemukan!`);
    }

    if (cmd.isBuiltIn) {
      throw new Error(
        `Command /${command} adalah command bawaan dan tidak bisa diubah!`,
      );
    }

    cmd.response = newResponse;
    cmd.updatedAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();
    this.saveSubscriptions();
    return cmd;
  }

  deleteCustomCommand(phone, command) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      throw new Error("Subscription tidak ditemukan atau tidak aktif");
    }

    const cmd = sub.customCommands.find((c) => c.command === command);
    if (!cmd) {
      throw new Error(`Command /${command} tidak ditemukan!`);
    }

    if (cmd.isBuiltIn) {
      throw new Error(
        `Command /${command} adalah command bawaan dan tidak bisa dihapus!`,
      );
    }

    sub.customCommands = sub.customCommands.filter(
      (c) => c.command !== command,
    );
    sub.updatedAt = new Date().toISOString();
    this.saveSubscriptions();
    return true;
  }

  incrementCommandUsage(phone, command) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return;

    const cmd = sub.customCommands.find((c) => c.command === command);
    if (cmd) {
      cmd.usage = (cmd.usage || 0) + 1;
      sub.stats.totalCommands = (sub.stats.totalCommands || 0) + 1;
      sub.stats.lastUsed = new Date().toISOString();
      this.saveSubscriptions();
    }
  }

  getSubscriptionStats(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) return null;

    return {
      clientName: sub.clientName,
      clientPhone: sub.clientPhone,
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      remainingDays: this.getRemainingDays(phone),
      isActive: this.isSubscriptionActive(phone),
      totalCommands: sub.stats?.totalCommands || 0,
      customCommands: sub.customCommands.length,
      lastUsed: sub.stats?.lastUsed || null,
    };
  }

  getStatusMessage(phone) {
    const sub = this.getSubscriptionByPhone(phone);
    if (!sub) {
      return {
        status: "tidak_terdaftar",
        message:
          "❌ Anda belum terdaftar sebagai client. Ketik /buy untuk berlangganan.",
      };
    }

    const isActive = this.isSubscriptionActive(phone);
    const remainingDays = this.getRemainingDays(phone);

    if (!isActive) {
      return {
        status: "expired",
        message: `⚠️ *Subscription Anda Telah Berakhir!*\n━━━━━━━━━━━━━━━━━━\n📱 Phone: ${phone}\n📅 Expired: ${new Date(sub.expiryDate).toLocaleDateString("id-ID")}\n\n💡 Ketik /buy untuk perpanjangan.`,
      };
    }

    return {
      status: "active",
      message: `✅ *Status Subscription*\n━━━━━━━━━━━━━━━━━━\n📱 Phone: ${phone}\n👤 Client: ${sub.clientName}\n📅 Mulai: ${new Date(sub.startDate).toLocaleDateString("id-ID")}\n📅 Berakhir: ${new Date(sub.expiryDate).toLocaleDateString("id-ID")}\n⏳ Sisa: ${remainingDays} hari\n📊 Total Command: ${sub.stats?.totalCommands || 0}\n🔧 Custom Commands: ${sub.customCommands.length}\n━━━━━━━━━━━━━━━━━━\n💡 Ketik /menu untuk melihat perintah`,
    };
  }

  getOSInfo() {
    const os = require("os");
    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      uptime: os.uptime(),
      hostname: os.hostname(),
      loadAverage: os.loadavg(),
    };
  }

  formatOSInfo() {
    const info = this.getOSInfo();
    const usedMemoryGB = (info.memory.used / 1024 ** 3).toFixed(2);
    const totalMemoryGB = (info.memory.total / 1024 ** 3).toFixed(2);
    const uptime = this.formatUptime(info.uptime);

    return `
*💻 SISTEM OPERASI*
━━━━━━━━━━━━━━━━━━
🖥️ *Platform:* ${info.platform} (${info.arch})
📦 *Release:* ${info.release}
🧠 *CPU:* ${info.cpu} Core
💾 *Memory:* ${usedMemoryGB}GB / ${totalMemoryGB}GB
⏱️ *Uptime:* ${uptime}
📡 *Hostname:* ${info.hostname}
📊 *Load Average:* ${info.loadAverage.map((l) => l.toFixed(2)).join(", ")}
━━━━━━━━━━━━━━━━━━
⏱ ${new Date().toLocaleString("id-ID")}
    `;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(" ") || "0s";
  }
}

module.exports = new SubscriptionModel();
