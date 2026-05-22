// /**
//  * app/consent.tsx
//  * Terms & Conditions consent screen.
//  * User must scroll, check the box, and tap Accept to proceed.
//  */

// import { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   Pressable,
//   Animated,
//   Alert,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const TERMS_SECTIONS = [
//   {
//     title: "1. Acceptance of Terms",
//     body: 'By using "I Need Help", you agree to these Terms & Conditions. If you do not agree, please do not use this App.',
//   },
//   {
//     title: "2. Purpose of the App",
//     body: '"I Need Help" allows a designated guardian to track your real-time location so they can assist you and guide you home safely if you become lost or disoriented.',
//   },
//   {
//     title: "3. Guardian Relationship",
//     body: "Your designated guardian must be a trusted individual who has given explicit consent to receive your location. The guardian agrees to use this data solely for your safety and well-being.",
//   },
//   {
//     title: "4. Location Tracking",
//     body: "This App uses both foreground (while open) and background (while minimized or screen off) location tracking to ensure continuous safety monitoring. You may revoke location permissions at any time via your device settings.",
//   },
//   {
//     title: "5. Privacy & Data",
//     body: "Your location data is shared only with your designated guardian(s). We do not sell or share your data with advertisers or third parties. You may request deletion of your data at any time.",
//   },
//   {
//     title: "6. User Responsibilities",
//     body: "You agree to provide accurate information, obtain proper consent before designating a guardian, and use the App only for its intended personal safety purposes.",
//   },
//   {
//     title: "7. Disclaimer",
//     body: 'The App is provided "as is". Location accuracy depends on device GPS and connectivity. This App is a supplementary safety tool and should not be the sole means of emergency response.',
//   },
//   {
//     title: "8. Changes to Terms",
//     body: "We may update these Terms at any time. Continued use after changes are posted constitutes your acceptance. We will notify you of significant changes through the App.",
//   },
// ];

// export default function ConsentScreen() {
//   const router = useRouter();
//   const [checked, setChecked] = useState(false);
//   const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

//   const checkScale = useRef(new Animated.Value(1)).current;
//   const btnOpacity = useRef(new Animated.Value(0.4)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(24)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
//       Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   useEffect(() => {
//     Animated.timing(btnOpacity, {
//       toValue: checked ? 1 : 0.4,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();
//   }, [checked]);

//   const handleCheck = () => {
//     Animated.sequence([
//       Animated.timing(checkScale, { toValue: 0.8, duration: 70, useNativeDriver: true }),
//       Animated.spring(checkScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
//     ]).start();
//     setChecked((prev) => !prev);
//   };

//   const handleScroll = (e: any) => {
//     const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
//     const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
//     if (isAtBottom) setHasScrolledToBottom(true);
//   };

//   const handleAccept = async () => {
//     if (!checked) {
//       Alert.alert(
//         "Agreement Required",
//         "Please read and check the box to accept the Terms & Conditions.",
//         [{ text: "OK" }]
//       );
//       return;
//     }
//     await AsyncStorage.setItem("terms_accepted", "true");
//     router.replace("/");
//   };

//   return (
//     <View style={styles.outer}>
//       <SafeAreaView style={{ flex: 1 }}>
//         <Animated.View
//           style={[
//             styles.container,
//             { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
//           ]}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <Text style={styles.headerEmoji}>📋</Text>
//             <View>
//               <Text style={styles.headerTitle}>Terms & Conditions</Text>
//               <Text style={styles.headerSub}>Please read before continuing</Text>
//             </View>
//           </View>

//           {/* Scrollable terms box */}
//           <View style={styles.termsBox}>
//             <ScrollView
//               onScroll={handleScroll}
//               scrollEventThrottle={16}
//               showsVerticalScrollIndicator
//               contentContainerStyle={styles.termsScroll}
//             >
//               {TERMS_SECTIONS.map((section, i) => (
//                 <View
//                   key={i}
//                   style={[
//                     styles.section,
//                     i < TERMS_SECTIONS.length - 1 && styles.sectionBorder,
//                   ]}
//                 >
//                   <Text style={styles.sectionTitle}>{section.title}</Text>
//                   <Text style={styles.sectionBody}>{section.body}</Text>
//                 </View>
//               ))}

//               {/* Privacy note */}
//               <View style={styles.privacyNote}>
//                 <Text style={styles.privacyText}>
//                   🔒  By accepting, you also agree to our{" "}
//                   <Text style={styles.privacyLink}>Privacy Policy</Text>
//                   {" "}covering how your location data is handled.
//                 </Text>
//               </View>
//             </ScrollView>

//             {/* Scroll hint */}
//             {!hasScrolledToBottom && (
//               <View style={styles.scrollHint}>
//                 <Text style={styles.scrollHintText}>↓  Scroll to read all terms</Text>
//               </View>
//             )}
//           </View>

