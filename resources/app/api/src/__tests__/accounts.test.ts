import assert from 'node:assert/strict';
import test from 'node:test';
import accountsRouter from '../modules/accounts.js';

test('accounts router is exported as a function', () => {
  assert.equal(typeof accountsRouter, 'function');
});
