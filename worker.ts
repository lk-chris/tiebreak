interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ASSETS?: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = url;
    const base = env.SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY;

    // Helper: call Supabase REST API directly (no SDK needed in Worker)
    const sb = async (
      path: string,
      opts: RequestInit = {}
    ): Promise<any> => {
      const res = await fetch(`${base}/rest/v1${path}`, {
        ...opts,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
          ...(opts.headers || {})
        }
      });
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    };

    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });

    try {
      // 1. GET /api/polls — fetch all polls + options
      if (pathname === '/api/polls' && method === 'GET') {
        const polls = await sb('/polls?order=created_at.desc');
        const options = await sb('/poll_options?order=v.desc');

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
            isTied: p.is_tied,
            totalVotes,
            options: pollOpts.map((o: any) => ({ id: o.id, t: o.t, by: o.by, v: o.v }))
          };
        });
        return json(data);
      }

      // 2. POST /api/polls — create a new poll
      if (pathname === '/api/polls' && method === 'POST') {
        const body: any = await request.json();
        const id = body.id || 'poll-' + Date.now();

        await sb('/polls', {
          method: 'POST',
          body: JSON.stringify({
            id,
            question: body.question || 'Untitled poll',
            status: 'open',
            closes_label: body.closesLabel || 'Today at 7:00 PM',
            started_by: body.startedBy || 'You',
            subtitle: '0 votes · just started'
          })
        });

        const opts = (body.options || []).filter((t: string) => t?.trim());
        if (opts.length) {
          await sb('/poll_options', {
            method: 'POST',
            body: JSON.stringify(
              opts.map((t: string, i: number) => ({ id: `opt-${id}-${i}`, poll_id: id, t: t.trim(), v: 0 }))
            )
          });
        }

        return json({ success: true, pollId: id }, 201);
      }

      // 3. POST /api/polls/:id/vote — increment vote count
      const voteMatch = pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
      if (voteMatch && method === 'POST') {
        const pollId = voteMatch[1];
        const body: any = await request.json();
        const optionId = body.optionId;

        // Increment v using Supabase RPC (simple SQL function)
        await sb(`/rpc/increment_vote`, {
          method: 'POST',
          body: JSON.stringify({ option_id: optionId, p_poll_id: pollId })
        });

        // Get updated total and sync subtitle
        const opts = await sb(`/poll_options?poll_id=eq.${pollId}&select=v`);
        const total = (opts || []).reduce((s: number, o: any) => s + o.v, 0);
        await sb(`/polls?id=eq.${pollId}`, {
          method: 'PATCH',
          body: JSON.stringify({ subtitle: `${total} of your crew voted · just now` })
        });

        return json({ success: true });
      }

      // 4. POST /api/polls/:id/suggest — add a suggestion
      const suggestMatch = pathname.match(/^\/api\/polls\/([^/]+)\/suggest$/);
      if (suggestMatch && method === 'POST') {
        const pollId = suggestMatch[1];
        const body: any = await request.json();
        const optId = `opt-${pollId}-${Date.now()}`;

        await sb('/poll_options', {
          method: 'POST',
          body: JSON.stringify({ id: optId, poll_id: pollId, t: body.idea.trim(), by: body.by || 'Crew member', v: 0 })
        });

        return json({ success: true, optionId: optId }, 201);
      }

      // 5. POST /api/polls/:id/close — close the poll, detect tie or winner
      const closeMatch = pathname.match(/^\/api\/polls\/([^/]+)\/close$/);
      if (closeMatch && method === 'POST') {
        const pollId = closeMatch[1];
        const opts = await sb(`/poll_options?poll_id=eq.${pollId}&order=v.desc`);

        let isTied = false;
        let winner: string | null = null;
        if (opts?.length >= 2 && opts[0].v === opts[1].v && opts[0].v > 0) {
          isTied = true;
        } else if (opts?.length > 0) {
          winner = opts[0].t;
        }

        await sb(`/polls?id=eq.${pollId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'closed', is_tied: isTied, winner })
        });

        return json({ success: true, isTied, winner });
      }

      // 6. POST /api/polls/:id/reopen
      const reopenMatch = pathname.match(/^\/api\/polls\/([^/]+)\/reopen$/);
      if (reopenMatch && method === 'POST') {
        const pollId = reopenMatch[1];
        await sb(`/polls?id=eq.${pollId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'open', is_tied: false })
        });
        return json({ success: true });
      }

      // 7. POST /api/polls/:id/resolve-tie
      const resolveMatch = pathname.match(/^\/api\/polls\/([^/]+)\/resolve-tie$/);
      if (resolveMatch && method === 'POST') {
        const pollId = resolveMatch[1];
        const body: any = await request.json();
        await sb(`/polls?id=eq.${pollId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'closed', is_tied: false, winner: body.winner })
        });
        return json({ success: true });
      }
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }

    // Serve static frontend
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};
