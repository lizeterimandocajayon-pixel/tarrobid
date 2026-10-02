import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;

    const type = req.query.type || req.body?.type || 'PA';
    const key = 'bidding_open_' + type;

    if (req.method === 'GET') {
      const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
      return res.status(200).json({ open: rows.length ? rows[0].value === 'true' : false });
    }

    if (req.method === 'POST') {
      const { open } = req.body;
      await sql`INSERT INTO settings (key, value) VALUES (${key}, ${String(open)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      return res.status(200).json({ open });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
