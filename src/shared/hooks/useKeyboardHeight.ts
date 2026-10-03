import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/** Lightweight keyboard height tracker (no reanimated / keyboard-controller). */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: { endCoordinates?: { height?: number } }) => {
      setHeight(Math.max(0, event.endCoordinates?.height ?? 0));
    };
    const onHide = () => setHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
