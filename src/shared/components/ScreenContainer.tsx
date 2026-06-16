import React from "react";
import { SafeAreaView, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenContainer({ children, style }: ScreenContainerProps): React.JSX.Element {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
