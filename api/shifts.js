import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const type = req.query.type || 'PA';
      const shifts = await sql`
        SELECT * FROM shifts WHERE shift_type = ${type} ORDER BY created_at ASC
      `;
      return res.status(200).json(shifts);
    }

    if (req.method === 'POST') {
      const { name, shift_type = 'PA' } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const existing = await sql`
        SELECT id FROM shifts WHERE name = ${name} AND shift_type = ${shift_type}
      `;
      if (existing.length) return res.status(409).json({ error: 'Shift already exists' });
      const [shift] = await sql`
        INSERT INTO shifts (name, shift_type) VALUES (${name}, ${shift_type}) RETURNING *
      `;
      return res.status(201).json(shift);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const [shift] = await sql`
        UPDATE shifts SET name = ${name} WHERE id = ${id} RETURNING *
      `;
      return res.status(200).json(shift);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM shifts WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
