export type ProposalStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "REVISION_REQUESTED"
  | "SELECTED"
  | "REJECTED"
  | "ARCHIVED";

/** Statuses visible to customer (list API filters customerVisibleOnly). */
export type CustomerVisibleProposalStatus =
  | "PUBLISHED"
  | "REVISION_REQUESTED"
  | "SELECTED"
  | "REJECTED";

export type ProposalDto = {
  proposalId: string;
  projectId: string;
  proposalName: string;
  versionNo: number;
  status: ProposalStatus;
  publishedAt: string | null;
  selectedAt: string | null;
  revisionNote: string | null;
};

export type ProposalListQuery = {
  status?: ProposalStatus;
  page?: number;
  limit?: number;
};

export type ProposalListResponseDto = {
  items: ProposalDto[];
  page: number;
  limit: number;
  total: number;
};

export type ProposalSceneDto = {
  sceneId: string;
  proposalId: string;
  sceneName: string;
  sceneType?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProposalItemSummaryDto = {
  proposalItemId: string;
  proposalId: string;
  sceneId?: string | null;
  itemName: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  productNameSnapshot?: string | null;
  productVersionNameSnapshot?: string | null;
  isCustomized?: boolean;
};

export type ProposalItemListQuery = {
  sceneId?: string;
  page?: number;
  limit?: number;
};

export type ProposalItemListResponseDto = {
  items: ProposalItemSummaryDto[];
  page: number;
  limit: number;
  total: number;
};

export type PublishedProposalSceneDto = ProposalSceneDto & {
  thumbnailUrl?: string | null;
};

export type ProposalDetailDto = ProposalDto & {
  scenes: ProposalSceneDto[];
  items: ProposalItemSummaryDto[];
};

export type PublishedProposalDto = {
  proposalId: string;
  projectId: string;
  proposalName: string;
  versionNo: number;
  status: ProposalStatus;
  publishedAt: string | null;
  scenes: PublishedProposalSceneDto[];
  items: ProposalItemSummaryDto[];
};

export type SelectFinalProposalRequestDto = {
  note?: string;
};

export type SelectFinalProposalResponseDto = {
  proposalId: string;
  projectId: string;
  quotationId: string;
  proposalStatus: "SELECTED";
  projectStatus: "PROPOSAL_SELECTED";
  selectedAt: string;
};

export type RequestProposalRevisionRequestDto = {
  revisionNote: string;
};

export type RequestProposalRevisionResponseDto = {
  proposalId: string;
  projectId: string;
  proposalStatus: "REVISION_REQUESTED";
  revisionNote: string;
  requestedAt: string;
};
