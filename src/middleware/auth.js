const jwt = require("jsonwebtoken");
const config = require("../config/config");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, username, iat, exp }
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};