//           {/* Checkbox */}
//           <Pressable onPress={handleCheck} style={styles.checkRow}>
//             <Animated.View
//               style={[
//                 styles.checkbox,
//                 checked && styles.checkboxChecked,
//                 { transform: [{ scale: checkScale }] },
//               ]}
//             >
//               {checked && <Text style={styles.checkmark}>✓</Text>}
//             </Animated.View>
//             <Text style={styles.checkLabel}>
//               I have read and agree to the{" "}
//               <Text style={styles.checkLabelBold}>Terms & Conditions</Text>
//               {" "}and{" "}
//               <Text style={styles.checkLabelBold}>Privacy Policy</Text>
//             </Text>
//           </Pressable>

//           {/* Accept button */}
//           <Animated.View style={{ opacity: btnOpacity }}>
//             <Pressable
//               onPress={handleAccept}
//               style={[styles.acceptBtn, checked && styles.acceptBtnActive]}
//             >
//               <Text style={styles.acceptBtnText}>Accept & Continue  →</Text>
//             </Pressable>
//           </Animated.View>

//           <Text style={styles.footer}>
//             You can review these terms anytime in Settings
//           </Text>
//         </Animated.View>
//       </SafeAreaView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   outer: {
//     flex: 1,
//     backgroundColor: "#e2eeee",
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 16,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 16,
//   },
//   headerEmoji: {
//     fontSize: 32,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#0f2f2f",
//   },
//   headerSub: {
//     fontSize: 13,
//     color: "#3e6b6b",
//     marginTop: 2,
//   },
//   termsBox: {
//     flex: 1,
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#b2d8d8",
//     overflow: "hidden",
//     marginBottom: 16,
//   },
//   termsScroll: {
//     padding: 16,
//     paddingBottom: 24,
//   },
//   section: {
//     marginBottom: 14,
//     paddingBottom: 14,
//   },
//   sectionBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#e2eeee",
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#0f766e",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: 5,
//   },
//   sectionBody: {
//     fontSize: 14,
//     color: "#3e6b6b",
//     lineHeight: 21,
//   },
//   privacyNote: {
//     backgroundColor: "#e2eeee",
//     borderRadius: 10,
//     padding: 12,
//     marginTop: 4,
//   },
//   privacyText: {
//     fontSize: 13,
//     color: "#3e6b6b",
//     lineHeight: 19,
//   },
//   privacyLink: {
//     color: "#0f766e",
//     fontWeight: "600",
//   },
//   scrollHint: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingVertical: 10,
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderTopWidth: 1,
//     borderTopColor: "#b2d8d8",
//   },
//   scrollHintText: {
//     fontSize: 12,
//     color: "#3e6b6b",
//   },
//   checkRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     marginBottom: 16,
//     paddingHorizontal: 4,
//   },
//   checkbox: {
//     width: 24,
//     height: 24,
//     borderRadius: 7,
//     borderWidth: 2,
//     borderColor: "#94a3b8",
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//     marginTop: 1,
//   },
//   checkboxChecked: {
//     backgroundColor: "#0f766e",
//     borderColor: "#0f766e",
//   },
//   checkmark: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "800",
//     lineHeight: 16,
//   },
//   checkLabel: {
//     flex: 1,
//     fontSize: 14,
//     color: "#3e6b6b",
//     lineHeight: 20,
//   },
//   checkLabelBold: {
//     color: "#0f2f2f",
//     fontWeight: "600",
//   },
//   acceptBtn: {
//     backgroundColor: "#b2d8d8",
//     borderRadius: 14,
//     paddingVertical: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },
//   acceptBtnActive: {
//     backgroundColor: "#0f766e",
//     shadowColor: "#0f766e",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.35,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   acceptBtnText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "700",
//     letterSpacing: 0.3,
//   },
//   footer: {
//     textAlign: "center",
//     fontSize: 12,
//     color: "#3e6b6b",
//   },
// });

/**
 * app/consent.tsx
 * Terms & Conditions consent screen.
 * User must scroll, check the box, and tap Accept to proceed.
 */

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: 'By using "I Need Help", you agree to these Terms & Conditions. If you do not agree, please do not use this App.',
  },
  {
    title: "2. Purpose of the App",
    body: '"I Need Help" allows a designated guardian to track your real-time location so they can assist you and guide you home safely if you become lost or disoriented.',
  },
  {
    title: "3. Guardian Relationship",
    body: "Your designated guardian must be a trusted individual who has given explicit consent to receive your location. The guardian agrees to use this data solely for your safety and well-being.",
  },
  {
    title: "4. Location Tracking",
    body: "This App uses both foreground (while open) and background (while minimized or screen off) location tracking to ensure continuous safety monitoring. You may revoke location permissions at any time via your device settings.",
  },
  {
    title: "5. Privacy & Data",
    body: "Your location data is shared only with your designated guardian(s). We do not sell or share your data with advertisers or third parties. You may request deletion of your data at any time.",
  },
  {
    title: "6. User Responsibilities",
    body: "You agree to provide accurate information, obtain proper consent before designating a guardian, and use the App only for its intended personal safety purposes.",
  },
  {
    title: "7. Disclaimer",
    body: 'The App is provided "as is". Location accuracy depends on device GPS and connectivity. This App is a supplementary safety tool and should not be the sole means of emergency response.',
  },
  {
    title: "8. Changes to Terms",
    body: "We may update these Terms at any time. Continued use after changes are posted constitutes your acceptance. We will notify you of significant changes through the App.",
  },
];

