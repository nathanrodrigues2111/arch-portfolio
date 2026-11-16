// Run: node scripts/check-drive-url.ts
import assert from 'node:assert';
import { directImageUrl } from '../src/lib/data.ts';

const D = 'https://lh3.googleusercontent.com/d/1AbC_d-9';
assert.equal(directImageUrl('https://drive.google.com/file/d/1AbC_d-9/view?usp=sharing'), D);
assert.equal(directImageUrl('https://drive.google.com/open?id=1AbC_d-9'), D);
assert.equal(directImageUrl('https://drive.google.com/uc?export=view&id=1AbC_d-9'), D);
assert.equal(directImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
console.log('ok');
