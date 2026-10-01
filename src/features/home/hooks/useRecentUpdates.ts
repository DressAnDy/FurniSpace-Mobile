import { useMemo } from "react";
import type { ProjectStatus, ProjectSummaryItem } from "../../project/models/project.model";
import { resolveCustomerFlowDecision } from "../../project/utils/project.customer-flow.mapper";
import { getProjectStatusLabel } from "../../project/utils/project.mapper";
import {
  buildProjectTrackingSummary,
  PROJECT_WORKFLOW_STAGE_CATALOG,
} from "../../project/utils/project.tracking.mapper";

export type RecentUpdateItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "primary" | "neutral";
};

const RECENT_UPDATES_LIMIT = 3;

function formatRelativeFromIso(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes}m ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function getStageStatusLabel(status: ProjectStatus): string {
  return getProjectStatusLabel(status);
}

function buildCompletedStageDescription(status: ProjectStatus): string {
  return `${getStageStatusLabel(status)} is complete.`;
}

export function buildProjectProgressUpdates(project: ProjectSummaryItem): RecentUpdateItem[] {
  const tracking = buildProjectTrackingSummary(project.status);
  const flow = resolveCustomerFlowDecision(project.status);
  const updates: RecentUpdateItem[] = [];

  if (tracking.isRejected) {
    return [
      {
        id: `rejected-${project.projectId}`,
        title: flow.headline,
        description: flow.description,
        time: formatRelativeFromIso(project.submittedAt) || "—",
        tone: "primary",
      },
    ];
  }

  updates.push({
    id: `current-${project.projectId}-${project.status}`,
    title: flow.headline,
    description: flow.description,
    time: "Current",
    tone: "primary",
  });

  const completedStages = tracking.stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage }) => stage.uiState === "COMPLETED")
    .reverse();

  for (const { stage, index } of completedStages) {
    if (updates.length >= RECENT_UPDATES_LIMIT) {
      break;
    }

    const catalog = PROJECT_WORKFLOW_STAGE_CATALOG[index];
    const lastStatus = catalog?.statuses.at(-1) ?? stage.statuses.at(-1);

    if (!lastStatus) {
      continue;
    }

    updates.push({
      id: `stage-${project.projectId}-${stage.id}`,
      title: stage.label,
      description: buildCompletedStageDescription(lastStatus),
      time: "Completed",
      tone: "neutral",
    });
  }

  if (updates.length < RECENT_UPDATES_LIMIT) {
    updates.push({
      id: `submitted-${project.projectId}`,
      title: "Project submitted",
      description: `${project.projectName} was submitted and entered the workflow.`,
      time: formatRelativeFromIso(project.submittedAt),
      tone: "neutral",
    });
  }

  return updates.slice(0, RECENT_UPDATES_LIMIT);
}

export function useRecentUpdates(project: ProjectSummaryItem | null | undefined) {
  const updates = useMemo(() => {
    if (!project) {
      return [] as RecentUpdateItem[];
    }

    return buildProjectProgressUpdates(project);
  }, [project]);

  return { updates };
}
