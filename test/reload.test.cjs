const { test } = require('node:test');
const assert = require('node:assert/strict');
test('reload bursts coalesce and never overlap', async () => {
  const { createReloadQueue } = await import('../lib/main.mjs');
  let finish,
    count = 0,
    active = 0,
    peak = 0;
  const request = createReloadQueue(async () => {
    count++;
    peak = Math.max(peak, ++active);
    if (count === 1)
      await new Promise((resolve) => {
        finish = resolve;
      });
    active--;
  });
  const done = request();
  request();
  request();
  finish();
  await done;
  assert.equal(count, 2);
  assert.equal(peak, 1);
  await request();
  assert.equal(count, 3);
});
test('a failed rebuild does not block later reloads', async () => {
  const { createReloadQueue } = await import('../lib/main.mjs');
  let count = 0;
  const errors = [];
  const request = createReloadQueue(
    async () => {
      if (++count === 1) throw Error('partial PDF');
    },
    (e) => errors.push(e),
  );
  await request();
  await request();
  assert.equal(count, 2);
  assert.equal(errors.length, 1);
});
