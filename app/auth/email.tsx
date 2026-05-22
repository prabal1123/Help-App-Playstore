// import {
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
//   Keyboard,
//   ActivityIndicator,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { useState, useEffect } from "react";
// import { supabase } from "@/supabase/supabase";
// import { FontAwesome5 } from "@expo/vector-icons";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function EmailScreen() {
//   const router = useRouter();
//   const { role } = useLocalSearchParams<{ role: "user" | "guardian" }>();

//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [step, setStep] = useState<"email" | "otp">("email");
//   const [loading, setLoading] = useState(false);

//   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const isValidOtp = otp.length === 6;

//   useEffect(() => {
//     if (!role) router.replace("/auth/get-started");
//   }, [role]);

//   if (!role) return null;

//   // ─── SEND OTP ─────────────────────────────
//   const handleSendOtp = async () => {
//     try {
//       setLoading(true);
//       const { error } = await supabase.auth.signInWithOtp({ email });
//       if (error) throw error;
//       setStep("otp");
//       Alert.alert("OTP Sent", "Check your email");
//     } catch (error: any) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─── VERIFY OTP ─────────────────────────────
//   const handleVerify = async () => {
//     try {
//       setLoading(true);

//       const { error } = await supabase.auth.verifyOtp({
//         email,
//         token: otp,
//         type: "email",
//       });

//       if (error) throw error;

//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) throw new Error("Session not created.");

//       const user = session.user;

//       const { data: profile } = await supabase
//         .from("help_app_profiles")
//         .select("*")
//         .eq("id", user.id)
//         .maybeSingle();

//       if (!profile) {
//         const { error: insertError } = await supabase
//           .from("help_app_profiles")
//           .upsert({ id: user.id, email: user.email, role });

//         if (insertError) throw insertError;

//         router.replace(role === "guardian" ? "/auth/add-guardian" : "/(tabs)/profile");
//         return;
//       }

//       if (profile.role !== role) {
//         await supabase.auth.signOut();
//         Alert.alert("Wrong Role", `This account is ${profile.role}`);
//         return;
//       }

//       if (role === "guardian") {
//         const { data: hasUser } = await supabase.rpc("has_guardian_user", {
//           guardian_uuid: user.id,
//         });
//         router.replace(hasUser ? "/" : "/auth/add-guardian");
//         return;
//       }

//       const isProfileComplete =
//         profile.name &&
//         profile.phone &&
//         profile.dob &&
//         profile.gender &&
//         profile.hometown;

//       router.replace(isProfileComplete ? "/" : "/profile");

//     } catch (error: any) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//           <View style={{ flex: 1, paddingHorizontal: 24 }}>

//             {/* Back */}
//             <Pressable
//               onPress={() =>
//                 step === "otp"
//                   ? setStep("email")
//                   : router.replace("/auth/get-started")
//               }
//               style={{ marginTop: 8 }}
//             >
//               <Text style={{ fontSize: 16, color: "#6B7280" }}>← Back</Text>
//             </Pressable>

//             {/* ── Centered content ── */}
//             <View style={{ flex: 1, justifyContent: "center" }}>

//               {/* Title */}
//               <Text style={{ fontSize: 32, fontWeight: "700", color: "#111827" }}>
//                 {step === "email" ? "Create your account" : "Check your email"}
//               </Text>
//               <Text style={{ color: "#6B7280", marginTop: 8, fontSize: 16 }}>
//                 {step === "email"
//                   ? "Quick & simple — no passwords needed"
//                   : `We sent a code to ${email}`}
//               </Text>

//               {step === "email" ? (
//                 <>
//                   {/* Email label + input */}
//                   <Text style={label}>Email address</Text>
//                   <TextInput
//                     placeholder="you@example.com"
//                     value={email}
//                     onChangeText={setEmail}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     style={input}
//                   />

//                   {/* Send OTP */}
//                   <Pressable
//                     onPress={handleSendOtp}
//                     disabled={!isValidEmail || loading}
//                     style={[primaryBtn, { opacity: isValidEmail ? 1 : 0.5 }]}
//                   >
//                     {loading ? (
//                       <ActivityIndicator color="#fff" />
//                     ) : (
//                       <>
//                         <FontAwesome5 
//                               name="phone" 
//                               size={16} 
//                               color="#fff" 
//                               style={{ transform: [{ scaleX: -1 }] }} 
//                             />
//                         <Text style={primaryBtnText}>Send verification code</Text>
//                       </>
//                     )}
//                   </Pressable>

//                   {/* Divider */}
//                   <View style={divider}>
//                     <View style={dividerLine} />
//                     <Text style={dividerText}>or</Text>
//                     <View style={dividerLine} />
//                   </View>

