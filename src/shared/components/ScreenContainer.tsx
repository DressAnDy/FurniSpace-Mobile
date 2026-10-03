import React from "react";
import { ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardSafeView } from "./KeyboardSafe";
import { styles } from "./ScreenContainer.styles";

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Keep focused inputs above the keyboard (default true). */
  keyboard?: boolean;
};

export function ScreenContainer({
  children,
  style,
  keyboard = true,
}: ScreenContainerProps): React.JSX.Element {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {keyboard ? <KeyboardSafeView style={styles.fill}>{children}</KeyboardSafeView> : children}
    </SafeAreaView>
  );
}
