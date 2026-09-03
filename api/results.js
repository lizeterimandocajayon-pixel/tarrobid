import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const type = req.query.type || 'PA';
      const results = await sql`
        SELECT r.*, a.name as agent_name, a.adherence, a.aht, s.name as shift_name
        FROM results r
        JOIN agents a ON a.id = r.agent_id
        LEFT JOIN shifts s ON s.id = r.shift_id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;
      return res.status(200).json(results);
    }

    if (req.method === 'POST') {
      // Run the assignment algorithm server-side
      const type = req.body?.type || 'PA';

      // Fetch agents sorted by adherence desc, aht asc
      const agents = await sql`
        SELECT a.*, b.pref1_shift_id, b.pref2_shift_id, b.pref3_shift_id
        FROM agents a
        LEFT JOIN bids b ON b.agent_id = a.id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;

      const taken = new Set();
      const assignments = [];

      for (const agent of agents) {
        const prefs = [
          { shift_id: agent.pref1_shift_id, pref: 1 },
          { shift_id: agent.pref2_shift_id, pref: 2 },
          { shift_id: agent.pref3_shift_id, pref: 3 },
        ];

        let assigned = null;
        for (const p of prefs) {
          if (p.shift_id && !taken.has(p.shift_id)) {
            taken.add(p.shift_id);
            assigned = p;
            break;
          }
        }

        assignments.push({
          agent_id: agent.id,
          shift_id: assigned?.shift_id || null,
          preference_used: assigned?.pref || null,
        });
      }

      // Clear old results for this type and insert new ones
      await sql`
        DELETE FROM results
        WHERE agent_id IN (SELECT id FROM agents WHERE agent_type = ${type})
      `;

      for (const a of assignments) {
        await sql`
          INSERT INTO results (agent_id, shift_id, preference_used)
          VALUES (${a.agent_id}, ${a.shift_id}, ${a.preference_used})
        `;
      }

      // Return full results
      const results = await sql`
        SELECT r.*, a.name as agent_name, a.adherence, a.aht, s.name as shift_name
        FROM results r
        JOIN agents a ON a.id = r.agent_id
        LEFT JOIN shifts s ON s.id = r.shift_id
        WHERE a.agent_type = ${type}
        ORDER BY a.adherence DESC, a.aht ASC
      `;
      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
