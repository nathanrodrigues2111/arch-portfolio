// Run: node scripts/check-password.ts
import assert from 'node:assert';
import { hashPassword, verifyPassword } from '../src/lib/password.ts';

const h = await hashPassword('correct horse');
assert.match(h, /^pbkdf2\$100000\$/);
assert.notEqual(h, await hashPassword('correct horse'), 'salt is random');
assert.equal(await verifyPassword('correct horse', h), true);
assert.equal(await verifyPassword('correct hors', h), false);
assert.equal(await verifyPassword('', h), false);
assert.equal(await verifyPassword('x', null), false);
assert.equal(await verifyPassword('x', 'garbage'), false);
const t = performance.now();
await verifyPassword('correct horse', h);
console.log(`ok, one verify ${(performance.now() - t).toFixed(1)}ms`);
