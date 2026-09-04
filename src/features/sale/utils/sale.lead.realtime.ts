import type { QueryClient } from "@tanstack/react-query";
import type { RealtimeNotificationPayloadDto } from "../../notification/models/notification.model";

export function isProjectRequestSubmittedEvent(
  payload: Pick<RealtimeNotificationPayloadDto, "notificationType" | "referenceType">,
): boolean {
  const type = (payload.notificationType ?? "").toLowerCase().replace(/[_\s]/g, ".");
  return (
    type.includes("project.request.submitted") ||
    type.includes("projectrequestsubmitted") ||
    ((payload.referenceType ?? "").toUpperCase() === "PROJECT" && type.includes("request.submitted"))
  );
}

/** Invalidate Sales lead inbox + badges after a new project request arrives. */
export function invalidateSaleLeadInboxQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["project", "list"] });
  void queryClient.invalidateQueries({ queryKey: ["sale", "kpis"] });
  void queryClient.invalidateQueries({ queryKey: ["sale", "action-queue"] });
  void queryClient.invalidateQueries({ queryKey: ["notification", "unread-count"] });
  void queryClient.invalidateQueries({ queryKey: ["notification", "list"] });
}

export function removeProjectFromSaleInboxCaches(queryClient: QueryClient, projectId: string): void {
  queryClient.setQueriesData({ queryKey: ["project", "list"] }, (current: unknown) => {
    if (!current || typeof current !== "object") {
      return current;
    }

    const page = current as { items?: Array<{ projectId?: string }>; total?: number };
    if (!Array.isArray(page.items)) {
      return current;
    }

    const nextItems = page.items.filter((item) => item.projectId !== projectId);
    if (nextItems.length === page.items.length) {
      return current;
    }

    return {
      ...page,
      items: nextItems,
      total: typeof page.total === "number" ? Math.max(0, page.total - 1) : page.total,
    };
  });
}