//                   {/* Facebook */}
//                   <Pressable style={facebookBtn}>
//                     <FontAwesome5 name="facebook" size={18} color="#fff" />
//                     <Text style={primaryBtnText}>Continue with Facebook</Text>
//                   </Pressable>
//                 </>
//               ) : (
//                 <>
//                   {/* OTP label + input */}
//                   <Text style={label}>Verification code</Text>
//                   <TextInput
//                     placeholder="••••••"
//                     value={otp}
//                     onChangeText={setOtp}
//                     keyboardType="number-pad"
//                     maxLength={6}
//                     style={[input, { textAlign: "center", fontSize: 22, letterSpacing: 8 }]}
//                   />

//                   {/* Verify */}
//                   <Pressable
//                     onPress={handleVerify}
//                     disabled={!isValidOtp || loading}
//                     style={[primaryBtn, { opacity: isValidOtp ? 1 : 0.5 }]}
//                   >
//                     {loading ? (
//                       <ActivityIndicator color="#fff" />
//                     ) : (
//                       <Text style={primaryBtnText}>Verify</Text>
//                     )}
//                   </Pressable>

//                   {/* Change email */}
//                   <Pressable onPress={() => setStep("email")} style={{ marginTop: 16 }}>
//                     <Text style={{ textAlign: "center", color: "#6B7280" }}>
//                       ← Change email
//                     </Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>

//           </View>
//         </TouchableWithoutFeedback>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const label = {
//   marginTop: 28,
//   marginBottom: 8,
//   fontWeight: "600" as const,
//   fontSize: 15,
//   color: "#111827",
// };

// const input = {
//   backgroundColor: "#fff",
//   padding: 16,
//   borderRadius: 16,
//   borderWidth: 1,
//   borderColor: "#E5E7EB",
//   fontSize: 16,
// };

// const primaryBtn = {
//   marginTop: 16,
//   backgroundColor: "#2B3F77",
//   padding: 16,
//   borderRadius: 20,
//   alignItems: "center" as const,
//   flexDirection: "row" as const,
//   justifyContent: "center" as const,
//   gap: 10,
// };

// const primaryBtnText = {
//   color: "#fff",
//   fontWeight: "700" as const,
//   fontSize: 16,
// };

// const facebookBtn = {
//   backgroundColor: "#4267B2",
//   padding: 16,
//   borderRadius: 20,
//   alignItems: "center" as const,
//   flexDirection: "row" as const,
//   justifyContent: "center" as const,
//   gap: 10,
// };

// const divider = {
//   flexDirection: "row" as const,
//   alignItems: "center" as const,
//   marginVertical: 24,
// };

// const dividerLine = {
//   flex: 1,
//   height: 1,
//   backgroundColor: "#E5E7EB",
// };

// const dividerText = {
//   marginHorizontal: 12,
//   color: "#6B7280",
//   fontSize: 14,
// };




import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/supabase/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const VALID_ROLES = ["user", "guardian"] as const;
type Role = (typeof VALID_ROLES)[number];

// Friendly messages for known Supabase OTP errors
const friendlyError = (message: string): string => {
  if (message.includes("Token has expired")) return "Your code has expired. Please request a new one.";
  if (message.includes("Invalid token")) return "Incorrect code. Please check and try again.";
  if (message.includes("rate limit")) return "Too many attempts. Please wait a moment.";
  return "Something went wrong. Please try again.";
};

