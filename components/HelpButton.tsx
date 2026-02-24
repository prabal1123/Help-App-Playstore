// import { View, Text } from "react-native";
// import { helpButtonStyles } from "../styles/helpButton";

// export default function HelpButton() {
//   return (
//     <View style={helpButtonStyles.container}>
//       <Text style={helpButtonStyles.sos}>SOS</Text>
//       <Text style={helpButtonStyles.text}>I NEED HELP</Text>
//     </View>
//   );
// }

import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { helpButtonStyles as styles } from "../styles/helpButton";

export default function HelpButton() {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push("/take-me-home")}
    >
      <Text style={styles.sos}>SOS</Text>
      <Text style={styles.text}>I NEED HELP</Text>
    </Pressable>
  );
}
