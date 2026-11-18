import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

function sqliteDevServerPlugin(): Plugin {
  return {
    name: 'vite-sqlite-dev-server',
    configureServer(server) {
      const dbPath = path.resolve(__dirname, 'tiebreak.db');
      const db = new DatabaseSync(dbPath);

      // Create tables
      db.exec(`
        CREATE TABLE IF NOT EXISTS polls (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          closes_label TEXT NOT NULL DEFAULT 'Closes today 7:00 PM',
          started_by TEXT DEFAULT 'You',
          subtitle TEXT,
          winner TEXT,
          is_tied INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS poll_options (
          id TEXT PRIMARY KEY,
          poll_id TEXT NOT NULL,
          t TEXT NOT NULL,
          by TEXT,
          v INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // Seed initial data if polls table is empty
      const existing = db.prepare('SELECT COUNT(*) as count FROM polls').get() as { count: number };
      if (existing.count === 0) {
        db.exec(`
          INSERT INTO polls (id, question, status, closes_label, started_by, subtitle, winner, is_tied) VALUES
            ('pizza-night', 'Pizza night: what are we ordering?', 'open', 'Closes today 7:00 PM', 'Reubenson', '11 of your crew voted · last one 2 min ago', NULL, 0),
            ('birthday-trip', 'Where do we go for Dami’s birthday?', 'open', 'Closes Friday 9:00 PM', 'Christian', '6 votes · neck and neck', NULL, 0),
            ('movie-night', 'Movie night pick', 'draft', 'Draft', 'Christian', 'No options yet. Add a few to get started.', NULL, 0),
            ('road-trip-dj', 'Road trip playlist: who drives DJ?', 'closed', 'Closed', 'Priya', '9 votes', 'Priya', 0),
            ('game-night-catan', 'Game night: Catan or Codenames?', 'closed', 'Closed', 'Alex', '8 votes', 'Catan', 1);

          INSERT INTO poll_options (id, poll_id, t, by, v) VALUES
            ('p1', 'pizza-night', 'Detroit-style from Emmy’s', 'Priya', 5),
            ('p2', 'pizza-night', 'Pepperoni from Slice House', NULL, 3),
            ('p3', 'pizza-night', 'Veggie supreme from Nino’s', 'Jonah', 2),
            ('p4', 'pizza-night', 'Margherita from Lupa', NULL, 1),
            ('b1', 'birthday-trip', 'Karaoke at Boombox', NULL, 3),
            ('b2', 'birthday-trip', 'Arcade & bowling at Lane7', NULL, 3),
            ('r1', 'road-trip-dj', 'Priya', NULL, 5),
            ('r2', 'road-trip-dj', 'Marcus', NULL, 4),
            ('g1', 'game-night-catan', 'Catan', NULL, 4),
            ('g2', 'game-night-catan', 'Codenames', NULL, 4);
        `);
      }

      // API route handling middleware
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;
        const method = req.method;

        // Helper to parse JSON body
        const readJson = async (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => (data += chunk));
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const json = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          // 1. GET /api/polls
          if (pathname === '/api/polls' && method === 'GET') {
            const polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all() as any[];
            const options = db.prepare('SELECT * FROM poll_options ORDER BY v DESC').all() as any[];

            const result = polls.map((p) => {
              const pollOpts = options.filter((o) => o.poll_id === p.id);
              const totalVotes = pollOpts.reduce((sum, o) => sum + o.v, 0);
              return {
                id: p.id,
                question: p.question,
                status: p.status,
                closesLabel: p.closes_label,
                startedBy: p.started_by,
                subtitle: p.subtitle,
                winner: p.winner,
                isTied: Boolean(p.is_tied),
                totalVotes,
                options: pollOpts.map((o) => ({
                  id: o.id,
                  t: o.t,
                  by: o.by,
                  v: o.v
                }))
              };
            });
            return json(result);
          }

          // 2. POST /api/polls (Create new poll)
          if (pathname === '/api/polls' && method === 'POST') {
            const body = await readJson();
            const id = body.id || 'poll-' + Date.now();
            const question = body.question || 'Untitled poll';
            const closesLabel = body.closesLabel || 'Today at 7:00 PM';
            const startedBy = body.startedBy || 'You';

            db.prepare(`
              INSERT INTO polls (id, question, status, closes_label, started_by, subtitle)
              VALUES (?, ?, 'open', ?, ?, '0 votes · just started')
            `).run(id, question, closesLabel, startedBy);

            const options = Array.isArray(body.options) ? body.options : [];
            const insertOpt = db.prepare('INSERT INTO poll_options (id, poll_id, t, v) VALUES (?, ?, ?, 0)');
            options.forEach((optText: string, i: number) => {
              if (optText && optText.trim()) {
                insertOpt.run(`opt-${id}-${i}`, id, optText.trim());
              }
            });

            return json({ success: true, pollId: id }, 201);
          }

          // 3. POST /api/polls/:id/vote
          const voteMatch = pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
          if (voteMatch && method === 'POST') {
            const pollId = voteMatch[1];
            const body = await readJson();
            const optionId = body.optionId;

            if (!optionId) return json({ error: 'optionId required' }, 400);

            db.prepare('UPDATE poll_options SET v = v + 1 WHERE id = ? AND poll_id = ?').run(optionId, pollId);

            // Update poll total subtitle
            const opts = db.prepare('SELECT v FROM poll_options WHERE poll_id = ?').all() as any[];
            const total = opts.reduce((s, o) => s + o.v, 0);
            db.prepare("UPDATE polls SET subtitle = ? WHERE id = ?").run(`${total} of your crew voted · just now`, pollId);

            return json({ success: true });
          }

          // 4. POST /api/polls/:id/suggest
          const suggestMatch = pathname.match(/^\/api\/polls\/([^/]+)\/suggest$/);
          if (suggestMatch && method === 'POST') {
            const pollId = suggestMatch[1];
            const body = await readJson();
            const idea = (body.idea || '').trim();
            const by = body.by || 'Crew member';

            if (!idea) return json({ error: 'idea required' }, 400);

            const optId = `opt-${pollId}-${Date.now()}`;
            db.prepare('INSERT INTO poll_options (id, poll_id, t, by, v) VALUES (?, ?, ?, ?, 0)').run(
              optId,
              pollId,
              idea,
              by
            );

            return json({ success: true, optionId: optId }, 201);
          }

          // 5. POST /api/polls/:id/close
          const closeMatch = pathname.match(/^\/api\/polls\/([^/]+)\/close$/);
          if (closeMatch && method === 'POST') {
            const pollId = closeMatch[1];
            const opts = db.prepare('SELECT * FROM poll_options WHERE poll_id = ? ORDER BY v DESC').all() as any[];
            let isTied = 0;
            let winner: string | null = null;

            if (opts.length >= 2 && opts[0].v === opts[1].v && opts[0].v > 0) {
              isTied = 1;
            } else if (opts.length > 0) {
              winner = opts[0].t;
            }

            db.prepare('UPDATE polls SET status = "closed", is_tied = ?, winner = ? WHERE id = ?').run(
              isTied,
              winner,
              pollId
            );

            return json({ success: true, isTied: Boolean(isTied), winner });
          }

          // 6. POST /api/polls/:id/reopen
          const reopenMatch = pathname.match(/^\/api\/polls\/([^/]+)\/reopen$/);
          if (reopenMatch && method === 'POST') {
            const pollId = reopenMatch[1];
            db.prepare('UPDATE polls SET status = "open", is_tied = 0 WHERE id = ?').run(pollId);
            return json({ success: true });
          }

          // 7. POST /api/polls/:id/resolve-tie
          const resolveMatch = pathname.match(/^\/api\/polls\/([^/]+)\/resolve-tie$/);
          if (resolveMatch && method === 'POST') {
            const pollId = resolveMatch[1];
            const body = await readJson();
            db.prepare('UPDATE polls SET status = "closed", is_tied = 0, winner = ? WHERE id = ?').run(
              body.winner || 'Selected Winner',
              pollId
            );
            return json({ success: true });
          }

          return next();
        } catch (err: any) {
          json({ error: err.message }, 500);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sqliteDevServerPlugin()],
  server: {
    port: 3000,
    open: false
  }
});
