class Helper {
  static formatPhoneNumber(number) {
    if (!number) return "";
    let clean = number.replace(/[^0-9]/g, "");

    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }

    if (
      !clean.startsWith("62") &&
      !clean.startsWith("8") &&
      !clean.startsWith("7")
    ) {
      clean = "62" + clean;
    }

    return clean;
  }

  static validatePhoneNumber(number) {
    if (!number) return false;
    const clean = this.formatPhoneNumber(number);
    return clean.length >= 10 && clean.length <= 15;
  }

  static getCurrentTime() {
    return new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  static getCustomCommandList() {
    try {
      const userModel = require("../models/UserModel");
      const commands = userModel.getCustomCommands();
      return commands.filter((cmd) => cmd.isActive !== false);
    } catch {
      return [];
    }
  }

  static generateMenu(role = "user") {
    const roleBadge = this.getRoleBadge(role);

    let menu = `
*📱 BOT COMMANDS*
━━━━━━━━━━━━━━━━━━━━━━━━━━

*📋 Built-in Commands*
┌─────────────────────────────┐
│ /status-bot • Status bot    │
│ /os         • Info sistem   │
│ /menu       • Tampilkan menu│
│ /help       • Bantuan       │
│ /ping       • Cek koneksi   │
│ /time       • Waktu saat ini│
│ /sticker    • Buat stiker   │
│ /contact    • Kontak admin  │
└─────────────────────────────┘`;

    if (role === "admin" || role === "owner") {
      menu += `

*👥 Admin Commands*
┌─────────────────────────────┐
│ /users      • Lihat user    │
│ /stats      • Statistik bot │
│ /subscribe  • Buat sub      │
│ /extend     • Perpanjang    │
│ /subs       • Daftar sub    │
└─────────────────────────────┘`;
    }

    if (role === "owner") {
      menu += `

*👑 Owner Commands*
┌─────────────────────────────┐
│ /register   • Register user │
│ /block      • Block nomor   │
│ /unblock    • Unblock nomor │
│ /blocked    • Daftar block  │
└─────────────────────────────┘`;
    }

    menu += `
━━━━━━━━━━━━━━━━━━━━━━━━━━
*🎯 Role:* ${roleBadge}
*💡 Tips:* Ketik /help untuk bantuan

_© 2026 WhatsApp Bot Express_`;

    return menu;
  }

  static generateSubscriptionMenu(phone) {
    const subscriptionModel = require("../models/SubscriptionModel");
    const isActive = subscriptionModel.isSubscriptionActive(phone);
    const remainingDays = subscriptionModel.getRemainingDays(phone);
    const customCommands = subscriptionModel.getCustomCommands(phone);
    const sub = subscriptionModel.getSubscriptionByPhone(phone);

    let menu = `
*📱 BOT COMMANDS*
━━━━━━━━━━━━━━━━━━━━━━━━━━

*📋 Built-in Commands*
┌─────────────────────────────┐
│ /status-bot • Status bot    │
│ /os         • Info sistem   │
│ /menu       • Tampilkan menu│
│ /help       • Bantuan       │
│ /ping       • Cek koneksi   │
│ /time       • Waktu saat ini│
│ /sticker    • Buat stiker   │
│ /contact    • Kontak admin  │
└─────────────────────────────┘`;

    if (isActive) {
      menu += `

*🔧 Your Custom Commands*
┌─────────────────────────────┐`;
      if (customCommands.length > 0) {
        customCommands.slice(0, 10).forEach((cmd) => {
          const cmdDisplay = cmd.command.padEnd(7);
          const respDisplay = cmd.response.substring(0, 25);
          menu += `\n│ /${cmdDisplay} • ${respDisplay}${cmd.response.length > 25 ? "..." : ""}`;
        });
        if (customCommands.length > 10) {
          menu += `\n│ ... dan ${customCommands.length - 10} lainnya`;
        }
      } else {
        menu += `\n│ Belum ada custom command    │`;
      }
      menu += `\n└─────────────────────────────┘`;

      menu += `

*📝 Manage Commands*
┌─────────────────────────────┐
│ /add     • Tambah command   │
│ /list    • Lihat command    │
│ /edit    • Edit command     │
│ /del     • Hapus command    │
└─────────────────────────────┘`;
    }

    const statusIcon = isActive ? "🟢" : "🔴";
    const statusText = isActive
      ? `Active (${remainingDays} hari)`
      : "Inactive / Expired";

    menu += `
━━━━━━━━━━━━━━━━━━━━━━━━━━
*📊 Subscription Status*
${statusIcon} Status: ${statusText}
👤 Client: ${sub ? sub.clientName : "Not Registered"}
📅 Expiry: ${sub ? new Date(sub.expiryDate).toLocaleDateString("id-ID") : "N/A"}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Ketik /status-bot untuk detail

_© 2026 WhatsApp Bot Express_`;

    return menu;
  }

  static getRoleBadge(role) {
    const badges = {
      owner: "👑 Owner",
      admin: "🛡️ Admin",
      user: "👤 User",
    };
    return badges[role] || "👤 User";
  }

  static sanitizePhone(phone) {
    if (!phone) return "N/A";
    if (phone.length > 8) {
      return phone.substring(0, 4) + "****" + phone.substring(phone.length - 4);
    }
    return phone;
  }

  static formatDate(date, format = "full") {
    const d = new Date(date);
    const formats = {
      full: d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      short: d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      iso: d.toISOString(),
      timestamp: Math.floor(d.getTime() / 1000),
    };
    return formats[format] || formats.full;
  }

  static formatDuration(seconds) {
    if (!seconds || seconds < 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  }

  static getRelativeTime(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} minggu yang lalu`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} bulan yang lalu`;
    return `${Math.floor(diff / 31536000)} tahun yang lalu`;
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static isValidMessage(text) {
    if (!text) return false;
    const clean = text.trim();
    if (clean.length === 0) return false;
    if (clean.length > 4096) return false;
    return true;
  }

  static validatePasswordStrength(password) {
    if (!password)
      return { valid: false, message: "Password tidak boleh kosong" };
    if (password.length < 8) {
      return { valid: false, message: "Password minimal 8 karakter" };
    }
    if (password.length > 50) {
      return { valid: false, message: "Password maksimal 50 karakter" };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return {
        valid: false,
        message:
          "Password harus mengandung huruf besar, huruf kecil, angka, dan simbol",
      };
    }
    return { valid: true, message: "Password valid" };
  }

  static formatBotStats(stats) {
    return `
*📊 STATISTIK BOT*
━━━━━━━━━━━━━━━━━━━━━
📱 *Status:* ${stats.isReady ? "🟢 Online" : "🔴 Offline"}
⏱ *Uptime:* ${stats.uptime || "N/A"}
📨 *Total Pesan:* ${stats.totalMessages || 0}
🚫 *Blocked:* ${stats.blockedCount || 0}
👥 *Users:* ${stats.totalUsers || 0}
💾 *Memory:* ${stats.memory || "N/A"}
📅 *Server Time:* ${this.getCurrentTime()}
━━━━━━━━━━━━━━━━━━━━━`;
  }

  static formatUserInfo(user) {
    if (!user) return "❌ User tidak ditemukan";

    const statusIcon = user.isActive ? "✅" : "❌";
    const statusText = user.isActive ? "Aktif" : "Nonaktif";

    return `
*👤 INFORMASI USER*
━━━━━━━━━━━━━━━━━━━━━
📱 *Phone:* ${user.phone}
👤 *Name:* ${user.name}
🎭 *Role:* ${this.getRoleBadge(user.role)}
🟢 *Status:* ${statusIcon} ${statusText}
📅 *Bergabung:* ${this.formatDate(user.createdAt, "date")}
📋 *Permissions:* ${user.permissions ? user.permissions.join(", ") : "Tidak ada"}
━━━━━━━━━━━━━━━━━━━━━`;
  }

  static getGreeting() {
    const hour = new Date().getHours();
    if (hour < 5) return "Selamat dini hari 🌙";
    if (hour < 12) return "Selamat pagi 🌅";
    if (hour < 15) return "Selamat siang ☀️";
    if (hour < 18) return "Selamat sore 🌤️";
    return "Selamat malam 🌙";
  }

  static formatCustomCommandList(commands) {
    if (!commands || commands.length === 0) {
      return "📋 *Belum ada custom command*\n\n💡 Tambahkan dengan /add [command] [response]";
    }

    let list = `
*🔧 DAFTAR CUSTOM COMMAND*
━━━━━━━━━━━━━━━━━━━━━`;

    commands.forEach((cmd, i) => {
      const usage = cmd.usage || 0;
      list += `
${i + 1}. */${cmd.command}*
   📝 Response: ${cmd.response}
   📊 Usage: ${usage}x
   📅 Dibuat: ${this.getRelativeTime(cmd.createdAt)}`;
    });

    list += `
━━━━━━━━━━━━━━━━━━━━━
Total: ${commands.length} command`;

    return list;
  }

  static getTotalUsers() {
    try {
      const userModel = require("../models/UserModel");
      return userModel.getAllUsers().length;
    } catch {
      return 0;
    }
  }
}

module.exports = Helper;
