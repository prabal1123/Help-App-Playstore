import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, Linking, Platform, StyleSheet } from "react-native";
import { AppState, AppStateStatus } from "react-native";
import {
  wasNotificationPermissionDenied,
  ensureNotificationPermission,
} from "@/services/backgroundLocation";

// Drop this near the top of your home/dashboard screen. It shows nothing
// when notification permission is fine, and shows a dismissible-but-honest
// warning banner when it isn't — since without it, background location
// tracking's foreground service can silently fail to register with
// Android (this was the original root cause of the whole hang investigation:
// no notification -> no real foreground service -> unprotected process ->
// Android suspends the JS thread during backgrounding -> location saves
// silently stop for hours at a time).
export function NotificationPermissionBanner() {
  const [needsAttention, setNeedsAttention] = useState(false);

  const check = useCallback(async () => {
    // Re-check the OS-level permission (not just the stored flag) so a
    // person who fixed it in Settings gets the banner cleared immediately,
    // without waiting for the next background health-check cycle.
    const granted = await ensureNotificationPermission();
    setNeedsAttention(!granted);
  }, []);

  useEffect(() => {
    check();

    // Re-check whenever the app comes back to the foreground — this is the
    // natural moment a person returns after visiting system settings.
    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") check();
      }
    );
    return () => sub.remove();
  }, [check]);

  if (!needsAttention) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Notifications are off</Text>
      <Text style={styles.body}>
        Location tracking works best with notifications enabled — without
        them, Android may pause tracking while the app is in the background.
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          if (Platform.OS === "android") {
            Linking.openSettings();
          } else {
            Linking.openURL("app-settings:");
          }
        }}
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF4E5",
    borderColor: "#F5A623",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    margin: 12,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 4,
    color: "#7A4A00",
  },
  body: {
    fontSize: 13,
    color: "#7A4A00",
    marginBottom: 10,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#F5A623",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});