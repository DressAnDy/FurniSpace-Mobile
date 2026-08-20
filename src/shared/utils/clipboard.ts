import { Share } from "react-native";
import ExpoClipboard from "expo-clipboard/build/ExpoClipboard";

export async function copyToClipboard(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Nothing to copy.");
  }

  if (typeof ExpoClipboard.setStringAsync === "function") {
    await ExpoClipboard.setStringAsync(trimmed);
    return;
  }

  await Share.share({ message: trimmed });
}
