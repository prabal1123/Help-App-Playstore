// import { View, Text, Alert, Pressable, StyleSheet } from "react-native";
// import { useState, useEffect } from "react";
// import { useRouter } from "expo-router";
// import { CameraView, useCameraPermissions } from "expo-camera";
// import { supabase } from "@/supabase/supabase";
// export default function ScanQR() {
//   const [permission, requestPermission] = useCameraPermissions(); // ✅ top-level import
//   const [scanned, setScanned] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     requestPermission();
//   }, []);

//   const handleScan = async ({ data }: { data: string }) => {
//     if (scanned) return;
//     setScanned(true);
//     try {
//       const parsed = JSON.parse(data);
//       if (parsed.type !== "guardian_link") {
//         Alert.alert("Invalid QR");
//         setScanned(false);
//         return;
//       }
//       const { data: { user } } = await supabase.auth.getUser();
//       await supabase.from("help_app_guardian_links").insert({
//         guardian_id: parsed.guardian_id,
//         user_id: user?.id,
//         status: "approved",
//       });
//       Alert.alert("Connected successfully!");
//       router.replace("/");
//     } catch {
//       Alert.alert("Invalid QR");
//       setScanned(false);
//     }
//   };

//   if (!permission) return <Text style={styles.center}>Requesting permission...</Text>;
//   if (!permission.granted) return <Text style={styles.center}>No camera access</Text>;

//   return (
//     <View style={{ flex: 1 }}>
//       <CameraView   // ✅ use CameraView instead of Camera
//         style={{ flex: 1 }}
//         onBarcodeScanned={handleScan}   // ✅ onBarcodeScanned (no capital C)
//         barcodeScannerSettings={{ barcodeTypes: ["qr"] }}  // ✅ camelCase
//       />
//       {/* rest of overlay unchanged */}
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     textAlign: "center",
//     textAlignVertical: "center",
//   },
//   overlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   scanBox: {
//     width: 250,
//     height: 250,
//     borderWidth: 3,
//     borderColor: "#fff",
//     borderRadius: 20,
//   },
//   text: {
//     color: "#fff",
//     marginTop: 20,
//     fontSize: 16,
//   },
//   backBtn: {
//     position: "absolute",
//     top: 50,
//     left: 20,
//   },
// });

import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "@/supabase/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function ScanQR() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    requestPermission();
  }, []);

  const handleScan = async ({ data }: { data: string }) => {
    // ✅ Fix: prevent duplicate scans or firing while loading
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      // ✅ Fix: safely parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        Alert.alert("Invalid QR", "Could not read QR code data.");
        setScanned(false);
        setLoading(false);
        return;
      }

      // ✅ Fix: validate type field
      if (parsed.type !== "guardian_link") {
        Alert.alert("Invalid QR", "This QR code is not a valid guardian link.");
        setScanned(false);
        setLoading(false);
        return;
      }

      // ✅ Fix: validate guardian_id field
      if (!parsed.guardian_id || typeof parsed.guardian_id !== "string") {
        Alert.alert("Invalid QR", "QR code is missing guardian information.");
        setScanned(false);
        setLoading(false);
        return;
      }

      // ✅ Fix: validate user is authenticated before DB insert
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert("Not Logged In", "You must be logged in to connect with a guardian.");
        setScanned(false);
        setLoading(false);
        return;
      }

      // ✅ Fix: check insert result for errors
      const { error: insertError } = await supabase
        .from("help_app_guardian_links")
        .insert({
          guardian_id: parsed.guardian_id,
          user_id: user.id,
          status: "approved",
        });

      if (insertError) {
        console.error("Guardian link insert error:", insertError);
        Alert.alert(
          "Connection Failed",
          insertError.message.includes("duplicate")
            ? "You are already connected to this guardian."
            : "Could not connect. Please try again."
        );
        setScanned(false);
        setLoading(false);
        return;
      }

      // ✅ Success
      Alert.alert("Connected!", "You have been linked to your guardian successfully.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (e) {
      // ✅ Fix: log real error, show friendly message
      console.error("QR scan error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setScanned(false);
      setLoading(false);
    }
  };

  // ✅ Fix: wrap permission text in View so flex:1 works correctly
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5BA89C" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
        <Text style={styles.permissionText}>No camera access</Text>
        <Pressable style={styles.retryBtn} onPress={requestPermission}>
          <Text style={styles.retryBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* ✅ Fix: Overlay UI now actually rendered */}
      <View style={styles.overlay}>
        {/* Scan box */}
        <View style={styles.scanBox} />

        {/* Instruction or loading */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.text}>Connecting...</Text>
          </View>
        ) : (
          <Text style={styles.text}>
            {scanned ? "Processing..." : "Point your camera at a guardian QR code"}
          </Text>
        )}

        {/* Re-scan button if needed */}
        {scanned && !loading && (
          <Pressable
            style={styles.rescanBtn}
            onPress={() => setScanned(false)}
            accessibilityLabel="Scan again"
          >
            <Text style={styles.rescanText}>Tap to Scan Again</Text>
          </Pressable>
        )}
      </View>

      {/* ✅ Fix: Back button now actually rendered */}
      <Pressable
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
      >
        <View style={styles.backBtnInner}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Permission screens
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  permissionText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#5BA89C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Camera overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 20,
  },
  text: {
    color: "#fff",
    marginTop: 20,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  rescanBtn: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  rescanText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: 54,
    left: 20,
  },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});