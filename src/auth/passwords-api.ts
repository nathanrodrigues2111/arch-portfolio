import type { APIRoute } from 'astro';
import { sql } from 'kysely';
import { hashPassword, PASSWORD_TABLE, verifyPassword } from '../lib/password';

export const prerender = false;

const ADMIN = 50;
const ROLES: Record<string, number> = { editor: 40, admin: 50 };
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
const USERNAME = /^[a-z0-9._-]{3,40}$/;

// Signed-in only (EmDash middleware checks the session and the X-EmDash-Request CSRF header).
// change: own password. create / reset: admins only.
export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.emdash?.db;
  const me = locals.user as { id: string; role: number } | undefined;
  if (!db || !me) return json({ error: 'Not signed in' }, 401);
  const b = await request.json().catch(() => ({}));
  const password = String(b.password ?? '');
  if (password.length < 10 || password.length > 200) return json({ error: 'Password must be 10 to 200 characters.' }, 400);
  await sql.raw(PASSWORD_TABLE).execute(db);

  if (b.action === 'change') {
    const row = (await sql<{ hash: string }>`SELECT hash FROM user_passwords WHERE user_id = ${me.id}`.execute(db)).rows[0];
    if (!(await verifyPassword(String(b.current ?? ''), row?.hash))) return json({ error: 'Current password is wrong.' }, 400);
    await sql`UPDATE user_passwords SET hash = ${await hashPassword(password)} WHERE user_id = ${me.id}`.execute(db);
    return json({ success: true, message: 'Password changed.' });
  }
  if (me.role < ADMIN) return json({ error: 'Only admins can do this.' }, 403);
  const username = String(b.username ?? '').trim().toLowerCase();
  if (!USERNAME.test(username)) return json({ error: 'Username: 3 to 40 lowercase letters, digits, dot, dash or underscore.' }, 400);

  if (b.action === 'reset') {
    const r = await sql`UPDATE user_passwords SET hash = ${await hashPassword(password)} WHERE username = ${username}`.execute(db);
    return Number(r.numAffectedRows ?? 0) ? json({ success: true, message: `Password for ${username} reset.` }) : json({ error: 'No such username.' }, 404);
  }
  if (b.action === 'create') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const role = ROLES[String(b.role)];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role) return json({ error: 'Enter a valid email and role.' }, 400);
    const taken = await sql`SELECT 1 FROM users u LEFT JOIN user_passwords p ON p.user_id = u.id
      WHERE lower(u.email) = ${email} OR p.username = ${username}`.execute(db);
    if (taken.rows.length) return json({ error: 'That username or email is already used.' }, 409);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const name = String(b.name ?? '').trim() || null;
    await sql`INSERT INTO users (id, email, name, role, email_verified, created_at, updated_at)
      VALUES (${id}, ${email}, ${name}, ${role}, 1, ${now}, ${now})`.execute(db);
    await sql`INSERT INTO user_passwords (user_id, username, hash) VALUES (${id}, ${username}, ${await hashPassword(password)})`.execute(db);
    return json({ success: true, message: `Account ${username} created.` });
  }
  return json({ error: 'Unknown action' }, 400);
};
