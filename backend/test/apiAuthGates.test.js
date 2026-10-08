const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ||= 'local-route-test-secret';

const app = require('../server');

const protectedEndpoints = [
  ['GET', '/api/auth/me'],
  ['GET', '/api/auth/sessions'],
  ['DELETE', '/api/auth/sessions/test-session-id'],
  ['DELETE', '/api/auth/sessions'],
  ['GET', '/api/cart'],
  ['POST', '/api/cart/add'],
  ['PUT', '/api/cart/update'],
  ['DELETE', '/api/cart/remove/test-product-id'],
  ['DELETE', '/api/cart/clear'],
  ['POST', '/api/cart/sync'],
  ['POST', '/api/payment/process'],
  ['GET', '/api/payment/history'],
  ['GET', '/api/payment/test-order-id'],
  ['GET', '/api/admin/me'],
  ['POST', '/api/admin/logout'],
  ['GET', '/api/admin/dashboard/stats'],
  ['GET', '/api/admin/dashboard/orders'],
  ['GET', '/api/admin/dashboard/users'],
  ['GET', '/api/admin/dashboard/daily-orders'],
  ['GET', '/api/admin/dashboard/sessions'],
  ['GET', '/api/admin/user-management/users'],
  ['POST', '/api/admin/user-management/users'],
  ['GET', '/api/admin/user-management/users/test-user-id'],
  ['PUT', '/api/admin/user-management/users/test-user-id/status'],
  ['PUT', '/api/admin/user-management/users/test-user-id/role'],
  ['GET', '/api/admin/user-management/users/test-user-id/sessions'],
  ['DELETE', '/api/admin/user-management/users/test-user-id/sessions'],
  ['GET', '/api/admin/user-management/login-logs'],
  ['GET', '/api/admin/user-management/activity-logs'],
  ['GET', '/api/admin/user-management/dashboard/stats'],
  ['POST', '/api/products'],
  ['PUT', '/api/products/test-product-id'],
  ['DELETE', '/api/products/test-product-id'],
  ['GET', '/api/products/admin/all'],
  ['GET', '/api/profile'],
  ['PUT', '/api/profile'],
  ['POST', '/api/profile/change-password'],
  ['PUT', '/api/profile/theme'],
  ['DELETE', '/api/profile/account'],
  ['POST', '/api/support/tickets'],
  ['GET', '/api/support/tickets'],
  ['GET', '/api/support/tickets/test-ticket-id'],
  ['POST', '/api/support/tickets/test-ticket-id/reply'],
  ['GET', '/api/support/dashboard'],
  ['PUT', '/api/support/tickets/test-ticket-id/status'],
  ['POST', '/api/support/tickets/test-ticket-id/admin-reply'],
  ['GET', '/api/wishlist'],
  ['POST', '/api/wishlist'],
  ['DELETE', '/api/wishlist/test-product-id'],
];

test('all protected API endpoints reject requests without authentication', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  for (const [method, path] of protectedEndpoints) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method });
    assert.equal(response.status, 401, `${method} ${path} should require authentication`);
    assert.deepEqual(
      await response.json(),
      { message: 'Authentication required' },
      `${method} ${path} should return the standard authentication error`
    );
  }
});
