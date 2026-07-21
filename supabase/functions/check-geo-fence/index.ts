
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ----------------------------- Types ----------------------------- */

type GeofencePayload = {
  user_id: string;
  lat: number;
  lng: number;
};

type SafeZone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

/* --------------------------- Supabase ---------------------------- */

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/* ---------------------- Helper Functions ------------------------- */

// Haversine distance in meters
function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ----------------------------- Main ------------------------------ */

serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = (await req.json()) as Partial<GeofencePayload>;
    const { user_id, lat, lng } = body;

    if (!user_id || typeof lat !== "number" || typeof lng !== "number") {
      return new Response("Invalid payload", { status: 400 });
    }

    /* ---------- Fetch Active Safe Zone ---------- */
    const { data: zone } = await supabase
      .from("help_app_safe_zones")
      .select("center_lat, center_lng, radius_meters")
      .eq("user_id", user_id)
      .eq("active", true)
      .single<SafeZone>();

    if (!zone) {
      return new Response("No active safe zone", { status: 200 });
    }

    /* ---------- Distance Check ---------- */
    const distance = distanceInMeters(
      zone.center_lat,
      zone.center_lng,
      lat,
      lng
    );

    if (distance <= zone.radius_meters) {
      return new Response("User inside safe zone", { status: 200 });
    }

    /* ---------- Cooldown Check (10 min) ---------- */
    const cooldownTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: recentAlerts } = await supabase
      .from("help_app_alerts")
      .select("id")
      .eq("user_id", user_id)
      .eq("alert_type", "zone_exit")
      .gte("triggered_at", cooldownTime)
      .limit(1);

    if (recentAlerts && recentAlerts.length > 0) {
      return new Response("Alert already sent (cooldown)", { status: 200 });
    }

    /* ---------- Fetch Approved Guardians ---------- */
    const { data: guardians } = await supabase
      .from("help_app_guardian_links")
      .select("guardian_id")
      .eq("user_id", user_id)
      .eq("status", "approved");

    if (!guardians || guardians.length === 0) {
      return new Response("No guardians linked", { status: 200 });
    }

    /* ---------- Create Alerts + Send Push ---------- */
    for (const g of guardians) {
      // Store alert
      await supabase.from("help_app_alerts").insert({
        user_id,
        guardian_id: g.guardian_id,
        alert_type: "zone_exit",
        message: "User has exited the safe area",
      });

      // Send push notification
      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get(
              "SUPABASE_SERVICE_ROLE_KEY"
            )}`,
          },
          body: JSON.stringify({
            guardian_id: g.guardian_id,
            title: "Alert 🚨",
            body: "User has exited the safe area",
          }),
        }
      );
    }

    return new Response("Zone exit alert + push sent", { status: 200 });
  } catch (err) {
    console.error("Geofence error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
