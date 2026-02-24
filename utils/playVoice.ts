import { Audio } from "expo-av";

export const playVoice = async (file: any) => {
  try {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
  } catch (e) {
    console.log("Voice error:", e);
  }
};