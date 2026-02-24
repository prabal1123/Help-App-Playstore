// import { useEffect, useState } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { supabase } from "./src/lib/supabase";
// import { registerForPushNotifications } from "@supabase/function/send-push-notifications";
// import RootNavigator from "./src/navigation/RootNavigator";

// export default function App() {
//   const [loading, setLoading] = useState(true);
//   const [session, setSession] = useState(null);

//   useEffect(() => {
//     // 1️⃣ Get initial session
//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session);
//       setLoading(false);
//     });

//     // 2️⃣ Listen to auth changes
//     const { data: authListener } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         setSession(session);

//         // 🔔 REGISTER PUSH TOKEN HERE
//         if (session?.user) {
//           await registerForPushNotifications(session.user.id);
//         }
//       }
//     );

//     return () => {
//       authListener.subscription.unsubscribe();
//     };
//   }, []);

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return <RootNavigator session={session} />;
// }
