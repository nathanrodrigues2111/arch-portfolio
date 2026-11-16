// Password hashing for the username + password login. PBKDF2-SHA256 via WebCrypto (Workers and Node).
// 100k iterations is the most Cloudflare Workers allows for PBKDF2.
const ITERATIONS = 100_000;
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await derive(password, salt, ITERATIONS))}`;
}

// Constant-time compare; a missing or malformed hash still runs one full derive so timing does not leak.
export async function verifyPassword(password: string, stored: string | undefined | null) {
  const [scheme, iter, salt, hash] = (stored ?? '').split('$');
  const ok = scheme === 'pbkdf2' && Number(iter) > 0 && !!salt && !!hash;
  const want = ok ? unb64(hash) : new Uint8Array(32);
  const got = await derive(password, ok ? unb64(salt) : new Uint8Array(16), ok ? Number(iter) : ITERATIONS);
  let diff = got.length ^ want.length;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] ?? 0);
  return ok && diff === 0;
}

// One password per user. Run with sql.raw(...) before reading or writing (cheap, and covers fresh local databases).
export const PASSWORD_TABLE = `CREATE TABLE IF NOT EXISTS user_passwords (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  hash TEXT NOT NULL
)`;
