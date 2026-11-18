interface Env {
  DB: D1Database;
}

interface PollRow {
  id: string;
  question: string;
  status: string;
  closes_label: string;
  started_by: string;
  subtitle: string;
  winner: string | null;
  is_tied: number;
}

interface OptionRow {
  id: string;
  poll_id: string;
  t: string;
  by: string | null;
  v: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "D1 database not bound" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { results: polls } = await db
      .prepare("SELECT * FROM polls ORDER BY created_at DESC")
      .all<PollRow>();

    const { results: options } = await db
      .prepare("SELECT * FROM poll_options ORDER BY v DESC")
      .all<OptionRow>();

    const pollsWithOptions = (polls || []).map((poll) => {
      const pollOpts = (options || []).filter((opt) => opt.poll_id === poll.id);
      const totalVotes = pollOpts.reduce((sum, opt) => sum + opt.v, 0);
      return {
        id: poll.id,
        question: poll.question,
        status: poll.status,
        closesLabel: poll.closes_label,
        startedBy: poll.started_by,
        subtitle: poll.subtitle,
        winner: poll.winner,
        isTied: Boolean(poll.is_tied),
        totalVotes,
        options: pollOpts.map((o) => ({
          id: o.id,
          t: o.t,
          by: o.by,
          v: o.v
        }))
      };
    });

    return new Response(JSON.stringify(pollsWithOptions), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as {
      id?: string;
      question: string;
      options: string[];
      closesLabel?: string;
      startedBy?: string;
    };

    const pollId = body.id || "poll-" + Date.now();
    const question = body.question || "Untitled Poll";
    const closesLabel = body.closesLabel || "Today at 7:00 PM";
    const startedBy = body.startedBy || "You";

    await db
      .prepare(
        "INSERT INTO polls (id, question, status, closes_label, started_by, subtitle) VALUES (?, ?, 'open', ?, ?, ?)"
      )
      .bind(pollId, question, closesLabel, startedBy, "0 votes · just started")
      .run();

    const validOptions = (body.options || []).filter((o) => o.trim().length > 0);
    const statements = validOptions.map((opt, idx) =>
      db
        .prepare("INSERT INTO poll_options (id, poll_id, t, v) VALUES (?, ?, ?, 0)")
        .bind(`opt-${pollId}-${idx}`, pollId, opt.trim())
    );

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return new Response(
      JSON.stringify({ success: true, pollId, message: "Poll created in SQLite D1" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
