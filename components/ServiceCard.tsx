// import { View, Text } from "react-native";
// import { serviceCardStyles as styles } from "../styles/serviceCard.styles";

// export default function ServiceCard({ title, color }: any) {
//   return (
//     <View style={[styles.card, { backgroundColor: color }]}>
//       <Text style={styles.text}>{title}</Text>
//     </View>
//   );
// }

import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { serviceCardStyles as styles } from "../styles/serviceCard.styles";

export default function ServiceCard({ title, color, route }: any) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={[styles.card, { backgroundColor: color }]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
