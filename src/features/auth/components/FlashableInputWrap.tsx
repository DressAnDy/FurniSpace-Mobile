import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { styles } from "../screens/RegisterScreen.styles";

type FlashableInputWrapProps = {
  hasError: boolean;
  flashToken: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function FlashableInputWrap({
  hasError,
  flashToken,
  style,
  children,
}: FlashableInputWrapProps): React.JSX.Element {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasError || flashToken <= 0) {
      flash.setValue(hasError ? 0.55 : 0);
      return;
    }

    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 110, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0.15, duration: 110, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 1, duration: 110, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0.7, duration: 140, useNativeDriver: false }),
    ]).start();
  }, [flash, flashToken, hasError]);

  const borderColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(60,51,48,0.08)", "#E24B4A"],
  });

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#FFF1F1"],
  });

  return (
    <Animated.View
      style={[
        styles.inputWrap,
        hasError ? styles.inputWrapError : null,
        { borderColor, backgroundColor },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
