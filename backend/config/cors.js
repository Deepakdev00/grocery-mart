const cors = require('cors');
const proxyaddr = require('proxy-addr');
const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => callback(null, !origin || env.clientOrigins.includes(origin)),
  credentials: true,
};

const trustProxy = env.trustedProxyCidrs.length
  ? proxyaddr.compile(env.trustedProxyCidrs)
  : false;

module.exports = { corsOptions, trustProxy };
