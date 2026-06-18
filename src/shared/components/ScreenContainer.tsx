import React from "react";
import { SafeAreaView, ViewStyle } from "react-native";
import { styles } from "./ScreenContainer.styles";

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenContainer({ children, style }: ScreenContainerProps): React.JSX.Element {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}
