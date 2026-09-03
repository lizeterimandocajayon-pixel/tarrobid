# TarroBid

Shift bidding tool for Pizza Voice Ops. Built on the same Vercel + Neon stack as TarroPro.

---

## Setup (one time)

### 1. Create a Neon database

If TarroPro already has a Neon project, you can add TarroBid as a new database inside the same project.

1. Go to [neon.tech](https://neon.tech) → your project
2. Create a new database: `tarrobid`
3. Copy the connection string — you'll need it in step 3

### 2. Run the schema

In the Neon SQL console, paste and run the contents of `schema.sql`.

### 3. Deploy to Vercel

```bash
# Clone or upload this folder, then:
npm install
vercel deploy
```

Set one environment variable in your Vercel project settings:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |

### 4. Done

Anyone with the URL can use TarroBid. No login required.

---

## Monthly reset flow

1. Open TarroBid → **Ranking** tab
2. Click **↺ New month** (top right of the ranking card)
3. Confirm the month label (e.g. "October 2026")
4. Click **Archive & reset**

This saves a full snapshot (agents, shifts, bids, results) to the Archive, then clears shifts, bids, and results. **Agents are kept** — just update their adherence scores and AHT for the new month.

---

## How bidding works

1. **Ranking tab** — add agents with adherence % and AHT (seconds). Ranking = highest adherence first; AHT is the tiebreaker (lower AHT wins).
2. **Shifts tab** — add the available shifts for the month.
3. **Bids tab** — each agent picks 3 shift preferences (1st, 2nd, 3rd).
4. **Live View** — shows who's currently projected to win each shift. Refreshes every 4 seconds.
5. **Results tab** — hit "Run assignment" to finalise. Each agent gets their highest available preference. Export to CSV.
6. **Archive tab** — view past months' full results.

---

## Project structure

```
tarrobid/
├── api/
│   ├── agents.js      — CRUD for agents
│   ├── shifts.js      — CRUD for shifts
│   ├── bids.js        — upsert bids per agent
│   ├── results.js     — run assignment + fetch results
│   ├── reset.js       — archive + reset for new month
│   └── archive.js     — fetch archive list / single entry
├── lib/
│   └── db.js          — Neon connection
├── public/
│   └── index.html     — full frontend (single page)
├── schema.sql         — run once in Neon SQL console
├── vercel.json
├── package.json
└── README.md
```
