import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      // Returns all bids joined with agent info
      const type = req.query.type || 'PA';
      const bids = await sql`
        SELECT b.*, a.name as agent_name, a.adherence, a.aht
        FROM bids b
        JOIN agents a ON a.id = b.agent_id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;
      return res.status(200).json(bids);
    }

    if (req.method === 'POST') {
      const { agent_id, pref1_shift_id, pref2_shift_id, pref3_shift_id } = req.body;
      if (!agent_id) return res.status(400).json({ error: 'agent_id required' });
      // Upsert — one bid row per agent
      const [bid] = await sql`
        INSERT INTO bids (agent_id, pref1_shift_id, pref2_shift_id, pref3_shift_id, updated_at)
        VALUES (${agent_id}, ${pref1_shift_id || null}, ${pref2_shift_id || null}, ${pref3_shift_id || null}, NOW())
        ON CONFLICT (agent_id) DO UPDATE SET
          pref1_shift_id = EXCLUDED.pref1_shift_id,
          pref2_shift_id = EXCLUDED.pref2_shift_id,
          pref3_shift_id = EXCLUDED.pref3_shift_id,
          updated_at = NOW()
        RETURNING *
      `;
      return res.status(200).json(bid);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
