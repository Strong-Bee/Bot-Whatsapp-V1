const fs = require("fs");
const path = require("path");

const subscriptionsPath = path.join(__dirname, "../../data/subscriptions.json");
const customCommandsPath = path.join(
  __dirname,
  "../../data/custom_commands.json",
);

function readSubscriptions() {
  try {
    return JSON.parse(fs.readFileSync(subscriptionsPath, "utf8"));
  } catch {
    return { plans: [] };
  }
}

function writeSubscriptions(data) {
  fs.writeFileSync(subscriptionsPath, JSON.stringify(data, null, 2));
}

function readCustomCommands() {
  try {
    return JSON.parse(fs.readFileSync(customCommandsPath, "utf8"));
  } catch {
    return [];
  }
}

function writeCustomCommands(commands) {
  fs.writeFileSync(customCommandsPath, JSON.stringify(commands, null, 2));
}

class SubscriptionModel {
  static getPlans() {
    const subs = readSubscriptions();
    return subs.plans || [];
  }

  static addPlan(plan) {
    const subs = readSubscriptions();
    if (!subs.plans) subs.plans = [];
    subs.plans.push(plan);
    writeSubscriptions(subs);
    return plan;
  }

  static getCustomCommands() {
    return readCustomCommands();
  }

  static addCustomCommand(command) {
    const commands = readCustomCommands();
    commands.push(command);
    writeCustomCommands(commands);
    return command;
  }

  static removeCustomCommand(id) {
    let commands = readCustomCommands();
    commands = commands.filter((c) => c.id !== id);
    writeCustomCommands(commands);
  }
}

module.exports = SubscriptionModel;
