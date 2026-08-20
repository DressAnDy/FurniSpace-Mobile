import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F5",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#3A3330",
    paddingHorizontal: 19,
    paddingTop: 38,
    paddingBottom: 14,
  },
  headerTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  markAllButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markAllText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
  },
  brand: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "serif",
    fontSize: 35,
    marginTop: 2,
  },
  newBadge: {
    alignItems: "center",
    backgroundColor: "rgba(201,168,106,0.22)",
    borderColor: "rgba(201,168,106,0.35)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  newText: {
    color: "#DCC89A",
    fontSize: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: "#C9A86A",
  },
  filterChipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 12,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#7A6F68",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3A3330",
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  loadMoreState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.05)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardUnread: {
    borderColor: "rgba(201,168,106,0.42)",
  },
  cardIconWrap: {
    alignItems: "center",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    marginTop: 2,
    width: 30,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  cardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#2C2420",
    flex: 1,
    fontSize: 13,
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadge_order: {
    backgroundColor: "rgba(201,168,106,0.18)",
  },
  categoryBadge_payment: {
    backgroundColor: "rgba(22,163,74,0.12)",
  },
  categoryBadge_project: {
    backgroundColor: "rgba(58,51,48,0.08)",
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  categoryBadgeText_order: {
    color: "#A8843E",
  },
  categoryBadgeText_payment: {
    color: "#15803D",
  },
  categoryBadgeText_project: {
    color: "#7A6F68",
  },
  cardDescription: {
    color: "#7A6F68",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
  },
  cardTime: {
    color: "rgba(122,111,104,0.55)",
    fontSize: 10,
    marginTop: 6,
  },
  unreadDot: {
    backgroundColor: "#C9A86A",
    borderRadius: 3,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  bottomNav: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopColor: "rgba(60,51,48,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 74,
    left: 0,
    position: "absolute",
    right: 0,
  },
  bottomItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
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
    position: "absolute",
    right: -10,
    top: -5,
    minWidth: 15,
    paddingHorizontal: 4,
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
