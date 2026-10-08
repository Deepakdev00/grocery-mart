const env = require('../config/env');
const { AUTH_COOKIE_NAMES } = require('../constants/auth.Constants');

const COOKIE_PATH = '/api';
const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: COOKIE_PATH
};

const readCookie = (req, name) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
};

const setUserCookies = (res, token, refreshToken) => {
  res.cookie(AUTH_COOKIE_NAMES.access, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie(AUTH_COOKIE_NAMES.refresh, refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const setAdminCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAMES.admin, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearUserCookies = (res) => {
  res.clearCookie(AUTH_COOKIE_NAMES.access, cookieOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.refresh, cookieOptions);
};

const clearAdminCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAMES.admin, cookieOptions);
};

module.exports = {
  readCookie,
  setUserCookies,
  setAdminCookie,
  clearUserCookies,
  clearAdminCookie
};
