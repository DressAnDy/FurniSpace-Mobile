import type { ProjectScheduleType } from "../../project/models/project.tracking.model";

export function assertSalesCanCreateSchedule(scheduleType: ProjectScheduleType): void {
  if (scheduleType === "DELIVERY") {
    throw new Error("Sales cannot create delivery schedules.");
  }
}

export type SalesScheduleStatusTarget = "COMPLETED" | "CANCELLED";

export function assertSalesCanUpdateScheduleStatus(status: string): asserts status is SalesScheduleStatusTarget {
  if (status !== "COMPLETED" && status !== "CANCELLED") {
    throw new Error("Sales can only complete or cancel schedules.");
  }
}
