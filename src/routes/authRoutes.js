const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", auth, authController.profile);
router.post("/link-phone", auth, authController.linkPhone);

// Khusus admin/owner
router.put(
  "/set-role",
  auth,
  authorize("admin", "owner"),
  authController.setRole,
);

module.exports = router;
