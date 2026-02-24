// import { View, Text, Pressable } from "react-native";
// import { useRouter } from "expo-router";
// import { authStyles as styles } from "@/styles/auth";

// export default function GuardianSuccess() {
//   const router = useRouter();

//   return (
//     <View style={styles.container}>
//       {/* Success Content */}
//       <View style={styles.center}>
//         <Text style={{ fontSize: 64 }}>✅</Text>

//         <Text style={styles.heading}>Guardian Added!</Text>

//         <Text style={[styles.sub, { marginTop: 8 }]}>
//           Parent · 9452692296
//         </Text>
//       </View>

//       {/* Next Step */}
//       <Pressable
//         style={styles.button}
//         onPress={() => router.push("/auth/set-home")}
//       >
//         <Text style={styles.buttonText}>Set Home Location →</Text>
//       </Pressable>
//     </View>
//   );
// }
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { authStyles as styles } from "@/styles/auth";

export default function GuardianSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Success Content */}
      <View style={styles.center}>
        <Text style={{ fontSize: 64 }}>🎉</Text>

        <Text style={styles.heading}>You're Now a Guardian!</Text>

        <Text style={[styles.sub, { marginTop: 8, textAlign: "center" }]}>
          You have successfully joined SafeWalk and will now receive safety alerts.
        </Text>
      </View>

      {/* Next Step Button */}
      <Pressable
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>
          Go to Dashboard →
        </Text>
      </Pressable>
    </View>
  );
}
