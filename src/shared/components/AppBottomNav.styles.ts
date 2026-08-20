import { StyleSheet } from "react-native";

export const BASE_NAV_HEIGHT = 74;

export const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopColor: "rgba(60,51,48,0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    left: 0,
    minHeight: BASE_NAV_HEIGHT,
    right: 0,
  },
  bottomNavFixed: {
    bottom: 0,
    position: "absolute",
  },
  bottomItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingTop: 8,
  },
  bottomIconWrap: {
    position: "relative",
  },
  bottomBadge: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 8,
    height: 15,
    justifyContent: "center",
    minWidth: 15,
    paddingHorizontal: 4,
    position: "absolute",
    right: -10,
    top: -5,
  },
  bottomBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
  },
  bottomLabel: {
    color: "rgba(122,111,104,0.7)",
    fontSize: 10,
    marginTop: 4,
  },
  bottomLabelActive: {
    color: "#C9A86A",
  },
  bottomActiveIndicator: {
    backgroundColor: "#C9A86A",
    borderRadius: 999,
    height: 2,
    position: "absolute",
    top: 6,
    width: 20,
  },
});
