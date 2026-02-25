// import { Tabs } from "expo-router";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { COLORS } from "../../styles/colors";

// export default function TabLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,

//         // 🎨 COLORS
//         tabBarActiveTintColor: COLORS.green,
//         tabBarInactiveTintColor: "#9CA3AF",

//         // 🧱 TAB BAR CONTAINER
//         tabBarStyle: {
//           backgroundColor: "#FFFFFF",
//           height: 72,
//           paddingTop: 8,
//           paddingBottom: 10,
//           borderTopWidth: 0.5,
//           borderTopColor: "#E5E7EB",
//         },

//         // 🏷 LABELS
//         tabBarLabelStyle: {
//           fontSize: 13,
//           fontWeight: "600",
//           marginTop: 2,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "home" : "home-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="take-me-home"
//         options={{
//           title: "Navigate",
//           tabBarIcon: ({ color }) => (
//             <Feather name="navigation" size={22} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="guardian"
//         options={{
//           title: "Guardian",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "shield" : "shield-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "person" : "person-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// import { Tabs } from "expo-router";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { COLORS } from "../../styles/colors";
// import { useEffect, useState } from "react";
// import { supabase } from "@/supabase/supabase";

// export default function TabLayout() {
//   const [role, setRole] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchRole = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       const { data } = await supabase
//         .from("help_app_profiles")
//         .select("role")
//         .eq("id", user.id)
//         .single();

//       setRole(data?.role);
//     };

//     fetchRole();
//   }, []);

//   if (!role) return null;

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: COLORS.green,
//         tabBarInactiveTintColor: "#9CA3AF",
//         tabBarStyle: {
//           backgroundColor: "#FFFFFF",
//           height: 72,
//           paddingTop: 8,
//           paddingBottom: 10,
//           borderTopWidth: 0.5,
//           borderTopColor: "#E5E7EB",
//         },
//       }}
//     >
//       {/* HOME */}
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "home" : "home-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       {/* NAVIGATION */}
//       <Tabs.Screen
//         name="navigation"
//         options={{
//           title: "Navigate",
//           href: role === "user" ? "/navigation" : null,
//           tabBarIcon: ({ color }) => (
//             <Feather name="navigation" size={22} color={color} />
//           ),
//         }}
//       />

//       {/* GUARDIAN */}
//       <Tabs.Screen
//         name="guardian"
//         options={{
//           title: "Guardian",
//           href: role === "guardian" ? "/guardian" : null,
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "shield" : "shield-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       {/* PROFILE */}
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "person" : "person-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// import { Tabs } from "expo-router";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { COLORS } from "../../styles/colors";
// import { useEffect, useState } from "react";
// import { supabase } from "@/supabase/supabase";
// import { View, ActivityIndicator } from "react-native";

// export default function TabLayout() {
//   const [role, setRole] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchRole();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         if (!session) {
//           setRole(null);
//           return;
//         }
//         fetchRole();
//       }
//     );

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   const fetchRole = async () => {
//     setLoading(true);

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       setLoading(false);
//       return;
//     }

//     const { data } = await supabase
//       .from("help_app_profiles")
//       .select("role")
//       .eq("id", user.id)
//       .maybeSingle();

//     setRole(data?.role ?? null);
//     setLoading(false);
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   if (!role) return null;

//   return (
//     <Tabs
//       initialRouteName="index"
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: COLORS.green,
//         tabBarInactiveTintColor: "#9CA3AF",
//         tabBarStyle: {
//           backgroundColor: "#FFFFFF",
//           height: 72,
//           paddingTop: 8,
//           paddingBottom: 10,
//           borderTopWidth: 0.5,
//           borderTopColor: "#E5E7EB",
//         },
//       }}
//     >
//       {/* HOME */}
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "home" : "home-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       {/* NAVIGATION */}
//       <Tabs.Screen
//         name="navigation"
//         options={{
//           title: "Navigate",
//           href: role === "user" ? "/navigation" : null,
//           tabBarIcon: ({ color }) => (
//             <Feather name="navigation" size={22} color={color} />
//           ),
//         }}
//       />

//       {/* GUARDIAN */}
//       <Tabs.Screen
//         name="guardian"
//         options={{
//           title: "Guardian",
//           href: role === "guardian" ? "/guardian" : null,
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "shield" : "shield-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />

//       {/* PROFILE */}
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons
//               name={focused ? "person" : "person-outline"}
//               size={22}
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

import { Tabs } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabase";
import { View, ActivityIndicator, Text } from "react-native";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRole();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setRole(null);
          return;
        }
        fetchRole();
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async () => {
    setLoading(true);
    console.log("🔍 Fetching role...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("👤 User:", user?.id, "Error:", userError);

    if (!user) {
      console.log("❌ No user found");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("help_app_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("🎭 Role data:", data, "Error:", error);
    setRole(data?.role ?? null);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!role) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>No role found. Please log in again.</Text>
    </View>
  );

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* NAVIGATION */}
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Navigate",
          href: role === "user" ? "/navigation" : null,
          tabBarIcon: ({ color }) => (
            <Feather name="navigation" size={22} color={color} />
          ),
        }}
      />

      {/* GUARDIAN */}
      <Tabs.Screen
        name="guardian"
        options={{
          title: "Guardian",
          href: role === "guardian" ? "/guardian" : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "shield" : "shield-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}