export default function ConsentScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const checkScale = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // ─── Entrance animation ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Button opacity tied to checked state ─────────────────────────────────
  useEffect(() => {
    Animated.timing(btnOpacity, {
      toValue: checked ? 1 : 0.4,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [checked]);

  // ─── Checkbox press ───────────────────────────────────────────────────────
  const handleCheck = () => {
    // ✅ FIX: guard — can't check box until terms are scrolled through
    if (!hasScrolledToBottom) return;

    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 0.8,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    setChecked((prev) => !prev);
  };

  // ─── Scroll handler ───────────────────────────────────────────────────────
  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) setHasScrolledToBottom(true);
  };

  // ─── Accept ───────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!checked) {
      Alert.alert(
        "Agreement Required",
        "Please read and check the box to accept the Terms & Conditions.",
        [{ text: "OK" }]
      );
      return;
    }

    // ✅ FIX: wrapped in try/catch — if AsyncStorage fails, user was getting
    // routed to "/" without terms_accepted saved, causing a redirect loop
    try {
      await AsyncStorage.setItem("terms_accepted", "true");
      router.replace("/");
    } catch (err) {
      console.error("Could not save consent:", err);
      Alert.alert(
        "Error",
        "Could not save your acceptance. Please try again."
      );
    }
  };

  return (
    <View style={styles.outer}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>📋</Text>
            <View>
              <Text style={styles.headerTitle}>Terms & Conditions</Text>
              <Text style={styles.headerSub}>Please read before continuing</Text>
            </View>
          </View>

          {/* Scrollable terms box */}
          <View style={styles.termsBox}>
            <ScrollView
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.termsScroll}
            >
              {TERMS_SECTIONS.map((section, i) => (
                <View
                  key={i}
                  style={[
                    styles.section,
                    i < TERMS_SECTIONS.length - 1 && styles.sectionBorder,
                  ]}
                >
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionBody}>{section.body}</Text>
                </View>
              ))}

              {/* Privacy note */}
              <View style={styles.privacyNote}>
                <Text style={styles.privacyText}>
                  🔒{"  "}By accepting, you also agree to our{" "}
                  <Text style={styles.privacyLink}>Privacy Policy</Text>
                  {" "}covering how your location data is handled.
                </Text>
              </View>
            </ScrollView>

            {/* Scroll hint — hidden once user reaches bottom */}
            {!hasScrolledToBottom && (
              <View style={styles.scrollHint}>
                <Text style={styles.scrollHintText}>
                  ↓{"  "}Scroll to read all terms
                </Text>
              </View>
            )}
          </View>

          {/* Checkbox */}
          {/* ✅ FIX: disabled + dimmed until user has scrolled to bottom */}
          <Pressable
            onPress={handleCheck}
            disabled={!hasScrolledToBottom}
            style={[
              styles.checkRow,
              !hasScrolledToBottom && { opacity: 0.4 },
            ]}
          >
            <Animated.View
              style={[
                styles.checkbox,
                checked && styles.checkboxChecked,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </Animated.View>
            <Text style={styles.checkLabel}>
              I have read and agree to the{" "}
              <Text style={styles.checkLabelBold}>Terms & Conditions</Text>
              {" "}and{" "}
              <Text style={styles.checkLabelBold}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Accept button */}
          <Animated.View style={{ opacity: btnOpacity }}>
            <Pressable
              onPress={handleAccept}
              style={[styles.acceptBtn, checked && styles.acceptBtnActive]}
            >
              <Text style={styles.acceptBtnText}>Accept & Continue  →</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.footer}>
            You can review these terms anytime in Settings
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: "#e2eeee",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f2f2f",
  },
  headerSub: {
    fontSize: 13,
    color: "#3e6b6b",
    marginTop: 2,
  },
  termsBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b2d8d8",
    overflow: "hidden",
    marginBottom: 16,
  },
  termsScroll: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 14,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2eeee",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  sectionBody: {
    fontSize: 14,
    color: "#3e6b6b",
    lineHeight: 21,
  },
  privacyNote: {
    backgroundColor: "#e2eeee",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  privacyText: {
    fontSize: 13,
    color: "#3e6b6b",
    lineHeight: 19,
  },
  privacyLink: {
    color: "#0f766e",
    fontWeight: "600",
  },
  scrollHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#b2d8d8",
  },
  scrollHintText: {
    fontSize: 12,
    color: "#3e6b6b",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#94a3b8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: "#3e6b6b",
    lineHeight: 20,
  },
  checkLabelBold: {
    color: "#0f2f2f",
    fontWeight: "600",
  },
  acceptBtn: {
    backgroundColor: "#b2d8d8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  acceptBtnActive: {
    backgroundColor: "#0f766e",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#3e6b6b",
  },
});