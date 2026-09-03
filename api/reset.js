import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    // GET - fetch archive history
    if (req.method === 'GET') {
      const archives = await sql`
        SELECT id, month_label, agent_type, archived_at
        FROM archive
        ORDER BY archived_at DESC
        LIMIT 24
      `;
      return res.status(200).json(archives);
    }

    // POST - archive current month then reset
    if (req.method === 'POST') {
      const { month_label, type = 'PA' } = req.body;
      if (!month_label) return res.status(400).json({ error: 'month_label required' });

      // Build full snapshot of current state
      const agents = await sql`
        SELECT * FROM agents WHERE agent_type = ${type}
      `;
      const shifts = await sql`
        SELECT * FROM shifts WHERE shift_type = ${type}
      `;
      const bids = await sql`
        SELECT b.*, a.name as agent_name
        FROM bids b JOIN agents a ON a.id = b.agent_id
        WHERE a.agent_type = ${type}
      `;
      const results = await sql`
        SELECT r.*, a.name as agent_name, a.adherence, a.aht, s.name as shift_name
        FROM results r
        JOIN agents a ON a.id = r.agent_id
        LEFT JOIN shifts s ON s.id = r.shift_id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;

      const snapshot = { agents, shifts, bids, results };

      // Save to archive
      await sql`
        INSERT INTO archive (month_label, agent_type, data)
        VALUES (${month_label}, ${type}, ${JSON.stringify(snapshot)})
      `;

      // Reset: delete bids, results, shifts — keep agents (scores will need updating)
      await sql`
        DELETE FROM results
        WHERE agent_id IN (SELECT id FROM agents WHERE agent_type = ${type})
      `;
      await sql`
        DELETE FROM bids
        WHERE agent_id IN (SELECT id FROM agents WHERE agent_type = ${type})
      `;
      await sql`
        DELETE FROM shifts WHERE shift_type = ${type}
      `;

      return res.status(200).json({
        ok: true,
        message: `Archived "${month_label}" and reset bids, results, and shifts. Agents retained.`,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
