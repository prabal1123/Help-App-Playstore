// import { View, Text, ActivityIndicator, Pressable } from "react-native";
// import { useEffect, useState } from "react";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import { authStyles as styles } from "@/styles/auth";

// export default function GuardianSuccess() {
//   const router = useRouter();
//   const [guardianId, setGuardianId] = useState<string | null>(null);

//   useEffect(() => {
//     checkGuardian();
//   }, []);

//   const checkGuardian = async () => {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       router.replace("/auth/email");
//       return;
//     }

//     setGuardianId(user.id);

//     const { data } = await supabase
//       .from("help_app_guardian_links")
//       .select("*")
//       .eq("guardian_id", user.id)
//       .eq("status", "approved")
//       .maybeSingle();

//     if (data) {
//       router.replace("/");
//     }
//   };

//   useEffect(() => {
//     if (!guardianId) return;

//     const channel = supabase
//       .channel("guardian-approval")
//       .on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "help_app_guardian_links",
//           filter: `guardian_id=eq.${guardianId}`,
//         },
//         (payload) => {
//           const updated = payload.new;

//           if (updated.status === "approved") {
//             router.replace("/");
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [guardianId]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.heading}>Request Sent</Text>

//       <Text style={{ marginTop: 10, textAlign: "center" }}>
//         Waiting for user approval...
//       </Text>

//       <ActivityIndicator size="large" style={{ marginTop: 30 }} />

//       <Pressable
//         style={[styles.button, { marginTop: 40 }]}
//         onPress={() => router.replace("/")}
//       >
//         <Text style={styles.buttonText}>
//           Continue to Dashboard
//         </Text>
//       </Pressable>
//     </View>
//   );
// }
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/supabase/supabase";
import { authStyles as styles } from "@/styles/auth";

export default function GuardianSuccess() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const init = async () => {
      try {
        // ✅ Fix: handle auth error explicitly
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/auth/email");
          return;
        }

        // ✅ Fix: select only needed fields, not select("*")
        const { data, error: linkError } = await supabase
          .from("help_app_guardian_links")
          .select("id, status")
          .eq("guardian_id", user.id)
          .eq("status", "approved")
          .maybeSingle();

        if (linkError) throw linkError;

        // Already approved — go straight to dashboard
        if (data) {
          router.replace("/");
          return;
        }

        // ✅ Fix: combined into single useEffect, no state bridge
        // Set up realtime subscription for approval
        const channel = supabase
          .channel("guardian-approval")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "help_app_guardian_links",
              filter: `guardian_id=eq.${user.id}`,
            },
            async (payload) => {
              const updated = payload.new;
              if (updated.status === "approved") {
                // ✅ Fix: explicitly remove channel before navigating
                if (channelRef.current) {
                  await supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                }
                clearTimeout(timeoutId);
                router.replace("/");
              }
            }
          )
          .subscribe();

        channelRef.current = channel;

        // ✅ Fix: timeout after 5 minutes so user isn't stuck forever
        timeoutId = setTimeout(() => {
          setTimedOut(true);
        }, 5 * 60 * 1000);

      } catch (e) {
        // ✅ Fix: show error state instead of silent spinner forever
        const message = e instanceof Error ? e.message : "Something went wrong.";
        setError(message);
      }
    };

    init();

    return () => {
      clearTimeout(timeoutId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setTimedOut(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.heading}>Request Sent</Text>

        {/* ✅ Fix: error state */}
        {error ? (
          <>
            <Text style={localStyles.errorText}>
              Something went wrong: {error}
            </Text>
            <Pressable
              style={localStyles.retryBtn}
              onPress={handleRetry}
              accessibilityLabel="Retry checking approval status"
            >
              <Text style={localStyles.retryBtnText}>Retry</Text>
            </Pressable>
          </>
        ) : timedOut ? (
          // ✅ Fix: timeout state so user isn't stuck forever
          <>
            <Text style={localStyles.subText}>
              Approval is taking longer than expected.{"\n"}
              Ask your user to scan your QR code.
            </Text>
            <Pressable
              style={localStyles.retryBtn}
              onPress={handleRetry}
              accessibilityLabel="Keep waiting for approval"
            >
              <Text style={localStyles.retryBtnText}>Keep Waiting</Text>
            </Pressable>
          </>
        ) : (
          // Waiting state
          <>
            <Text style={localStyles.subText}>
              Waiting for user approval...
            </Text>
            <ActivityIndicator size="large" style={localStyles.spinner} />
          </>
        )}

        {/* ✅ Fix: button disabled until approved — prevents broken dashboard access */}
        <Pressable
          style={[styles.button, localStyles.button, { opacity: 0.4 }]}
          disabled={true}
          accessibilityLabel="Continue to dashboard — waiting for approval"
        >
          <Text style={styles.buttonText}>
            Waiting for Approval...
          </Text>
        </Pressable>

        <Text style={localStyles.hintText}>
          Ask your user to open the app and scan your QR code to approve.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  subText: {
    marginTop: 10,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
  },
  spinner: {
    marginTop: 30,
  },
  button: {
    marginTop: 40,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    color: "#EF4444",
    fontSize: 14,
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#5BA89C",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  hintText: {
    marginTop: 16,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});