const validateBody = (schema) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    if (value === undefined || value === null || value === '') {
      if (rules.required) errors.push(`${field} is required`);
      continue;
    }
    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }
    const normalized = rules.trim === false ? value : value.trim();
    if (rules.minLength && normalized.length < rules.minLength) errors.push(`${field} is too short`);
    if (rules.maxLength && normalized.length > rules.maxLength) errors.push(`${field} is too long`);
    if (rules.pattern && !rules.pattern.test(normalized)) errors.push(`${field} has an invalid format`);
  }

  if (errors.length) return res.status(400).json({ message: 'Invalid request body', errors });
  return next();
};

const schemas = Object.freeze({
  signup: {
    username: { required: true, minLength: 2, maxLength: 80 },
    email: { required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 6, maxLength: 128, trim: false },
  },
  userLogin: {
    password: { required: true, minLength: 1, maxLength: 128, trim: false },
  },
  adminLogin: {
    email: { required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 1, maxLength: 128, trim: false },
  },
  email: {
    email: { required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
  resetOtp: {
    email: { required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    otp: { required: true, minLength: 6, maxLength: 6, pattern: /^\d{6}$/ },
  },
  resetPassword: {
    newPassword: { required: true, minLength: 6, maxLength: 128, trim: false },
  },
});

module.exports = { validateBody, schemas };
