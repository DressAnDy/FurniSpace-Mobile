import { StyleSheet } from "react-native";

export const customerFlowStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0EA",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#2A2420",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#C9A86A",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#B8ADA4",
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE5DC",
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: "#9B8F86",
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE3",
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2420",
  },
  listItemMeta: {
    fontSize: 12,
    color: "#7A6F68",
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F5EFE6",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A6D3B",
    letterSpacing: 0.5,
  },
  statusPublished: {
    backgroundColor: "#E8F5E9",
  },
  statusPublishedText: {
    color: "#2E7D32",
  },
  statusSelected: {
    backgroundColor: "#FFF3E0",
  },
  statusSelectedText: {
    color: "#E65100",
  },
  primaryButton: {
    backgroundColor: "#C9A86A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D9CFC4",
  },
  secondaryButtonText: {
    color: "#5C524C",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE3",
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#3A3330",
    paddingRight: 8,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A2420",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2A2420",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C9A86A",
  },
  noteText: {
    fontSize: 13,
    color: "#5C524C",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: "#7A6F68",
    lineHeight: 20,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#7A6F68",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D9CFC4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2A2420",
    backgroundColor: "#FAFAF8",
    minHeight: 88,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
});
