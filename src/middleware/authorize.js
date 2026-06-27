const UserModel = require("../models/UserModel");

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const user = UserModel.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden. Required roles: ${allowedRoles.join(", ")}`,
      });
    }
    // tambahkan role ke req.user agar bisa digunakan controller
    req.user.role = user.role;
    next();
  };
};
