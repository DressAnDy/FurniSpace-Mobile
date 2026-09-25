import { StyleSheet } from "react-native";

export const customizationStyles = StyleSheet.create({
  sectionGap: {
    gap: 12,
  },
  itemBlock: {
    borderBottomColor: "#F0EAE3",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  itemBlockLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemTitle: {
    color: "#2A2420",
    fontSize: 15,
    fontWeight: "700",
  },
  itemPrice: {
    color: "#2A2420",
    fontSize: 13,
    fontWeight: "700",
  },
  metaLine: {
    color: "#7A6F68",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  badgeNeutral: {
    backgroundColor: "#F5F2ED",
  },
  badgeNeutralText: {
    color: "#7A6F68",
  },
  badgeInfo: {
    backgroundColor: "#E8F0FE",
  },
  badgeInfoText: {
    color: "#1D4E89",
  },
  badgeSuccess: {
    backgroundColor: "#E8F5E9",
  },
  badgeSuccessText: {
    color: "#2E7D32",
  },
  badgeWarning: {
    backgroundColor: "#FFF3E0",
  },
  badgeWarningText: {
    color: "#E65100",
  },
  badgeDanger: {
    backgroundColor: "#FDECEC",
  },
  badgeDangerText: {
    color: "#B42318",
  },
  customizeButton: {
    alignSelf: "flex-start",
    borderColor: "#C9A86A",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customizeButtonActive: {
    backgroundColor: "#C9A86A",
  },
  customizeButtonText: {
    color: "#8A6D3B",
    fontSize: 12,
    fontWeight: "700",
  },
  customizeButtonTextActive: {
    color: "#FFFFFF",
  },
  formBlock: {
    backgroundColor: "#FAF8F5",
    borderColor: "#EDE5DC",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  fieldLabel: {
    color: "#9B8F86",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D9CFC4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#2A2420",
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
  dimensionRow: {
    flexDirection: "row",
    gap: 8,
  },
  dimensionCol: {
    flex: 1,
  },
  versionCard: {
    backgroundColor: "#FAF8F5",
    borderColor: "#EDE5DC",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    overflow: "hidden",
    padding: 14,
  },
  versionCardFeasible: {
    backgroundColor: "#FFFCF7",
    borderColor: "#E4D2AE",
  },
  versionAccent: {
    backgroundColor: "#C9A86A",
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  versionTitle: {
    color: "#2A2420",
    fontSize: 15,
    fontWeight: "700",
  },
  versionSubtitle: {
    color: "#7A6F68",
    fontSize: 12,
    marginTop: 2,
  },
  factBlock: {
    marginTop: 10,
  },
  factRow: {
    borderTopColor: "#EFE8E0",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  factLabel: {
    color: "#9B8F86",
    fontSize: 11,
    fontWeight: "600",
    width: 118,
  },
  factValue: {
    color: "#3A3330",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 10,
    marginTop: 12,
    paddingVertical: 12,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: "#7A6F68",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  requestCard: {
    borderBottomColor: "#F0EAE3",
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  requestMeta: {
    color: "#9B8F86",
    fontSize: 11,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: "#2F5D50",
    borderColor: "#2F5D50",
  },
  chipText: {
    color: "#7A6F68",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  banner: {
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerSuccess: {
    backgroundColor: "#E8F5E9",
  },
  bannerError: {
    backgroundColor: "#FDECEC",
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bannerSuccessText: {
    color: "#1B5E20",
  },
  bannerErrorText: {
    color: "#B42318",
  },
  modalBackdrop: {
    backgroundColor: "rgba(42,36,32,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "92%",
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    color: "#2A2420",
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    paddingRight: 12,
  },
  closeText: {
    color: "#8A6D3B",
    fontSize: 14,
    fontWeight: "700",
  },
  selectorChip: {
    backgroundColor: "#F5F2ED",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorChipActive: {
    backgroundColor: "rgba(47,93,80,0.1)",
    borderColor: "#2F5D50",
  },
  selectorText: {
    color: "#2A2420",
    fontSize: 13,
    fontWeight: "600",
  },
  detailHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
});
