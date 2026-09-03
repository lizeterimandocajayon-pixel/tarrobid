import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    // Ensure settings table exists
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;

    if (req.method === 'GET') {
      const rows = await sql`SELECT value FROM settings WHERE key = 'bidding_open'`;
      const open = rows.length ? rows[0].value === 'true' : false;
      return res.status(200).json({ open });
    }

    if (req.method === 'POST') {
      const { open } = req.body;
      await sql`
        INSERT INTO settings (key, value) VALUES ('bidding_open', ${String(open)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      return res.status(200).json({ open });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
