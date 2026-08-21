import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(28,22,18,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FAF8F5",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "72%",
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "rgba(60,51,48,0.15)",
    borderRadius: 999,
    height: 4,
    marginTop: 10,
    width: 42,
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgba(60,51,48,0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: "#2C2420",
    fontFamily: "serif",
    fontSize: 20,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(60,51,48,0.06)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(60,51,48,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  itemActive: {
    backgroundColor: "rgba(201,168,106,0.08)",
    borderColor: "rgba(201,168,106,0.35)",
  },
  itemPressed: {
    opacity: 0.88,
  },
  itemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: "#2C2420",
    fontSize: 15,
    fontWeight: "600",
  },
  itemMeta: {
    color: "#7A6F68",
    fontSize: 11,
    marginTop: 2,
  },
  itemStatus: {
    color: "#C9A86A",
    fontSize: 11,
    marginTop: 4,
  },
  checkWrap: {
    alignItems: "center",
    backgroundColor: "#C9A86A",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  emptyText: {
    color: "#7A6F68",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 20,
    textAlign: "center",
  },
});
