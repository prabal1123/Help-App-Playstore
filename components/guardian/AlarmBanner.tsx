import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { AlarmType } from "./useAlarmManager";

interface Props {
  activeAlarm: AlarmType;
  alarmBgColor: Animated.AnimatedInterpolation<string>;
  alarmIcon: string;
  alarmTitle: string;
  userName: string;
  onDismiss: () => void;
}

export function AlarmBanner({
  activeAlarm,
  alarmBgColor,
  alarmIcon,
  alarmTitle,
  userName,
  onDismiss,
}: Props) {
  if (!activeAlarm) return null;

  const alarmSubtitle =
    activeAlarm === "panic"
      ? `${userName} needs help`
      : activeAlarm === "left_home"
      ? `${userName} has left the home area`
      : `${userName} has exited all safe zones`;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: alarmBgColor }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>{alarmIcon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{alarmTitle}</Text>
          <Text style={styles.bannerSubtitle}>{alarmSubtitle}</Text>
        </View>
        <Pressable onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕ Dismiss</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 6,
  },
  bannerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  bannerIcon: { fontSize: 28 },
  bannerTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  dismissBtn: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});