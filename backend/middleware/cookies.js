const COOKIE_PATH = '/api';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
  res.cookie('gm_access', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('gm_refresh', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const setAdminCookie = (res, token) => {
  res.cookie('gm_admin', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearUserCookies = (res) => {
  res.clearCookie('gm_access', cookieOptions);
  res.clearCookie('gm_refresh', cookieOptions);
};

const clearAdminCookie = (res) => {
  res.clearCookie('gm_admin', cookieOptions);
};

module.exports = {
  readCookie,
  setUserCookies,
  setAdminCookie,
  clearUserCookies,
  clearAdminCookie
};
