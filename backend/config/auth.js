const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before starting the API');
}

module.exports = process.env.JWT_SECRET;
