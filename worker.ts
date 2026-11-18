interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Helper for JSON responses
    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });

    try {
      // 1. GET /api/polls
      if (url.pathname === '/api/polls' && request.method === 'GET') {
        const { results: polls } = await env.DB.prepare(
          'SELECT * FROM polls ORDER BY created_at DESC'
        ).all();
        const { results: options } = await env.DB.prepare(
          'SELECT * FROM poll_options ORDER BY v DESC'
        ).all();

        const data = (polls || []).map((p: any) => {
          const pollOpts = (options || []).filter((o: any) => o.poll_id === p.id);
          const totalVotes = pollOpts.reduce((sum: number, o: any) => sum + o.v, 0);
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
            options: pollOpts.map((o: any) => ({
              id: o.id,
              t: o.t,
              by: o.by,
              v: o.v
            }))
          };
        });
        return json(data);
      }

      // 2. POST /api/polls
      if (url.pathname === '/api/polls' && request.method === 'POST') {
        const body: any = await request.json();
        const id = body.id || 'poll-' + Date.now();
        const question = body.question || 'Untitled poll';
        const closesLabel = body.closesLabel || 'Today at 7:00 PM';
        const startedBy = body.startedBy || 'You';

        await env.DB.prepare(
          "INSERT INTO polls (id, question, status, closes_label, started_by, subtitle) VALUES (?, ?, 'open', ?, ?, '0 votes · just started')"
        ).bind(id, question, closesLabel, startedBy).run();

        const opts = Array.isArray(body.options) ? body.options : [];
        const statements = opts
          .filter((t: string) => t && t.trim())
          .map((t: string, i: number) =>
            env.DB.prepare('INSERT INTO poll_options (id, poll_id, t, v) VALUES (?, ?, ?, 0)').bind(
              `opt-${id}-${i}`,
              id,
              t.trim()
            )
          );

        if (statements.length > 0) {
          await env.DB.batch(statements);
        }

        return json({ success: true, pollId: id }, 201);
      }

      // 3. POST /api/polls/:id/vote
      const voteMatch = url.pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
      if (voteMatch && request.method === 'POST') {
        const pollId = voteMatch[1];
        const body: any = await request.json();
        const optionId = body.optionId;

        await env.DB.prepare(
          'UPDATE poll_options SET v = v + 1 WHERE id = ? AND poll_id = ?'
        ).bind(optionId, pollId).run();

        const { results: opts } = await env.DB.prepare(
          'SELECT v FROM poll_options WHERE poll_id = ?'
        ).bind(pollId).all();

        const total = (opts || []).reduce((s: number, o: any) => s + o.v, 0);
        await env.DB.prepare(
          'UPDATE polls SET subtitle = ? WHERE id = ?'
        ).bind(`${total} of your crew voted · just now`, pollId).run();

        return json({ success: true });
      }

      // 4. POST /api/polls/:id/suggest
      const suggestMatch = url.pathname.match(/^\/api\/polls\/([^/]+)\/suggest$/);
      if (suggestMatch && request.method === 'POST') {
        const pollId = suggestMatch[1];
        const body: any = await request.json();
        const idea = (body.idea || '').trim();
        const by = body.by || 'Crew member';

        const optId = `opt-${pollId}-${Date.now()}`;
        await env.DB.prepare(
          'INSERT INTO poll_options (id, poll_id, t, by, v) VALUES (?, ?, ?, ?, 0)'
        ).bind(optId, pollId, idea, by).run();

        return json({ success: true, optionId: optId }, 201);
      }

      // 5. POST /api/polls/:id/close
      const closeMatch = url.pathname.match(/^\/api\/polls\/([^/]+)\/close$/);
      if (closeMatch && request.method === 'POST') {
        const pollId = closeMatch[1];
        const { results: opts } = await env.DB.prepare(
          'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY v DESC'
        ).bind(pollId).all();

        let isTied = 0;
        let winner: string | null = null;
        if (opts && opts.length >= 2 && opts[0].v === opts[1].v && opts[0].v > 0) {
          isTied = 1;
        } else if (opts && opts.length > 0) {
          winner = opts[0].t;
        }

        await env.DB.prepare(
          'UPDATE polls SET status = "closed", is_tied = ?, winner = ? WHERE id = ?'
        ).bind(isTied, winner, pollId).run();

        return json({ success: true, isTied: Boolean(isTied), winner });
      }

      // 6. POST /api/polls/:id/reopen
      const reopenMatch = url.pathname.match(/^\/api\/polls\/([^/]+)\/reopen$/);
      if (reopenMatch && request.method === 'POST') {
        const pollId = reopenMatch[1];
        await env.DB.prepare('UPDATE polls SET status = "open", is_tied = 0 WHERE id = ?').bind(pollId).run();
        return json({ success: true });
      }

      // 7. POST /api/polls/:id/resolve-tie
      const resolveMatch = url.pathname.match(/^\/api\/polls\/([^/]+)\/resolve-tie$/);
      if (resolveMatch && request.method === 'POST') {
        const pollId = resolveMatch[1];
        const body: any = await request.json();
        await env.DB.prepare(
          'UPDATE polls SET status = "closed", is_tied = 0, winner = ? WHERE id = ?'
        ).bind(body.winner || 'Selected Winner', pollId).run();
        return json({ success: true });
      }
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }

    // Serve static frontend assets from [assets] directory
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
