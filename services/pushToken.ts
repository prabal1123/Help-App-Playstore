
// // services/pushToken.ts
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { supabase } from "@/supabase/supabase";

// const PROJECT_ID = "e087604e-7e57-4863-9ea5-870bd012c17d";

// // ─── Shared: get + save token for any logged-in user ─────────────────────────
// // Works for both "guardian" and "user" roles.
// // Upserts into help_app_push_tokens keyed by user_id.
// export const saveExpoPushToken = async () => {
//   try {
//     if (!Device.isDevice) {
//       console.log("⚠️ Push tokens only work on physical devices");
//       return;
//     }

//     // ── Permission check ──
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== "granted") {
//       console.log("❌ Push notification permission denied");
//       return;
//     }

//     // ── Get token ──
//     const tokenData = await Notifications.getExpoPushTokenAsync({
//       projectId: PROJECT_ID,
//     });
//     const token = tokenData.data;
//     console.log("📱 Expo push token:", token);

//     // ── Get current user ──
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       console.log("❌ Could not get user for push token save");
//       return;
//     }

//     // ── Upsert token — works for both guardian and user ──
//     const { error } = await supabase
//       .from("help_app_push_tokens")
//       .upsert(
//         { user_id: user.id, expo_token: token, updated_at: new Date().toISOString() },
//         { onConflict: "user_id" }
//       );

//     if (error) {
//       console.log("❌ Error saving push token:", error.message);
//     } else {
//       console.log("✅ Push token saved for user:", user.id);
//     }
//   } catch (err) {
//     console.log("❌ Error getting push token:", err);
//   }
// };

// // ─── Fetch any user's push token from DB ─────────────────────────────────────
// // Used by backgroundLocation.ts to look up guardian's token at runtime.
// export const getPushTokenForUser = async (userId: string): Promise<string | null> => {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_push_tokens")
//       .select("expo_token")
//       .eq("user_id", userId)
//       .maybeSingle();

//     if (error || !data) return null;
//     return data.expo_token ?? null;
//   } catch (err) {
//     console.log("❌ Error fetching push token:", err);
//     return null;
//   }
// };

// // ─── Send a real Expo push notification via Expo Push API ────────────────────
// // Works even when the recipient's app is completely killed.
// export const sendExpoPushNotification = async (
//   expoPushToken: string,
//   title: string,
//   body: string
// ) => {
//   try {
//     const response = await fetch("https://exp.host/--/expo-push-notification", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify({
//         to: expoPushToken,
//         title,
//         body,
//         sound: "default",
//         priority: "high",
//         channelId: "default",
//       }),
//     });

//     const result = await response.json();

//     // ── Log any delivery errors from Expo ──
//     if (result?.data?.status === "error") {
//       console.log("❌ Expo push delivery error:", result.data.message);
//     } else {
//       console.log("✅ Expo push sent to:", expoPushToken);
//     }
//   } catch (err) {
//     console.log("❌ sendExpoPushNotification error:", err);
//   }
// };


// // services/pushToken.ts
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { supabase } from "@/supabase/supabase";

// // const PROJECT_ID = "e087604e-7e57-4863-9ea5-870bd012c17d";
// const PROJECT_ID = "5576cb62-00c7-40e8-9dc7-8279b9871fbe";

// // ─── Shared: get + save token for any logged-in user ─────────────────────────
// // Works for both "guardian" and "user" roles.
// // Upserts into help_app_push_tokens keyed by user_id.
// export const saveExpoPushToken = async () => {
//   try {
//     if (!Device.isDevice) {
//       console.log("⚠️ Push tokens only work on physical devices");
//       return;
//     }

//     // ── Permission check ──
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== "granted") {
//       console.log("❌ Push notification permission denied");
//       return;
//     }

//     // ── Get token ──
//     const tokenData = await Notifications.getExpoPushTokenAsync({
//       projectId: PROJECT_ID,
//     });
//     const token = tokenData.data;
//     console.log("📱 Expo push token:", token);

//     // ── Get current user ──
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();
//     if (userError || !user) {
//       console.log("❌ Could not get user for push token save");
//       return;
//     }

//     // ── Upsert token — works for both guardian and user ──
//     const { error } = await supabase.from("help_app_push_tokens").upsert(
//       {
//         user_id: user.id,
//         expo_token: token,
//         updated_at: new Date().toISOString(),
//       },
//       { onConflict: "user_id" }
//     );

//     if (error) {
//       console.log("❌ Error saving push token:", error.message);
//     } else {
//       console.log("✅ Push token saved for user:", user.id);
//     }
//   } catch (err) {
//     console.log("❌ Error getting push token:", err);
//   }
// };

// // ─── Fetch any user's push token from DB ─────────────────────────────────────
// // Used to look up guardian's token at runtime before sending alert.
// export const getPushTokenForUser = async (
//   userId: string
// ): Promise<string | null> => {
//   try {
//     const { data, error } = await supabase
//       .from("help_app_push_tokens")
//       .select("expo_token")
//       .eq("user_id", userId)
//       .maybeSingle();

//     if (error || !data) return null;
//     return data.expo_token ?? null;
//   } catch (err) {
//     console.log("❌ Error fetching push token:", err);
//     return null;
//   }
// };

// // ─── Send a real Expo push notification via Expo Push API ────────────────────
// // Works even when the recipient's app is completely killed.
// export const sendExpoPushNotification = async (
//   expoPushToken: string,
//   title: string,
//   body: string
// ) => {
//   try {
//     const response = await fetch("https://exp.host/--/api/v2/push/send", { // ✅ Fixed URL
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify({
//         to: expoPushToken,
//         title,
//         body,
//         sound: "default",
//         priority: "high",
//         channelId: "default",
//       }),
//     });

//     const result = await response.json();

//     // ── Log any delivery errors from Expo ──
//     if (result?.data?.status === "error") {
//       console.log("❌ Expo push delivery error:", result.data.message);
//     } else {
//       console.log("✅ Expo push sent:", JSON.stringify(result));
//     }
//   } catch (err) {
//     console.log("❌ sendExpoPushNotification error:", err);
//   }
// };
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "@/supabase/supabase";

const PROJECT_ID = "5576cb62-00c7-40e8-9dc7-8279b9871fbe";

// ─── Shared: get + save token for any logged-in user ─────────────────────────
export const saveExpoPushToken = async () => {
  try {
    if (!Device.isDevice) {
      console.log("⚠️ Push tokens only work on physical devices");
      return;
    }

    // ── Permission check ──
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("❌ Push notification permission denied");
      return;
    }

    // ── Get token ──
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    const token = tokenData.data;
    console.log("📱 Expo push token:", token);

    // ── Get current user ──
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log("❌ Could not get user for push token save");
      return;
    }

    // ── Upsert token ──
    const { error } = await supabase.from("help_app_push_tokens").upsert(
      {
        user_id: user.id,
        expo_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.log("❌ Error saving push token:", error.message);
    } else {
      console.log("✅ Push token saved for user:", user.id);
    }
  } catch (err) {
    console.log("❌ Error getting push token:", err);
  }
};

// ─── Fetch any user's push token from DB ─────────────────────────────────────
export const getPushTokenForUser = async (
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("help_app_push_tokens")
      .select("expo_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.expo_token ?? null;
  } catch (err) {
    console.log("❌ Error fetching push token:", err);
    return null;
  }
};

// ─── Send a real Expo push notification via Expo Push API ────────────────────
export const sendExpoPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string
) => {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        sound: "default",
        priority: "high",
        channelId: "default",
      }),
    });

    const result = await response.json();

    // ✅ Fixed: data is an array
    const item = result?.data?.[0];
    if (item?.status === "error") {
      console.log("❌ Expo push delivery error:", item.message, item.details);
    } else {
      console.log("✅ Expo push sent:", JSON.stringify(item));
    }
  } catch (err) {
    console.log("❌ sendExpoPushNotification error:", err);
  }
};