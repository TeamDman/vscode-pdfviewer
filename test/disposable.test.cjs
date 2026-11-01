const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Disposable, disposeAll } = require('../out/src/disposable');
test('disposal releases resources once, including late registrations', () => {
  class Owner extends Disposable {
    register(value) {
      return this._register(value);
    }
  }
  const owner = new Owner();
  let count = 0;
  owner.register({
    dispose() {
      count++;
    },
  });
  owner.dispose();
  owner.dispose();
  owner.register({
    dispose() {
      count++;
    },
  });
  assert.equal(count, 2);
  const values = [
    {
      dispose() {
        count++;
      },
    },
  ];
  disposeAll(values);
  assert.equal(values.length, 0);
  assert.equal(count, 3);
});
