const whatsappService = require("../services/whatsappService");
const UserModel = require("../models/UserModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const { isPremium } = require("../utils/helper");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

const commandHandlers = new Map();

function registerDefaultCommands() {
  commandHandlers.set("!help", async (msg, user) => {
    let helpText =
      "*Available Commands:*\n!help - Show this help\n!ping - Pong!\n!subscribe - Info langganan premium\n!myprofile - Info profil kamu";
    if (user && user.subscription && isPremium(user.subscription)) {
      helpText +=
        "\n\n*Premium Commands:*\n!premium - Cek status premium\n!addcmd <nama> <balasan> - Tambah custom command\n!delcmd <nama> - Hapus custom command\n!listcmd - Lihat custom commands";
    }
    if (user && (user.role === "admin" || user.role === "owner")) {
      helpText +=
        "\n\n*Admin Commands:*\n!listusers - Lihat semua user (segera)";
    }
    await msg.reply(helpText);
  });

  commandHandlers.set("!ping", async (msg) => {
    await msg.reply("Pong! 🏓");
  });

  commandHandlers.set("!subscribe", async (msg) => {
    const plans = SubscriptionModel.getPlans();
    if (plans.length === 0) {
      await msg.reply("Belum ada paket langganan tersedia.");
      return;
    }
    let text = "*Paket Langganan:*\n";
    plans.forEach((p) => {
      text += `- ${p.id}: ${p.name} - Rp${p.price} / ${p.durationDays} hari\n`;
    });
    text += "\nKetik !buy <planId> untuk membeli.";
    await msg.reply(text);
  });

  commandHandlers.set("!myprofile", async (msg, user) => {
    if (!user) {
      await msg.reply("Kamu belum terdaftar. Silakan daftar melalui API.");
      return;
    }
    const sub = user.subscription
      ? `${user.subscription.type} sampai ${new Date(user.subscription.expiry).toLocaleDateString()}`
      : "Tidak ada";
    await msg.reply(
      `Username: ${user.username}\nRole: ${user.role}\nLangganan: ${sub}`,
    );
  });

  commandHandlers.set("!premium", async (msg, user) => {
    if (!user || !user.subscription || !isPremium(user.subscription)) {
      await msg.reply("Kamu tidak memiliki akses premium.");
      return;
    }
    await msg.reply(
      `Kamu adalah pengguna premium! Langganan sampai ${new Date(user.subscription.expiry).toLocaleDateString()}`,
    );
  });

  commandHandlers.set("!addcmd", async (msg, user, args) => {
    if (!user || !isPremium(user.subscription)) {
      await msg.reply("Perintah ini hanya untuk pengguna premium.");
      return;
    }
    if (args.length < 2) {
      await msg.reply("Format: !addcmd <nama> <balasan>");
      return;
    }
    const cmdName = args[0].toLowerCase();
    const replyText = args.slice(1).join(" ");
    if (commandHandlers.has(cmdName) && cmdName.startsWith("!")) {
      await msg.reply("Perintah bawaan tidak bisa ditimpa.");
      return;
    }
    const customCommands = SubscriptionModel.getCustomCommands();
    if (customCommands.find((c) => c.command === cmdName)) {
      await msg.reply("Custom command sudah ada.");
      return;
    }
    const newCmd = {
      id: uuidv4(),
      command: cmdName,
      reply: replyText,
      createdBy: user.id,
    };
    SubscriptionModel.addCustomCommand(newCmd);
    commandHandlers.set(cmdName, async (msg2) => {
      await msg2.reply(replyText);
    });
    await msg.reply(`Custom command '${cmdName}' berhasil ditambahkan.`);
  });

  commandHandlers.set("!delcmd", async (msg, user, args) => {
    if (!user || !isPremium(user.subscription)) {
      await msg.reply("Perintah ini hanya untuk pengguna premium.");
      return;
    }
    if (args.length < 1) {
      await msg.reply("Format: !delcmd <nama>");
      return;
    }
    const cmdName = args[0].toLowerCase();
    const customCommands = SubscriptionModel.getCustomCommands();
    const cmd = customCommands.find((c) => c.command === cmdName);
    if (!cmd) {
      await msg.reply("Custom command tidak ditemukan.");
      return;
    }
    SubscriptionModel.removeCustomCommand(cmd.id);
    commandHandlers.delete(cmdName);
    await msg.reply(`Custom command '${cmdName}' dihapus.`);
  });

  commandHandlers.set("!listcmd", async (msg, user) => {
    if (!user || !isPremium(user.subscription)) {
      await msg.reply("Perintah ini hanya untuk pengguna premium.");
      return;
    }
    const commands = SubscriptionModel.getCustomCommands();
    if (commands.length === 0) {
      await msg.reply("Tidak ada custom command.");
      return;
    }
    let list = "*Custom Commands:*\n";
    commands.forEach((c) => {
      list += `- ${c.command}\n`;
    });
    await msg.reply(list);
  });

  commandHandlers.set("!buy", async (msg, user, args) => {
    if (!user) {
      await msg.reply("Silakan daftar dulu melalui API.");
      return;
    }
    if (args.length < 1) {
      await msg.reply("Format: !buy <planId>");
      return;
    }
    const planId = args[0];
    await msg.reply(
      `Untuk membeli paket ${planId}, silakan gunakan API /api/payment/create dengan token autentikasi. Atau kunjungi web app.`,
    );
  });

  // Admin command contoh
  commandHandlers.set("!listusers", async (msg, user) => {
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      await msg.reply("Perintah ini hanya untuk admin/owner.");
      return;
    }
    const users = UserModel.findAll();
    let userList = "*Daftar Pengguna:*\n";
    users.forEach((u) => {
      userList += `- ${u.username} (${u.role})\n`;
    });
    await msg.reply(userList);
  });
}

async function handleMessage(message) {
  try {
    if (message.fromMe) return;
    const body = message.body.trim();
    if (!body.startsWith("!")) return;

    const phone = message.from.replace("@c.us", "");
    const users = UserModel.findAll();
    const user = users.find((u) => u.phone === phone);

    if (!user) {
      await message.reply(
        "Kamu belum terdaftar atau belum menautkan nomor WhatsApp. Silakan daftar melalui API dan tautkan nomor.",
      );
      return;
    }

    const args = body.slice(1).split(" ");
    const command = `!${args[0].toLowerCase()}`;
    const cmdArgs = args.slice(1);

    if (commandHandlers.has(command)) {
      await commandHandlers.get(command)(message, user, cmdArgs);
    } else {
      const customCommands = SubscriptionModel.getCustomCommands();
      const custom = customCommands.find((c) => c.command === command);
      if (custom) {
        await message.reply(custom.reply);
      } else {
        await message.reply(
          "Perintah tidak dikenal. Ketik !help untuk bantuan.",
        );
      }
    }
  } catch (err) {
    logger.error("Error handling message:", err);
    await message.reply("Terjadi kesalahan.");
  }
}

function initializeBot() {
  registerDefaultCommands();
  const customCmds = SubscriptionModel.getCustomCommands();
  customCmds.forEach((c) => {
    commandHandlers.set(c.command, async (msg) => {
      await msg.reply(c.reply);
    });
  });
  whatsappService.initialize(handleMessage);
}

module.exports = { initializeBot };
