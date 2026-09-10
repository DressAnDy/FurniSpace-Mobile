export const DESIGNER = {
  bg: "#FAF8F5",
  charcoal: "#3A3330",
  ink: "#2C2420",
  accent: "#2F5D50",
  gold: "#C9A86A",
  muted: "#7A6F68",
  pale: "#F5F2ED",
  white: "#FFFFFF",
  border: "rgba(60,51,48,0.06)",
  red: "#FB2C36",
} as const;

// Reuse Sale layout tokens for consistent staff shell density.
export { saleStyles as designerStyles } from "../../sale/styles/sale.styles";
