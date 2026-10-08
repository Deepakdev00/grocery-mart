const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../middleware/rateLimit');

test('limits repeated requests and allows requests again in the next window', async () => {
  let now = 1_000;
  const buckets = new Map();
  const client = {
    rateLimitBucket: {
      upsert: async ({ where, create, update }) => {
        const { key, windowStart } = where.key_windowStart;
        const bucketKey = `${key}:${windowStart.getTime()}`;
        const bucket = buckets.get(bucketKey);
        if (bucket) {
          bucket.count += update.count.increment;
        } else {
          buckets.set(bucketKey, { ...create });
        }
        return { count: buckets.get(bucketKey).count };
      },
    },
  };
  const limiter = createRateLimiter({
    scope: 'test-login',
    limit: 2,
    windowMs: 1_000,
    client,
    clock: () => now,
  });

  const request = async () => {
    let statusCode = 200;
    let responseBody;
    const headers = {};
    let nextCalled = false;
    const response = {
      set(name, value) {
        headers[name] = value;
        return this;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    await limiter({ ip: '198.51.100.1', socket: {}, body: {} }, response, () => {
      nextCalled = true;
    });
    return { statusCode, responseBody, headers, nextCalled };
  };

  assert.equal((await request()).nextCalled, true);
  assert.equal((await request()).nextCalled, true);
  const blocked = await request();
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.headers['Retry-After'], '1');
  assert.equal(blocked.headers['RateLimit-Reset'], '1');
  assert.match(blocked.responseBody.message, /too many requests/i);

  now += 1_000;
  const reset = await request();
  assert.equal(reset.statusCode, 200);
  assert.equal(reset.nextCalled, true);
  assert.equal(reset.headers['RateLimit-Remaining'], '1');
});
