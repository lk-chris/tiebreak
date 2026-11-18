interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const pollId = context.params.id as string;
    const body = (await context.request.json()) as {
      optionId: string;
      voterId?: string;
    };

    if (!body.optionId) {
      return new Response(JSON.stringify({ error: "optionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const voterId =
      body.voterId ||
      context.request.headers.get("x-voter-id") ||
      "voter-" + Math.random().toString(36).substring(2, 9);

    // Atomic SQLite batch: record vote + increment option count
    const voteRecordId = `vote-${pollId}-${voterId}`;

    await db.batch([
      db
        .prepare(
          "INSERT OR REPLACE INTO votes (id, poll_id, option_id, voter_id) VALUES (?, ?, ?, ?)"
        )
        .bind(voteRecordId, pollId, body.optionId, voterId),
      db
        .prepare("UPDATE poll_options SET v = v + 1 WHERE id = ? AND poll_id = ?")
        .bind(body.optionId, pollId)
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vote recorded in SQLite D1",
        voterId
      }),
      {
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
