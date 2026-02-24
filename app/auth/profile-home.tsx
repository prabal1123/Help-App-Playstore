import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { authStyles as styles } from "@/styles/auth";

export default function ProfileHome() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [hasHome, setHasHome] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email || "");

      // Fetch guardian
      const { data: guardians } = await supabase
        .from("help_app_guardians")
        .select("guardian_email")
        .eq("user_id", user.id)
        .single();

      if (guardians?.guardian_email) {
        setGuardianEmail(guardians.guardian_email);
      }

      // Fetch home location
      const { data: profile } = await supabase
        .from("help_app_users")
        .select("home_lat, home_lng")
        .eq("id", user.id)
        .single();

      if (profile?.home_lat && profile?.home_lng) {
        setHasHome(true);
      }

    } catch (error) {
      console.log("Profile Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/email");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={{ fontSize: 64 }}>👤</Text>

        <Text style={styles.heading}>My Profile</Text>

        <Text style={[styles.sub, { marginTop: 8 }]}>
          {email}
        </Text>

        <Text style={[styles.sub, { marginTop: 16 }]}>
          Guardian: {guardianEmail || "Not Added"}
        </Text>

        <Text style={[styles.sub, { marginTop: 8 }]}>
          Home Location: {hasHome ? "✅ Set" : "❌ Not Set"}
        </Text>
      </View>

      {/* Logout Button */}
      <Pressable
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>
          Logout →
        </Text>
      </Pressable>
    </View>
  );
}
