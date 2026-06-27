function isPremium(subscription) {
  if (!subscription) return false;
  const now = new Date();
  const expiry = new Date(subscription.expiry);
  return subscription.type !== "free" && expiry > now;
}

module.exports = { isPremium };
