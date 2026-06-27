const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const usersPath = path.join(__dirname, "../../data/users.json");

function readUsers() {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

class UserModel {
  static findAll() {
    return readUsers();
  }

  static findByUsername(username) {
    const users = readUsers();
    return users.find((u) => u.username === username);
  }

  static findById(id) {
    const users = readUsers();
    return users.find((u) => u.id === id);
  }

  static createUser({ username, password, role = "user" }) {
    const users = readUsers();
    const newUser = {
      id: uuidv4(),
      username,
      password,
      role,
      phone: null,
      subscription: null,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  }

  static updateUser(id, updates) {
    const users = readUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      writeUsers(users);
      return users[index];
    }
    return null;
  }
}

module.exports = UserModel;
