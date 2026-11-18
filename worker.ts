interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  POLLS_KV?: KVNamespace;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ASSETS?: Fetcher;
}

const SEED_POLL = {
  id: 'pizza-night',
  question: 'Pizza night: what are we ordering?',
  status: 'open',
  closesLabel: 'Closes today 7:00 PM',
  startedBy: 'Reubenson',
  subtitle: '11 of your crew voted · last one 2 min ago',
  options: [
    { id: 'p1', t: 'Detroit-style from Emmy’s', by: 'Priya', v: 5 },
    { id: 'p2', t: 'Pepperoni from Slice House', v: 3 },
    { id: 'p3', t: 'Veggie supreme from Nino’s', by: 'Jonah', v: 2 },
    { id: 'p4', t: 'Margherita from Lupa', v: 1 }
  ],
  totalVotes: 11
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });

    if (method === 'OPTIONS') {
      return json({ ok: true });
    }

    // Helper: read polls from Cloudflare KV
    const getPolls = async (): Promise<any[]> => {
      if (!env.POLLS_KV) return [SEED_POLL];
      const raw = await env.POLLS_KV.get('polls_list', 'json');
      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        await env.POLLS_KV.put('polls_list', JSON.stringify([SEED_POLL]));
        await env.POLLS_KV.put('poll:pizza-night', JSON.stringify(SEED_POLL));
        return [SEED_POLL];
      }
      return raw;
    };

    const savePolls = async (polls: any[]) => {
      if (!env.POLLS_KV) return;
      await env.POLLS_KV.put('polls_list', JSON.stringify(polls));
    };

    if (pathname === '/api/health') {
      const kvOk = !!env.POLLS_KV;
      const polls = await getPolls();
      return json({
        status: 'ok',
        storage: kvOk ? 'Cloudflare KV (Active)' : 'Memory',
        pollCount: polls.length
      });
    }

    try {
      // 1. GET /api/polls — fetch all polls
      if (pathname === '/api/polls' && method === 'GET') {
        const polls = await getPolls();
        return json(polls);
      }

      // 2. POST /api/polls — create a new poll
      if (pathname === '/api/polls' && method === 'POST') {
        const body: any = await request.json();
        const id = body.id || 'poll-' + Date.now();

        const opts = (body.options || []).filter((t: string) => t && t.trim().length > 0);
        const newPoll = {
          id,
          question: body.question?.trim() || 'Untitled poll',
          status: 'open',
          closesLabel: body.closesLabel || 'Today at 7:00 PM',
          startedBy: body.startedBy || 'You',
          subtitle: '0 votes · just started',
          options: opts.map((t: string, i: number) => ({
            id: `opt-${id}-${i}`,
            t: t.trim(),
            v: 0
          })),
          totalVotes: 0
        };

        const list = await getPolls();
        const updated = [newPoll, ...list.filter((p: any) => p.id !== id)];
        await savePolls(updated);
        if (env.POLLS_KV) {
          await env.POLLS_KV.put(`poll:${id}`, JSON.stringify(newPoll));
        }

        return json({ success: true, pollId: id, poll: newPoll }, 201);
      }

      // 3. POST /api/polls/:id/vote — increment vote count
      const voteMatch = pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
      if (voteMatch && method === 'POST') {
        const pollId = voteMatch[1];
        const body: any = await request.json();
        const optionId = body.optionId;

        const list = await getPolls();
        const poll = list.find((p: any) => p.id === pollId);
        if (poll) {
          const opt = (poll.options || []).find((o: any) => o.id === optionId);
          if (opt) {
            opt.v = (opt.v || 0) + 1;
          }
          poll.totalVotes = (poll.options || []).reduce((s: number, o: any) => s + (o.v || 0), 0);
          poll.subtitle = `${poll.totalVotes} of your crew voted · just now`;
          await savePolls(list);
          if (env.POLLS_KV) {
            await env.POLLS_KV.put(`poll:${pollId}`, JSON.stringify(poll));
          }
        }

        return json({ success: true });
      }

      // 4. POST /api/polls/:id/suggest — add a suggestion
      const suggestMatch = pathname.match(/^\/api\/polls\/([^/]+)\/suggest$/);
      if (suggestMatch && method === 'POST') {
        const pollId = suggestMatch[1];
        const body: any = await request.json();
        const optId = `opt-${pollId}-${Date.now()}`;

        const list = await getPolls();
        const poll = list.find((p: any) => p.id === pollId);
        if (poll) {
          poll.options = poll.options || [];
          poll.options.push({
            id: optId,
            t: (body.idea || '').trim(),
            by: body.by || 'Crew member',
            v: 0
          });
          await savePolls(list);
          if (env.POLLS_KV) {
            await env.POLLS_KV.put(`poll:${pollId}`, JSON.stringify(poll));
          }
        }

        return json({ success: true, optionId: optId }, 201);
      }

      // 5. POST /api/polls/:id/close — close the poll, compute winner/tie
      const closeMatch = pathname.match(/^\/api\/polls\/([^/]+)\/close$/);
      if (closeMatch && method === 'POST') {
        const pollId = closeMatch[1];
        const list = await getPolls();
        const poll = list.find((p: any) => p.id === pollId);

        let isTied = false;
        let winner: string | null = null;

        if (poll) {
          const sorted = [...(poll.options || [])].sort((a: any, b: any) => (b.v || 0) - (a.v || 0));
          if (sorted.length >= 2 && sorted[0].v === sorted[1].v && sorted[0].v > 0) {
            isTied = true;
          } else if (sorted.length > 0) {
            winner = sorted[0].t;
          }

          poll.status = 'closed';
          poll.isTied = isTied;
          poll.winner = winner;

          await savePolls(list);
          if (env.POLLS_KV) {
            await env.POLLS_KV.put(`poll:${pollId}`, JSON.stringify(poll));
          }
        }

        return json({ success: true, isTied, winner });
      }

      // 6. POST /api/polls/:id/reopen
      const reopenMatch = pathname.match(/^\/api\/polls\/([^/]+)\/reopen$/);
      if (reopenMatch && method === 'POST') {
        const pollId = reopenMatch[1];
        const list = await getPolls();
        const poll = list.find((p: any) => p.id === pollId);
        if (poll) {
          poll.status = 'open';
          poll.isTied = false;
          await savePolls(list);
          if (env.POLLS_KV) {
            await env.POLLS_KV.put(`poll:${pollId}`, JSON.stringify(poll));
          }
        }
        return json({ success: true });
      }

      // 7. POST /api/polls/:id/resolve-tie
      const resolveMatch = pathname.match(/^\/api\/polls\/([^/]+)\/resolve-tie$/);
      if (resolveMatch && method === 'POST') {
        const pollId = resolveMatch[1];
        const body: any = await request.json();
        const list = await getPolls();
        const poll = list.find((p: any) => p.id === pollId);
        if (poll) {
          poll.status = 'closed';
          poll.isTied = false;
          poll.winner = body.winner;
          await savePolls(list);
          if (env.POLLS_KV) {
            await env.POLLS_KV.put(`poll:${pollId}`, JSON.stringify(poll));
          }
        }
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
