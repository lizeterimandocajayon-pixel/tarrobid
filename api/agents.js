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
      const agents = await sql`
        SELECT a.*, b.pref1_shift_id, b.pref2_shift_id, b.pref3_shift_id
        FROM agents a
        LEFT JOIN bids b ON b.agent_id = a.id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;
      return res.status(200).json(agents);
    }

    if (req.method === 'POST') {
      const { name, adherence, aht, agent_type = 'PA' } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const [agent] = await sql`
        INSERT INTO agents (name, adherence, aht, agent_type)
        VALUES (${name}, ${adherence || 0}, ${aht || 0}, ${agent_type})
        RETURNING *
      `;
      return res.status(201).json(agent);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { adherence, aht } = req.body;
      const [agent] = await sql`
        UPDATE agents
        SET adherence = ${adherence}, aht = ${aht}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(agent);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM agents WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
