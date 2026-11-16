import type { APIRoute } from 'astro';
import { sql } from 'kysely';
import { PASSWORD_TABLE, verifyPassword } from '../lib/password';

export const prerender = false;

// Failed attempts allowed per 15 minutes before the account (or IP) is locked out for the rest of that window.
const WINDOW = 15 * 60;
const MAX_PER_USER = 5;
const MAX_PER_IP = 20;
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });

// Username + password sign-in. EmDash's auth middleware already rejects cross-origin POSTs to /_emdash/api/auth/login*.
export const POST: APIRoute = async ({ request, locals, session }) => {
  const db = locals.emdash?.db;
  if (!db || !session) return json({ error: 'Not configured' }, 500);
  if (request.headers.get('X-EmDash-Request') !== '1') return json({ error: 'Missing required header' }, 403);
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(body?.password ?? '').slice(0, 1000);
  if (!username || !password) return json({ error: 'Enter your username and password.' }, 400);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const window = new Date(Math.floor(Date.now() / (WINDOW * 1000)) * WINDOW * 1000).toISOString();
  const keys = [`pwlogin:user:${username}`, `pwlogin:ip:${ip}`];
  const counts = await sql<{ key: string; count: number }>`
    SELECT key, count FROM _emdash_rate_limits WHERE "window" = ${window} AND key IN (${keys[0]}, ${keys[1]})`.execute(db);
  const count = (k: string) => counts.rows.find((r) => r.key === k)?.count ?? 0;
  if (count(keys[0]) >= MAX_PER_USER || count(keys[1]) >= MAX_PER_IP)
    return json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, 429);

  await sql.raw(PASSWORD_TABLE).execute(db);
  const row = (
    await sql<{ id: string; hash: string; disabled: number }>`
      SELECT u.id, p.hash, u.disabled FROM user_passwords p JOIN users u ON u.id = p.user_id
      WHERE p.username = ${username} OR lower(u.email) = ${username} LIMIT 1`.execute(db)
  ).rows[0];
  if (!(await verifyPassword(password, row?.hash)) || !row || row.disabled) {
    for (const k of keys)
      await sql`INSERT INTO _emdash_rate_limits (key, "window", count) VALUES (${k}, ${window}, 1)
        ON CONFLICT (key, "window") DO UPDATE SET count = _emdash_rate_limits.count + 1`.execute(db);
    return json({ error: 'Wrong username or password.' }, 401);
  }
  await sql`DELETE FROM _emdash_rate_limits WHERE key = ${keys[0]}`.execute(db);
  await session.regenerate();
  session.set('user', { id: row.id });
  return json({ success: true });
};
