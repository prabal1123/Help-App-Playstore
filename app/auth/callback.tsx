// import { useEffect, useRef } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";
// import { supabase } from "@/supabase/supabase";
// import * as WebBrowser from "expo-web-browser";

// // ← Closes the browser when helpapp://auth/callback is received
// WebBrowser.maybeCompleteAuthSession();

// export default function AuthCallback() {
//   const router = useRouter();

//   // ✅ FIX: guard so handleProfile never runs twice
//   // Both onAuthStateChange and checkSession can fire — this prevents double navigation
//   const handledRef = useRef(false);

//   useEffect(() => {
//     // ✅ FIX: timeout safety net — if nothing resolves in 10s, send to login
//     const timeoutId = setTimeout(() => {
//       if (!handledRef.current) {
//         console.warn("Auth callback timed out — redirecting to login");
//         router.replace("/auth/email");
//       }
//     }, 10000);

//     // ── Listen for auth state change — fires when Supabase session is ready ──
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (event === "SIGNED_IN" && session) {
//         await handleProfile(session.user.id);
//       } else if (event === "SIGNED_OUT") {
//         router.replace("/auth/email");
//       }
//     });

//     // ── Also check for existing session immediately as fallback ──
//     // Only acts if the auth listener hasn't already handled it
//     const checkSession = async () => {
//       // Small delay to give the auth listener a chance to fire first
//       await new Promise((r) => setTimeout(r, 500));

//       // If already handled by the listener, skip
//       if (handledRef.current) return;

//       // ✅ FIX: handle getSession error
//       const { data: { session }, error } = await supabase.auth.getSession();
//       if (error) {
//         console.error("getSession error:", error.message);
//         router.replace("/auth/email");
//         return;
//       }

//       if (session) {
//         await handleProfile(session.user.id);
//       } else {
//         router.replace("/auth/email");
//       }
//     };

//     checkSession();

//     return () => {
//       subscription.unsubscribe();
//       clearTimeout(timeoutId);
//     };
//   }, [router]); // ✅ FIX: router in deps

//   // ─── Handle profile routing ───────────────────────────────────────────────
//   const handleProfile = async (userId: string) => {
//     // ✅ FIX: prevent double navigation from listener + checkSession both firing
//     if (handledRef.current) return;
//     handledRef.current = true;

//     try {
//       // ✅ FIX: only select needed columns instead of select("*")
//       const { data: profile, error: profileError } = await supabase
//         .from("help_app_profiles")
//         .select("role, name, phone, dob, gender, hometown")
//         .eq("id", userId)
//         .maybeSingle();

//       // ✅ FIX: handle profile fetch error
//       if (profileError) {
//         console.error("Profile fetch error:", profileError.message);
//         router.replace("/auth/email");
//         return;
//       }

//       // First login — no profile yet, send to profile setup
//       if (!profile) {
//         router.replace("/(tabs)/profile");
//         return;
//       }

//       // ── Guardian flow ──
//       if (profile.role === "guardian") {
//         // ✅ FIX: handle RPC error — was routing to add-guardian on any failure
//         const { data: hasUser, error: rpcError } = await supabase.rpc(
//           "has_guardian_user",
//           { guardian_uuid: userId }
//         );

//         if (rpcError) {
//           console.error("has_guardian_user RPC error:", rpcError.message);
//           // Safe fallback — go home rather than force add-guardian on every login
//           router.replace("/");
//           return;
//         }

//         router.replace(hasUser ? "/" : "/auth/add-guardian");
//         return;
//       }

//       // ── User flow ──
//       const isComplete =
//         profile.name &&
//         profile.phone &&
//         profile.dob &&
//         profile.gender &&
//         profile.hometown;

//       router.replace(isComplete ? "/" : "/(tabs)/profile");
//     } catch (error) {
//       console.error("handleProfile error:", error);
//       router.replace("/auth/email");
//     }
//   };

//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "#F7F9F8",
//       }}
//     >
//       <ActivityIndicator size="large" color="#5BA99A" />
//     </View>
//   );
// }





import { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const VALID_ROLES = ["user", "guardian"] as const;
type Role = (typeof VALID_ROLES)[number];

const TIMEOUT_MS = 10000;

export default function AuthCallback() {
  const router = useRouter();
  const handledRef = useRef(false);
  const [showTimeout, setShowTimeout] = useState(false);

  // ✅ Fix 3: useCallback makes handleProfile stable for useEffect deps
  const handleProfile = useCallback(
    async (userId: string) => {
      // ✅ Fix 4: handledRef is the single source of truth — no race conditions
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        const { data: profile, error: profileError } = await supabase
          .from("help_app_profiles")
          .select("role, name, phone, dob, gender, hometown")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError.message);
          router.replace("/auth/get-started");
          return;
        }

        // New user — no profile yet
        if (!profile) {
          router.replace("/(tabs)/profile");
          return;
        }

        // ✅ Fix 2: Reject unknown roles explicitly
        if (!VALID_ROLES.includes(profile.role as Role)) {
          console.error("Unknown role:", profile.role);
          await supabase.auth.signOut();
          router.replace("/auth/get-started");
          return;
        }

        // Guardian flow
        if (profile.role === "guardian") {
          const { data: hasUser, error: rpcError } = await supabase.rpc(
            "has_guardian_user",
            { guardian_uuid: userId }
          );

          if (rpcError) {
            console.error("RPC error:", rpcError.message);
            router.replace("/");
            return;
          }

          router.replace(hasUser ? "/" : "/auth/add-guardian");
          return;
        }

        // User flow
        const isComplete =
          profile.name &&
          profile.phone &&
          profile.dob &&
          profile.gender &&
          profile.hometown;

        router.replace(isComplete ? "/" : "/(tabs)/profile");
      } catch (error) {
        console.error("handleProfile error:", error);
        // ✅ Fix 5: /auth/get-started, never bare /auth/email
        router.replace("/auth/get-started");
      }
    },
    [router]
  );

  useEffect(() => {
    // ✅ Fix 5 & 6: Timeout shows message then goes to get-started
    const timeoutId = setTimeout(() => {
      if (!handledRef.current) {
        handledRef.current = true;
        setShowTimeout(true);
        // Give user 2s to read message before redirecting
        setTimeout(() => router.replace("/auth/get-started"), 2000);
      }
    }, TIMEOUT_MS);

    // Auth state listener — primary path
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await handleProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        router.replace("/auth/get-started");
      }
    });

    // ✅ Fix 4: Immediate check, no arbitrary 500ms delay
    // handledRef ensures only one path ever acts
    const checkSession = async () => {
      if (handledRef.current) return;

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("getSession error:", error.message);
        if (!handledRef.current) {
          handledRef.current = true;
          router.replace("/auth/get-started");
        }
        return;
      }

      if (session) {
        await handleProfile(session.user.id);
      } else if (!handledRef.current) {
        handledRef.current = true;
        router.replace("/auth/get-started");
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [router, handleProfile]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
      }}
    >
      {/* ✅ Fix 7: Consistent brand color #2B3F77 */}
      <ActivityIndicator size="large" color="#2B3F77" />
      {/* ✅ Fix 6: Timeout feedback */}
      {showTimeout && (
        <Text
          style={{
            marginTop: 16,
            color: "#6B7280",
            fontSize: 14,
            textAlign: "center",
            paddingHorizontal: 32,
          }}
        >
          Taking too long — redirecting you back…
        </Text>
      )}
    </View>
  );
}