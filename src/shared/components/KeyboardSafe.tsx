import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
  type ScrollViewProps,
} from "react-native";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";

type KeyboardSafeViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra offset below navigation headers / safe areas (iOS). */
  offset?: number;
};

/**
 * Lightweight keyboard avoidance without reanimated / keyboard-controller.
 * iOS uses KeyboardAvoidingView; Android pads by measured keyboard height (edge-to-edge).
 */
export function KeyboardSafeView({
  children,
  style,
  offset = 0,
}: KeyboardSafeViewProps): React.JSX.Element {
  const keyboardHeight = useKeyboardHeight();
  const androidPad = Platform.OS === "android" && keyboardHeight > 0 ? keyboardHeight : 0;

  return (
    <KeyboardAvoidingView
      style={[style, androidPad > 0 ? { paddingBottom: androidPad } : null]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

type KeyboardSafeScrollProps = ScrollViewProps & {
  children: React.ReactNode;
  /** Extra space under scroll content when keyboard is open. */
  bottomOffset?: number;
  /**
   * Fill parent height (full screens). Keep false inside bottom sheets / maxHeight modals —
   * flex:1 there collapses to 0 when the parent only has maxHeight.
   */
  fill?: boolean;
};

/**
 * Scroll view that keeps focused inputs reachable above the keyboard.
 */
export function KeyboardSafeScroll({
  children,
  bottomOffset = 24,
  fill = true,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  style,
  ...rest
}: KeyboardSafeScrollProps): React.JSX.Element {
  const keyboardHeight = useKeyboardHeight();
  const keyboardPad = Platform.OS === "android" && keyboardHeight > 0 ? keyboardHeight + bottomOffset : 0;

  return (
    <KeyboardAvoidingView
      style={[fill ? { flex: 1 } : null, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={fill ? { flex: 1 } : undefined}
        contentContainerStyle={[
          contentContainerStyle,
          keyboardPad > 0 ? { paddingBottom: keyboardPad } : null,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
