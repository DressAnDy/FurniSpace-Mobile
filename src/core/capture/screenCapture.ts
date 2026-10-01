import { AppState, type AppStateStatus, Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/**
 * Clears Android FLAG_SECURE so Discord/Meet/system screen share can show the app.
 * Safe no-op on platforms/modules where capture control is unavailable.
 */
export async function allowAppScreenCapture(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await ScreenCapture.allowScreenCaptureAsync("furnispace-share");
  } catch {
    // Expo Go / older hosts may not expose the native module — ignore.
  }
}

/** Keep capture allowed across focus / resume (secure password fields can re-set FLAG_SECURE). */
export function startScreenCaptureAllowGuard(): () => void {
  void allowAppScreenCapture();

  const onChange = (state: AppStateStatus) => {
    if (state === "active") {
      void allowAppScreenCapture();
    }
  };

  const subscription = AppState.addEventListener("change", onChange);
  return () => subscription.remove();
}
