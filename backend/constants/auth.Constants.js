const AUTH_COOKIE_NAMES = Object.freeze({
  access: 'gm_access',
  refresh: 'gm_refresh',
  admin: 'gm_admin',
});

const USER_ROLES = Object.freeze({
  customer: 'customer',
  staff: 'staff',
  supplier: 'supplier',
  retailer: 'retailer',
  admin: 'admin',
  superAdmin: 'super_admin',
});

const AUTH_TOKEN_TTL = '7d';

module.exports = { AUTH_COOKIE_NAMES, USER_ROLES, AUTH_TOKEN_TTL };
