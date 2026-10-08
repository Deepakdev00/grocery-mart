const requireScopes = (...requiredScopes) => (req, res, next) => {
  const scopes = req.scopes instanceof Set ? req.scopes : new Set(req.scopes || []);
  const missingScopes = requiredScopes.filter((scope) => !scopes.has(scope));
  if (missingScopes.length) {
    return res.status(403).json({ message: 'Insufficient scope', missingScopes });
  }
  return next();
};

module.exports = { requireScopes };
