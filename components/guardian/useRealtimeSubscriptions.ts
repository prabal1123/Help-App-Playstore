import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/supabase/supabase";
import * as Notifications from "expo-notifications";
import { AlarmType } from "./useAlarmManager";
import { isUserOutsideZones, isUserAwayFromHome } from "./distanceUtils";

type LatLng = { latitude: number; longitude: number };

interface SubscriptionCallbacks {
  onLocationUpdate: (lat: number, lng: number, recordedAt: string) => void;
  onAlertTriggered: (
    type: AlarmType,
    title: string,
    body: string
  ) => void;
  zones: any[];
  home: LatLng | null;
  userName: string;
  prevIsOutside: React.MutableRefObject<boolean>;
  prevIsAwayFromHome: React.MutableRefObject<boolean>;
}

async function sendPushNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  } catch (err) {
    console.log("❌ Notification error:", err);
  }
}

export function useRealtimeSubscriptions(
  selectedUser: { user_id: string; name: string } | null,
  callbacks: SubscriptionCallbacks
) {
  const realtimeChannel = useRef<any>(null);
  const alertChannel = useRef<any>(null);

  // ─── Location updates ─────────────────────────────────────────────────────
  const subscribeToLocationUpdates = useCallback(
    (
      userId: string,
      zones: any[],
      home: LatLng | null,
      userName: string
    ) => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }

      realtimeChannel.current = supabase
        .channel(`location_updates_${userId}`)
        .on(
          "postgres_changes",
          {
            // ✅ Back to INSERT only
            event: "INSERT",
            schema: "public",
            table: "help_app_user_locations",
            filter: `user_id=eq.${userId}`,
          },
          async (payload: any) => {
            console.log("📡 Realtime payload received:", payload.eventType, payload.new);
            try {
              const record = payload.new;
              if (record.is_home) return;
              const lat = record.latitude ?? record.lat;
              const lng = record.longitude ?? record.lng;
              if (lat == null || lng == null) return;

              const newLat = Number(lat);
              const newLng = Number(lng);

              callbacks.onLocationUpdate(newLat, newLng, record.recorded_at);   

              // Evaluate zone/home alerts
              const nowOutside = isUserOutsideZones(newLat, newLng, zones);
              const nowAwayFromHome = isUserAwayFromHome(newLat, newLng, home);

              if (nowAwayFromHome && !callbacks.prevIsAwayFromHome.current) {
                const title = "🏠 User Left Home";
                const body = `${userName} has left home.`;
                await sendPushNotification(title, body);
                callbacks.onAlertTriggered("left_home", title, body);
              }
              callbacks.prevIsAwayFromHome.current = nowAwayFromHome;

              if (nowOutside && !callbacks.prevIsOutside.current) {
                const title = "🚨 Safe Zone Alert";
                const body = `${userName} has crossed outside the safe zone!`;
                await sendPushNotification(title, body);
                callbacks.onAlertTriggered("safe_zone", title, body);
              }
              callbacks.prevIsOutside.current = nowOutside;
            } catch (err) {
              console.error("Realtime payload error:", err);
            }
          }
        )
        .subscribe((status: string, err: any) => {
          console.log("📡 Realtime status:", status);
          if (err) console.error("Realtime subscribe error:", err);
        });
    },
    []
  );

  // ─── Alert channel (panic / zone_exit from background) ───────────────────
  useEffect(() => {
    if (!selectedUser) return;

    if (alertChannel.current) {
      supabase.removeChannel(alertChannel.current);
      alertChannel.current = null;
    }

    alertChannel.current = supabase
      .channel(`guardian_alerts_${selectedUser.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "help_app_alerts",
          filter: `user_id=eq.${selectedUser.user_id}`,
        },
        async (payload: any) => {
          try {
            const alert = payload.new;
            const alertType = alert.alert_type;
            console.log("🚨 Alert received:", alertType);

            if (alertType === "panic") {
              const title = "🚨 Emergency Alert";
              const body = `${selectedUser.name} needs help!`;
              await sendPushNotification(title, body);
              callbacks.onAlertTriggered("panic", title, body);
            } else if (alertType === "zone_exit") {
              const isHomeAlert = alert.message?.toLowerCase().includes("home");
              const title = isHomeAlert ? "🏠 User Left Home" : "🚨 Safe Zone Alert";
              const body =
                alert.message || `${selectedUser.name} has left a monitored area.`;
              await sendPushNotification(title, body);
              callbacks.onAlertTriggered(
                isHomeAlert ? "left_home" : "safe_zone",
                title,
                body
              );
            } else if (alertType === "manual_help") {
              const title = "🆘 Manual Help Request";
              const body =
                alert.message || `${selectedUser.name} requested help.`;
              await sendPushNotification(title, body);
              callbacks.onAlertTriggered("panic", title, body);
            }
          } catch (err) {
            console.error("Alert listener error:", err);
          }
        }
      )
      .subscribe((status: string) => {
        console.log("📡 Alert subscription status:", status);
      });

    return () => {
      if (alertChannel.current) {
        supabase.removeChannel(alertChannel.current);
        alertChannel.current = null;
      }
    };
  }, [selectedUser]);

  const unsubscribeAll = () => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
    if (alertChannel.current) {
      supabase.removeChannel(alertChannel.current);
      alertChannel.current = null;
    }
  };

  return { subscribeToLocationUpdates, unsubscribeAll };
}


// import { useEffect, useRef, useCallback } from "react";
// import { supabase } from "@/supabase/supabase";
// import * as Notifications from "expo-notifications";
// import { AlarmType } from "./useAlarmManager";
// import { isUserOutsideZones, isUserAwayFromHome } from "./distanceUtils";

// type LatLng = { latitude: number; longitude: number };

// interface SubscriptionCallbacks {
//   onLocationUpdate: (lat: number, lng: number, recordedAt: string) => void;
//   onAlertTriggered: (
//     type: AlarmType,
//     title: string,
//     body: string
//   ) => void;
//   zones: any[];
//   home: LatLng | null;
//   userName: string;
//   prevIsOutside: React.MutableRefObject<boolean>;
//   prevIsAwayFromHome: React.MutableRefObject<boolean>;
// }

// async function sendPushNotification(title: string, body: string) {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.MAX,
//       },
//       trigger: null,
//     });
//   } catch (err) {
//     console.log("❌ Notification error:", err);
//   }
// }

// export function useRealtimeSubscriptions(
//   selectedUser: { user_id: string; name: string } | null,
//   callbacks: SubscriptionCallbacks
// ) {
//   const realtimeChannel = useRef<any>(null);
//   const alertChannel = useRef<any>(null);

//   // ─── FIX: Store callbacks in a ref so handlers always use fresh values ────
//   // Without this, the .on() handler captures a stale closure of callbacks at
//   // subscription time. zones, home, and onAlertTriggered could all be outdated
//   // if the parent re-renders after subscribing.
//   const callbacksRef = useRef(callbacks);
//   useEffect(() => {
//     callbacksRef.current = callbacks;
//   }, [callbacks]);

//   // ─── FIX: Cleanup realtimeChannel on unmount ──────────────────────────────
//   // Previously only alertChannel had a cleanup. realtimeChannel stayed open
//   // indefinitely — even after screen lock — causing Supabase to reconnect in
//   // a loop every ~10 seconds, spawning new threads and leaking ~1MB per cycle.
//   useEffect(() => {
//     return () => {
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }
//     };
//   }, []);

//   // ─── Location updates ─────────────────────────────────────────────────────
//   const subscribeToLocationUpdates = useCallback(
//     (
//       userId: string,
//       zones: any[],
//       home: LatLng | null,
//       userName: string
//     ) => {
//       if (realtimeChannel.current) {
//         supabase.removeChannel(realtimeChannel.current);
//         realtimeChannel.current = null;
//       }

//       realtimeChannel.current = supabase
//         .channel(`location_updates_${userId}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "help_app_user_locations",
//             filter: `user_id=eq.${userId}`,
//           },
//           async (payload: any) => {
//             console.log("📡 Realtime payload received:", payload.eventType, payload.new);
//             try {
//               const record = payload.new;
//               if (record.is_home) return;
//               const lat = record.latitude ?? record.lat;
//               const lng = record.longitude ?? record.lng;
//               if (lat == null || lng == null) return;

//               const newLat = Number(lat);
//               const newLng = Number(lng);

//               // Use callbacksRef.current so we always have fresh zones, home,
//               // onLocationUpdate, onAlertTriggered — not stale closure values
//               const cb = callbacksRef.current;

//               cb.onLocationUpdate(newLat, newLng, record.recorded_at);

//               const nowOutside = isUserOutsideZones(newLat, newLng, cb.zones);
//               const nowAwayFromHome = isUserAwayFromHome(newLat, newLng, cb.home);

//               if (nowAwayFromHome && !cb.prevIsAwayFromHome.current) {
//                 const title = "🏠 User Left Home";
//                 const body = `${cb.userName} has left home.`;
//                 await sendPushNotification(title, body);
//                 cb.onAlertTriggered("left_home", title, body);
//               }
//               cb.prevIsAwayFromHome.current = nowAwayFromHome;

//               if (nowOutside && !cb.prevIsOutside.current) {
//                 const title = "🚨 Safe Zone Alert";
//                 const body = `${cb.userName} has crossed outside the safe zone!`;
//                 await sendPushNotification(title, body);
//                 cb.onAlertTriggered("safe_zone", title, body);
//               }
//               cb.prevIsOutside.current = nowOutside;
//             } catch (err) {
//               console.error("Realtime payload error:", err);
//             }
//           }
//         )
//         .subscribe((status: string, err: any) => {
//           console.log("📡 Realtime status:", status);
//           if (err) console.error("Realtime subscribe error:", err);
//         });
//     },
//     [] // safe — handler reads from callbacksRef.current, not captured callbacks
//   );

//   // ─── Alert channel (panic / zone_exit from background) ───────────────────
//   useEffect(() => {
//     if (!selectedUser) return;

//     if (alertChannel.current) {
//       supabase.removeChannel(alertChannel.current);
//       alertChannel.current = null;
//     }

//     alertChannel.current = supabase
//       .channel(`guardian_alerts_${selectedUser.user_id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "help_app_alerts",
//           filter: `user_id=eq.${selectedUser.user_id}`,
//         },
//         async (payload: any) => {
//           try {
//             const alert = payload.new;
//             const alertType = alert.alert_type;
//             console.log("🚨 Alert received:", alertType);

//             // Use callbacksRef.current for fresh onAlertTriggered
//             const cb = callbacksRef.current;

//             if (alertType === "panic") {
//               const title = "🚨 Emergency Alert";
//               const body = `${selectedUser.name} needs help!`;
//               await sendPushNotification(title, body);
//               cb.onAlertTriggered("panic", title, body);
//             } else if (alertType === "zone_exit") {
//               const isHomeAlert = alert.message?.toLowerCase().includes("home");
//               const title = isHomeAlert ? "🏠 User Left Home" : "🚨 Safe Zone Alert";
//               const body =
//                 alert.message || `${selectedUser.name} has left a monitored area.`;
//               await sendPushNotification(title, body);
//               cb.onAlertTriggered(
//                 isHomeAlert ? "left_home" : "safe_zone",
//                 title,
//                 body
//               );
//             } else if (alertType === "manual_help") {
//               const title = "🆘 Manual Help Request";
//               const body =
//                 alert.message || `${selectedUser.name} requested help.`;
//               await sendPushNotification(title, body);
//               cb.onAlertTriggered("panic", title, body);
//             }
//           } catch (err) {
//             console.error("Alert listener error:", err);
//           }
//         }
//       )
//       .subscribe((status: string) => {
//         console.log("📡 Alert subscription status:", status);
//       });

//     return () => {
//       if (alertChannel.current) {
//         supabase.removeChannel(alertChannel.current);
//         alertChannel.current = null;
//       }
//     };
//   }, [selectedUser]); // selectedUser change tears down and rebuilds the channel

//   // ─── Cleanup both channels ────────────────────────────────────────────────
//   const unsubscribeAll = () => {
//     if (realtimeChannel.current) {
//       supabase.removeChannel(realtimeChannel.current);
//       realtimeChannel.current = null;
//     }
//     if (alertChannel.current) {
//       supabase.removeChannel(alertChannel.current);
//       alertChannel.current = null;
//     }
//   };

//   return { subscribeToLocationUpdates, unsubscribeAll };
// }