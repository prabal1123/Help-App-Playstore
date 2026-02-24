// import { View, Text, SafeAreaView } from "react-native";
// import HelpButton from "../../components/HelpButton";
// import ServiceCard from "../../components/ServiceCard";
// import { homeStyles as styles } from "../../styles/home.styles";
// import { COLORS } from "../../styles/colors";

// export default function HomeScreen() {
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.hello}>Hello there 👋</Text>
//         <Text style={styles.safe}>You're safe</Text>
//       </View>

//       {/* SOS */}
//       <HelpButton />

//       {/* Section */}
//       <Text style={styles.section}>What do you need?</Text>

//       {/* Take Me Home */}
//       <View style={[styles.bigCard, { backgroundColor: COLORS.green }]}>
//         <Text style={styles.bigText}>Take Me Home</Text>
//       </View>

//       {/* Services */}
//       <View style={styles.row}>
//         <ServiceCard title="Electrician" color={COLORS.yellow} />
//         <ServiceCard title="Carpenter" color={COLORS.blue} />
//       </View>

//       <View style={styles.row}>
//         <ServiceCard title="Plumber" color={COLORS.green} />
//         <ServiceCard title="Medical Help" color={COLORS.red} />
//       </View>

//       {/* Status */}
//       <View style={styles.status}>
//         <Text style={styles.statusText}>
//           🟢 Location sharing active · Guardian connected
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }

// import { View, Text, SafeAreaView, Pressable } from "react-native";
// import { useRouter } from "expo-router";

// import HelpButton from "../../components/HelpButton";
// import ServiceCard from "../../components/ServiceCard";

// import { homeStyles as styles } from "../../styles/home.styles";
// import { COLORS } from "../../styles/colors";

// export default function HomeScreen() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.hello}>Hello there 👋</Text>
//         <Text style={styles.safe}>You're safe</Text>
//       </View>

//       {/* SOS */}
//       <HelpButton />

//       {/* Section */}
//       <Text style={styles.section}>What do you need?</Text>

//       {/* Take Me Home */}
//       <Pressable
//         style={[styles.bigCard, { backgroundColor: COLORS.green }]}
//         onPress={() => router.push("take-me-home")}
//       >
//         <Text style={styles.bigText}>Take Me Home</Text>
//       </Pressable>

//       {/* Services */}
//       <View style={styles.row}>
//         <ServiceCard
//           title="Electrician"
//           color={COLORS.yellow}
//           route="/auth/electrician"
//         />
//         <ServiceCard
//           title="Carpenter"
//           color={COLORS.blue}
//           route="/auth/carpenter"
//         />
//       </View>

//       <View style={styles.row}>
//         <ServiceCard
//           title="Plumber"
//           color={COLORS.green}
//           route="/auth/plumber"
//         />
//         <ServiceCard
//           title="Medical Help"
//           color={COLORS.red}
//           route="/auth/medical"
//         />
//       </View>

//       {/* Status */}
//       <View style={styles.status}>
//         <Text style={styles.statusText}>
//           🟢 Location sharing active · Guardian connected
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }

import { View, Text, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { supabase } from "@/supabase/supabase";

import HelpButton from "../../components/HelpButton";
import ServiceCard from "../../components/ServiceCard";

import { homeStyles as styles } from "../../styles/home.styles";
import { COLORS } from "../../styles/colors";

export default function HomeScreen() {
  const router = useRouter();

  const [trackingActive, setTrackingActive] = useState(false);
  const [guardianConnected, setGuardianConnected] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      console.log("💾 Saving zone as guardian:", user.id);

      // 🔗 Check if guardian is connected
      const { data: link } = await supabase
        .from("help_app_guardian_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (link) setGuardianConnected(true);

      // 📍 Ask permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      // 🚀 Start tracking
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        async (location) => {
          const { latitude, longitude, accuracy } = location.coords;

          console.log("📍 Sending location:", latitude, longitude);

          await supabase.from("help_app_user_locations").insert({
            user_id: user.id,
            lat: latitude,
            lng: longitude,
            accuracy_meters: accuracy,
          });

          setTrackingActive(true);
        }
      );
    };

    init();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hello}>Hello there 👋</Text>
        <Text style={styles.safe}>
          {trackingActive ? "Live tracking active" : "Starting tracking..."}
        </Text>
      </View>

      {/* SOS */}
      <HelpButton />

      {/* Section */}
      <Text style={styles.section}>What do you need?</Text>

      {/* Take Me Home */}
      <Pressable
        style={[styles.bigCard, { backgroundColor: COLORS.green }]}
        onPress={() => router.push("take-me-home")}
      >
        <Text style={styles.bigText}>Take Me Home</Text>
      </Pressable>

      {/* Services */}
      <View style={styles.row}>
        <ServiceCard
          title="Electrician"
          color={COLORS.yellow}
          route="/auth/electrician"
        />
        <ServiceCard
          title="Carpenter"
          color={COLORS.blue}
          route="/auth/carpenter"
        />
      </View>

      <View style={styles.row}>
        <ServiceCard
          title="Plumber"
          color={COLORS.green}
          route="/auth/plumber"
        />
        <ServiceCard
          title="Medical Help"
          color={COLORS.red}
          route="/auth/medical"
        />
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          {trackingActive ? "🟢 Location sharing active" : "🟡 Tracking not active"}
          {" · "}
          {guardianConnected ? "Guardian connected" : "No guardian connected"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
