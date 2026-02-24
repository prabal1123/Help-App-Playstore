import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PushPayload = {
  guardian_id: string;
  title: string;
  body: string;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request): Promise<Response> => {
  try {
    const body = (await req.json()) as PushPayload;

    const { guardian_id, title, body: message } = body;

    if (!guardian_id || !title || !message) {
      return new Response("Invalid payload", { status: 400 });
    }

    const { data: tokens } = await supabase
      .from("help_app_push_tokens")
      .select("expo_token")
      .eq("user_id", guardian_id);

    if (!tokens || tokens.length === 0) {
      return new Response("No tokens", { status: 200 });
    }

    for (const t of tokens) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: t.expo_token,
          title,
          body: message,
          sound: "default"
        })
      });
    }

    return new Response("Push sent", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Internal Error", { status: 500 });
  }
});
