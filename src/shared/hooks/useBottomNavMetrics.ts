import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_NAV_HEIGHT = 74;
const MIN_BOTTOM_INSET = 8;

export function useBottomNavMetrics() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_BOTTOM_INSET);
  const navHeight = BASE_NAV_HEIGHT + bottomInset;
  const scrollPaddingBottom = navHeight + 16;

  return {
    bottomInset,
    navHeight,
    scrollPaddingBottom,
  };
}
