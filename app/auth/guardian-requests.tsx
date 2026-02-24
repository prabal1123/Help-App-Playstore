import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { authStyles as styles } from "@/styles/auth";

export default function GuardianRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    try {
      // 1️⃣ Check Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/email");
        return;
      }

      // 2️⃣ Check Role
      const { data: profile, error } = await supabase
        .from("help_app_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role !== "user") {
        router.replace("/");
        return;
      }

      // 3️⃣ Fetch Pending Requests
      const { data, error: fetchError } = await supabase
        .from("help_app_guardian_links")
        .select(`
          id,
          guardian_id,
          help_app_profiles!help_app_guardian_links_guardian_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("help_app_guardian_links")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", `Request ${status}`);
      checkAccessAndFetch();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
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
      <Text style={styles.heading}>Guardian Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              {item.help_app_profiles?.name ||
                item.help_app_profiles?.email}
            </Text>

            <Pressable
              style={[styles.button, { marginBottom: 8 }]}
              onPress={() => handleAction(item.id, "approved")}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>

            <Pressable
              style={[styles.button, { backgroundColor: "#EF4444" }]}
              onPress={() => handleAction(item.id, "rejected")}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ marginTop: 20 }}>
            No pending guardian requests.
          </Text>
        }
      />
    </View>
  );
}
