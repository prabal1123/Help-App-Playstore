import { useRef, useState } from "react";
import { Animated, Platform, Vibration } from "react-native";

export type AlarmType = "left_home" | "safe_zone" | "panic" | null;

export function useAlarmManager() {
  const [activeAlarm, setActiveAlarm] = useState<AlarmType>(null);
  const alarmAnim = useRef(new Animated.Value(0)).current;
  const alarmLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startAlarmAnimation = () => {
    alarmLoop.current?.stop();
    alarmLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(alarmAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(alarmAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ])
    );
    alarmLoop.current.start();
  };

  const stopAlarmAnimation = () => {
    alarmLoop.current?.stop();
    alarmAnim.setValue(0);
  };

  const triggerAlarm = (type: AlarmType) => {
    setActiveAlarm(type);
    startAlarmAnimation();
    try {
      if (Platform.OS === "android") {
        Vibration.vibrate([500, 300, 500, 300, 1000], false);
      } else {
        Vibration.vibrate(1000);
      }
    } catch (e) {
      console.warn("Vibration failed:", e);
    }
  };

  const dismissAlarm = () => {
    setActiveAlarm(null);
    stopAlarmAnimation();
    Vibration.cancel();
  };

  // ─── Interpolated colours ────────────────────────────────────────────────
  const safeZoneAlarmColor = alarmAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ff4444", "#ff0000"],
  });
  const leftHomeAlarmColor = alarmAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ff8c00", "#ff6600"],
  });
  const panicAlarmColor = alarmAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#7c3aed", "#5b21b6"],
  });

  const alarmBgColor =
    activeAlarm === "safe_zone"
      ? safeZoneAlarmColor
      : activeAlarm === "panic"
      ? panicAlarmColor
      : leftHomeAlarmColor;

  // ─── Label helpers ────────────────────────────────────────────────────────
  const alarmIcon =
    activeAlarm === "panic"
      ? "🆘"
      : activeAlarm === "left_home"
      ? "🏠"
      : "🚨";

  const alarmTitle =
    activeAlarm === "panic"
      ? "Emergency Alert!"
      : activeAlarm === "left_home"
      ? "User Left Home!"
      : "Safe Zone Crossed!";

  return {
    activeAlarm,
    alarmAnim,
    alarmBgColor,
    alarmIcon,
    alarmTitle,
    triggerAlarm,
    dismissAlarm,
  };
}