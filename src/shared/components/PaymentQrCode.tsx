import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type PaymentQrCodeProps = {
  value: string;
  size?: number;
  caption?: string;
};

function isImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function PaymentQrCode({ value, size = 220, caption }: PaymentQrCodeProps): React.JSX.Element {
  const trimmed = value.trim();

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        {isImageUrl(trimmed) ? (
          <Image source={{ uri: trimmed }} style={{ width: size, height: size }} resizeMode="contain" />
        ) : (
          <QRCode backgroundColor="#FFFFFF" color="#111111" size={size} value={trimmed} />
        )}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  frame: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(37,99,235,0.25)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  caption: {
    color: "#7A6F68",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    textAlign: "center",
  },
});
