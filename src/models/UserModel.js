const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

class UserModel {
  constructor() {
    this.usersPath = path.join(__dirname, "../../data/users.json");
    this.ensureDataDirectory();
    this.users = this.loadUsers();
    this.initializeDefaultUsers();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.usersPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadUsers() {
    try {
      if (fs.existsSync(this.usersPath)) {
        const data = fs.readFileSync(this.usersPath, "utf8");
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error("Error loading users:", error);
      return [];
    }
  }

  saveUsers() {
    try {
      fs.writeFileSync(this.usersPath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  }

  initializeDefaultUsers() {
    const ownerNumber = process.env.OWNER_NUMBER || "6285119116907";
    const ownerName = process.env.OWNER_NAME || "Owner";

    const existingOwner = this.users.find((user) => user.role === "owner");

    if (existingOwner) {
      if (existingOwner.phone !== ownerNumber) {
        existingOwner.phone = ownerNumber;
        existingOwner.name = ownerName;
        existingOwner.updatedAt = new Date().toISOString();
        this.saveUsers();
        console.log(`✅ Owner updated: ${ownerNumber}`);
      }
      return;
    }

    console.log(`🆕 Creating new owner: ${ownerNumber}`);
    this.users = [];

    const defaultPassword = "owner123";
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(defaultPassword, salt);

    this.users.push({
      id: `user_${Date.now()}`,
      phone: ownerNumber,
      name: ownerName,
      role: "owner",
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      permissions: this.getPermissionsByRole("owner"),
    });
    this.saveUsers();
    console.log(`✅ Default owner created: ${ownerNumber}`);
    console.log(`🔑 Default password: ${defaultPassword}`);

    const adminNumbers = process.env.ADMIN_NUMBERS
      ? process.env.ADMIN_NUMBERS.split(",").map((n) => n.trim())
      : [];

    adminNumbers.forEach((adminPhone) => {
      if (adminPhone === ownerNumber) return;

      const adminExists = this.users.some(
        (user) => user.phone === adminPhone && user.role === "admin",
      );

      if (!adminExists) {
        const defaultPassword = "admin123";
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(defaultPassword, salt);

        this.users.push({
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phone: adminPhone,
          name: `Admin ${adminPhone}`,
          role: "admin",
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          permissions: this.getPermissionsByRole("admin"),
        });
        this.saveUsers();
        console.log(`✅ Default admin created: ${adminPhone}`);
      }
    });
  }

  getPermissionsByRole(role) {
    const permissions = {
      owner: [
        "manage_users",
        "manage_admins",
        "manage_bot",
        "view_all",
        "send_message",
        "send_media",
        "broadcast",
        "manage_blocks",
        "view_logs",
        "manage_settings",
      ],
      admin: [
        "view_all",
        "send_message",
        "send_media",
        "broadcast",
        "manage_blocks",
        "view_logs",
      ],
      user: ["view_all", "send_message"],
    };
    return permissions[role] || [];
  }

  findUserByPhone(phone) {
    if (!phone) return null;
    const normalizedPhone = this.normalizePhone(phone);
    return this.users.find((user) => {
      const userPhone = this.normalizePhone(user.phone);
      return userPhone === normalizedPhone;
    });
  }

  normalizePhone(phone) {
    if (!phone) return "";
    let clean = phone.replace(/@c\.us$/, "").replace(/@lid$/, "");
    clean = clean.replace(/^\+/, "");
    if (clean.startsWith("0")) {
      clean = clean.substring(1);
    }
    if (
      !clean.startsWith("62") &&
      !clean.startsWith("7") &&
      !clean.startsWith("8")
    ) {
      clean = "62" + clean;
    }
    return clean;
  }

  findUserById(id) {
    return this.users.find((user) => user.id === id);
  }

  createUser(phone, name, role, password) {
    const normalizedPhone = this.normalizePhone(phone);

    if (this.findUserByPhone(normalizedPhone)) {
      throw new Error("User dengan nomor ini sudah terdaftar");
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: normalizedPhone,
      name,
      role: role || "user",
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      permissions: this.getPermissionsByRole(role || "user"),
    };

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  updateUser(id, updates) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error("User tidak ditemukan");
    }

    const user = this.users[index];

    if (updates.password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password = bcrypt.hashSync(updates.password, salt);
    }

    if (updates.role) {
      updates.permissions = this.getPermissionsByRole(updates.role);
    }

    this.users[index] = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveUsers();
    return this.users[index];
  }

  deleteUser(id) {
    const user = this.findUserById(id);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    if (user.role === "owner") {
      throw new Error("Tidak dapat menghapus owner");
    }

    this.users = this.users.filter((u) => u.id !== id);
    this.saveUsers();
    return true;
  }

  validatePassword(phone, password) {
    const user = this.findUserByPhone(phone);
    if (!user) return false;
    if (!user.isActive) return false;
    return bcrypt.compareSync(password, user.password);
  }

  getAllUsers() {
    return this.users.map((user) => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: user.permissions,
    }));
  }

  getUserByPhone(phone) {
    const user = this.findUserByPhone(phone);
    if (!user) return null;

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions,
    };
  }

  hasPermission(user, permission) {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  isOwner(user) {
    return user && user.role === "owner";
  }

  isAdmin(user) {
    return user && (user.role === "admin" || user.role === "owner");
  }

  isUser(user) {
    return user && user.role === "user";
  }

  getOwner() {
    return this.users.find((user) => user.role === "owner");
  }

  resetUsers() {
    const owner = this.getOwner();
    if (owner) {
      this.users = [owner];
      this.saveUsers();
      console.log(`🔄 Users reset. Only owner ${owner.phone} remains.`);
      return true;
    }
    return false;
  }

  getUserStats() {
    const total = this.users.length;
    const owners = this.users.filter((u) => u.role === "owner").length;
    const admins = this.users.filter((u) => u.role === "admin").length;
    const users = this.users.filter((u) => u.role === "user").length;
    const active = this.users.filter((u) => u.isActive).length;
    const inactive = total - active;

    return {
      total,
      owners,
      admins,
      users,
      active,
      inactive,
    };
  }
}

module.exports = new UserModel();
