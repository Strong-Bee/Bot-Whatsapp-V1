const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const SubscriptionModel = require("../models/SubscriptionModel");
const { v4: uuidv4 } = require("uuid");

router.get("/plans", (req, res) => {
  const plans = SubscriptionModel.getPlans();
  res.json(plans);
});

router.post("/plans", auth, authorize("admin", "owner"), (req, res) => {
  const { name, price, durationDays } = req.body;
  if (!name || !price || !durationDays)
    return res.status(400).json({ error: "Missing fields" });
  const plan = { id: uuidv4(), name, price, durationDays };
  SubscriptionModel.addPlan(plan);
  res.status(201).json(plan);
});

router.get("/custom-commands", auth, (req, res) => {
  const cmds = SubscriptionModel.getCustomCommands();
  res.json(cmds);
});

// Optional: admin dashboard
router.get(
  "/admin/dashboard",
  auth,
  authorize("admin", "owner"),
  (req, res) => {
    res.json({ message: "Welcome to admin dashboard" });
  },
);

module.exports = router;
