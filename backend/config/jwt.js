const env = require('./env');

const JWT_SECRET = env.jwtSecret;
const JWT_EXPIRES_IN = '7d';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
