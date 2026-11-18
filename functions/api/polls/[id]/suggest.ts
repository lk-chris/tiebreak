interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const pollId = context.params.id as string;
    const body = (await context.request.json()) as {
      idea: string;
      by?: string;
    };

    if (!body.idea || !body.idea.trim()) {
      return new Response(JSON.stringify({ error: "Idea cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const optionId = `opt-${pollId}-${Date.now()}`;
    const byName = body.by || "Crew member";

    await db
      .prepare(
        "INSERT INTO poll_options (id, poll_id, t, by, v) VALUES (?, ?, ?, ?, 0)"
      )
      .bind(optionId, pollId, body.idea.trim(), byName)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        optionId,
        message: "Suggestion saved to SQLite D1"
      }),
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
