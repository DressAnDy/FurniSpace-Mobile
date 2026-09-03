import React from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { arrowLeftIconDefinition, chevronRightIconDefinition } from "../../../icons/navigation/definitions";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { formatTrackingDate } from "../utils/project.tracking.mapper";
import { formatQuotationDepositLabel, hasVisibleDeposit, resolveQuotationDisplayDeposit } from "../utils/quotation.mapper";
import { useProjectQuotationsQuery } from "../hooks/useCustomerFlow";
import { QuotationStatus } from "../models/quotation.model";
import { projectQuotationsStyles as styles } from "./ProjectQuotationsScreen.styles";

type Route = RouteProp<RootStackParamList, "ProjectQuotations">;

function formatStatusLabel(status: QuotationStatus): string {
  return status.replaceAll("_", " ");
}

function getStatusStyles(status: QuotationStatus) {
  switch (status) {
    case "SENT":
    case "REVISED":
      return { pill: styles.statusSent, text: styles.statusSentText };
    case "ACCEPTED":
      return { pill: styles.statusAccepted, text: styles.statusAcceptedText };
    case "REJECTED":
    case "CANCELLED":
      return { pill: styles.statusRejected, text: styles.statusRejectedText };
    case "REVISION_REQUESTED":
    case "EXPIRED":
      return { pill: styles.statusWarning, text: styles.statusWarningText };
    default:
      return { pill: {}, text: {} };
  }
}

function formatQuotationShortCode(code: string): string {
  const parts = code.split("-");
  if (parts.length >= 3) {
    return `${parts[0]}-...-${parts[parts.length - 1]}`;
  }

  return code;
}

export function ProjectQuotationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { projectId, projectName } = route.params;
  const quotationsQuery = useProjectQuotationsQuery(projectId);

  const quotations = quotationsQuery.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroDecor} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppIcon definition={arrowLeftIconDefinition} size={18} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>
          <Text style={styles.heroEyebrow}>FURNISPACE</Text>
          <Text style={styles.heroTitle}>Quotations</Text>
          {projectName ? <Text style={styles.heroProject}>{projectName}</Text> : null}
        </View>

        <View style={styles.content}>
          {quotationsQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#C9A86A" />
              <Text style={styles.loadingText}>Loading quotations...</Text>
            </View>
          ) : quotations.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📄</Text>
              </View>
              <Text style={styles.emptyTitle}>No quotations yet</Text>
              <Text style={styles.emptyText}>
                After you select a proposal, sales will prepare and send your quote here.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>YOUR QUOTES</Text>
                <Text style={styles.sectionCount}>
                  {quotations.length} document{quotations.length > 1 ? "s" : ""}
                </Text>
              </View>

              {quotations.map((quotation) => {
                const statusStyles = getStatusStyles(quotation.status);
                const depositLabel = formatQuotationDepositLabel(quotation);

                return (
                  <Pressable
                    key={quotation.quotationId}
                    style={styles.quotationCard}
                    onPress={() =>
                      navigation.navigate("QuotationDetail", {
                        quotationId: quotation.quotationId,
                        projectId,
                        projectName,
                      })
                    }
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionBadgeText}>Version {quotation.versionNo}</Text>
                      </View>
                      <View style={[styles.statusPill, statusStyles.pill]}>
                        <Text style={[styles.statusPillText, statusStyles.text]}>
                          {formatStatusLabel(quotation.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>Quotation #{quotation.versionNo}</Text>
                    <Text style={styles.cardCode} numberOfLines={1}>
                      {formatQuotationShortCode(quotation.quotationCode)}
                    </Text>

                    <View style={styles.amountRow}>
                      <View>
                        <Text style={styles.amountLabel}>TOTAL</Text>
                        <Text style={styles.amountValue}>
                          {formatVndAmount(quotation.totalAmount, quotation.currency)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.metaText}>
                        {depositLabel}:{" "}
                        {hasVisibleDeposit(quotation)
                          ? formatVndAmount(resolveQuotationDisplayDeposit(quotation), quotation.currency)
                          : "Pending from sales"}
                        {quotation.validUntil
                          ? `\nValid until ${formatTrackingDate(quotation.validUntil)}`
                          : ""}
                      </Text>
                      <View style={styles.chevronWrap}>
                        <AppIcon definition={chevronRightIconDefinition} size={14} color="#8A6D3B" strokeWidth={2.2} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