export default function EmailScreen() {
  const router = useRouter();
  const { role: rawRole } = useLocalSearchParams<{ role: string }>();

  // ✅ Fix 2: Validate role strictly — don't trust URL params blindly
  const role: Role | null = VALID_ROLES.includes(rawRole as Role)
    ? (rawRole as Role)
    : null;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ✅ Fix 5: Memoize validation checks
  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );
  const isValidOtp = useMemo(() => otp.length === 6, [otp]);

  // ✅ Fix 8: Include router in dependency array
  useEffect(() => {
    if (!role) router.replace("/auth/get-started");
  }, [role, router]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!role) return null;

  // ─── SEND OTP ─────────────────────────────
  const handleSendOtp = async () => {
    // ✅ Fix 11: Trim email before use
    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });
      if (error) throw error;

      // ✅ Fix 6: Clear stale OTP when (re)sending
      setOtp("");
      setStep("otp");
      setResendCooldown(60); // ✅ Fix 9: Start cooldown timer
      Alert.alert("Code sent", "Check your email for the verification code.");
    } catch (error: any) {
      Alert.alert("Error", friendlyError(error.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP ─────────────────────────────
  const handleVerify = async () => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp,
        type: "email",
      });

      // ✅ Fix 10: Friendly OTP error messages
      if (verifyError) {
        Alert.alert("Verification failed", friendlyError(verifyError.message));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session could not be created.");

      const user = session.user;

      // ✅ Fix 1: Only select columns we actually need
      const { data: profile, error: profileError } = await supabase
        .from("help_app_profiles")
        .select("id, role, name, phone, dob, gender, hometown")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        // ✅ Fix 3: Use insert instead of upsert for brand-new profiles
        const { error: insertError } = await supabase
          .from("help_app_profiles")
          .insert({ id: user.id, email: cleanEmail, role });

        if (insertError) throw insertError;

        router.replace(
          role === "guardian" ? "/auth/add-guardian" : "/(tabs)/profile"
        );
        return;
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong account type",
          `This email is registered as a ${profile.role}. Please go back and select the correct role.`
        );
        return;
      }

      if (role === "guardian") {
        const { data: hasUser } = await supabase.rpc("has_guardian_user", {
          guardian_uuid: user.id,
        });
        router.replace(hasUser ? "/" : "/auth/add-guardian");
        return;
      }

      // ✅ Fix 7: Consistent route — was "/profile", now "/(tabs)/profile"
      const isProfileComplete =
        profile.name &&
        profile.phone &&
        profile.dob &&
        profile.gender &&
        profile.hometown;

      router.replace(isProfileComplete ? "/" : "/(tabs)/profile");
    } catch (error: any) {
      Alert.alert("Error", friendlyError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setOtp(""); // ✅ Fix 6: Clear OTP on step back
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            {/* Back */}
            <Pressable
              onPress={() =>
                step === "otp" ? goBackToEmail() : router.replace("/auth/get-started")
              }
              style={{ marginTop: 8 }}
            >
              <Text style={{ fontSize: 16, color: "#6B7280" }}>← Back</Text>
            </Pressable>

            <View style={{ flex: 1, justifyContent: "center" }}>
              {/* Title */}
              <Text style={{ fontSize: 32, fontWeight: "700", color: "#111827" }}>
                {step === "email" ? "Create your account" : "Check your email"}
              </Text>
              <Text style={{ color: "#6B7280", marginTop: 8, fontSize: 16 }}>
                {step === "email"
                  ? "Quick & simple — no passwords needed"
                  : `We sent a code to ${email.trim()}`}
              </Text>

              {step === "email" ? (
                <>
                  <Text style={label}>Email address</Text>
                  <TextInput
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={input}
                  />

                  <Pressable
                    onPress={handleSendOtp}
                    disabled={!isValidEmail || loading}
                    style={[primaryBtn, { opacity: isValidEmail ? 1 : 0.5 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <FontAwesome5
                          name="phone"
                          size={16}
                          color="#fff"
                          style={{ transform: [{ scaleX: -1 }] }}
                        />
                        <Text style={primaryBtnText}>Send verification code</Text>
                      </>
                    )}
                  </Pressable>

                  <View style={divider}>
                    
                    
                    
                  </View>

                  {/* ✅ Fix 4: Facebook button removed until implemented */}
                  {/* Add Facebook OAuth here when ready */}
                </>
              ) : (
                <>
                  <Text style={label}>Verification code</Text>
                  <TextInput
                    placeholder="••••••"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[
                      input,
                      { textAlign: "center", fontSize: 22, letterSpacing: 8 },
                    ]}
                  />

                  <Pressable
                    onPress={handleVerify}
                    disabled={!isValidOtp || loading}
                    style={[primaryBtn, { opacity: isValidOtp ? 1 : 0.5 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={primaryBtnText}>Verify</Text>
                    )}
                  </Pressable>

                  {/* ✅ Fix 9: Resend option with cooldown */}
                  <Pressable
                    onPress={handleSendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{ marginTop: 16 }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: resendCooldown > 0 ? "#9CA3AF" : "#2B3F77",
                        fontWeight: "600",
                      }}
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend code"}
                    </Text>
                  </Pressable>

                  <Pressable onPress={goBackToEmail} style={{ marginTop: 12 }}>
                    <Text style={{ textAlign: "center", color: "#6B7280" }}>
                      ← Change email
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const label = {
  marginTop: 28,
  marginBottom: 8,
  fontWeight: "600" as const,
  fontSize: 15,
  color: "#111827",
};

const input = {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  fontSize: 16,
};

const primaryBtn = {
  marginTop: 16,
  backgroundColor: "#2B3F77",
  padding: 16,
  borderRadius: 20,
  alignItems: "center" as const,
  flexDirection: "row" as const,
  justifyContent: "center" as const,
  gap: 10,
};

const primaryBtnText = {
  color: "#fff",
  fontWeight: "700" as const,
  fontSize: 16,
};

const divider = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  marginVertical: 24,
};

const dividerLine = {
  flex: 1,
  height: 1,
  backgroundColor: "#E5E7EB",
};

const dividerText = {
  marginHorizontal: 12,
  color: "#6B7280",
  fontSize: 14,
};