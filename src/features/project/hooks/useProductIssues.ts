import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/constants/queryKeys";
import { useAuthStore } from "../../auth/store/auth.store";
import { CreateProductIssueInput } from "../models/productIssue.model";
import {
  createProductIssueApi,
  getOrderProductIssuesApi,
  getProductIssueApi,
  getProjectProductIssuesApi,
} from "../services/productIssue.api";

export function useProjectProductIssuesQuery(projectId: string | null, enabled = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.productIssue.byProject(projectId ?? "none"),
    enabled: isLoggedIn && enabled && Boolean(projectId),
    queryFn: () => getProjectProductIssuesApi(projectId!),
  });
}

export function useOrderProductIssuesQuery(orderId: string | null, enabled = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.productIssue.byOrder(orderId ?? "none"),
    enabled: isLoggedIn && enabled && Boolean(orderId),
    queryFn: () => getOrderProductIssuesApi(orderId!),
  });
}

export function useProductIssueDetailQuery(issueId: string | null) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: queryKeys.productIssue.detail(issueId ?? "none"),
    enabled: isLoggedIn && Boolean(issueId),
    queryFn: () => getProductIssueApi(issueId!),
  });
}

export function useCreateProductIssueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductIssueInput) => createProductIssueApi(input),
    onSuccess: (issue, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productIssue.byOrder(input.orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productIssue.byProject(issue.projectId) });
      queryClient.setQueryData(queryKeys.productIssue.detail(issue.deliveryProductIssueReportId), issue);
    },
  });
}

export function formatProductIssueTypeLabel(issueType: string): string {
  return issueType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
