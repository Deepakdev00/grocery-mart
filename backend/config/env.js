const dotenv = require('dotenv');

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const splitList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const env = Object.freeze({
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  adminCreationSecret: process.env.ADMIN_CREATION_SECRET || '',
  clientOrigins: splitList(process.env.CLIENT_ORIGIN || 'http://localhost:3000'),
  trustedProxyCidrs: splitList(process.env.TRUSTED_PROXY_CIDRS || ''),
  port: Number.parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
});

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

for (const origin of env.clientOrigins) {
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error();
    }
  } catch {
    throw new Error(`CLIENT_ORIGIN contains an invalid origin: ${origin}`);
  }
}

module.exports = env;
