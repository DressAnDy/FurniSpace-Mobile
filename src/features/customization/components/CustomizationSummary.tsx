import React from "react";
import { Pressable, Text, TextStyle, View, ViewStyle } from "react-native";
import { formatVndAmount } from "../../payment/utils/payment.mapper";
import { CustomizationRequestDto, CustomizationRequestVersionDto } from "../models/customization.model";
import { customizationStyles as styles } from "../styles/customization.styles";
import {
  canAcceptCustomVersion,
  formatSizeLine,
  getFeasibilityPresentation,
  getRequestNote,
  getSourceProductLabel,
  getVersionDisplayLabel,
  getVersionStatusLabel,
  getVersionStatusTone,
  getVersionTitle,
  StatusTone,
} from "../utils/customization.display";

type BadgeProps = {
  label: string;
  tone: StatusTone;
};

const BADGE_STYLE: Record<StatusTone, { wrap: ViewStyle; text: TextStyle }> = {
  neutral: { wrap: styles.badgeNeutral, text: styles.badgeNeutralText },
  info: { wrap: styles.badgeInfo, text: styles.badgeInfoText },
  success: { wrap: styles.badgeSuccess, text: styles.badgeSuccessText },
  warning: { wrap: styles.badgeWarning, text: styles.badgeWarningText },
  danger: { wrap: styles.badgeDanger, text: styles.badgeDangerText },
};

export function StatusBadge({ label, tone }: BadgeProps): React.JSX.Element {
  const toneStyle = BADGE_STYLE[tone];
  return (
    <View style={[styles.badge, toneStyle.wrap]}>
      <Text style={[styles.badgeText, toneStyle.text]}>{label}</Text>
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string | null | undefined }): React.JSX.Element | null {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export function RequestSummary({ request }: { request: CustomizationRequestDto }): React.JSX.Element {
  const sourceLabel = getSourceProductLabel(request);
  const productName = request.sourceProductVersion?.productName;
  const requestedSize = formatSizeLine(
    request.requestedWidth,
    request.requestedHeight,
    request.requestedDepth,
    "cm",
  );

  return (
    <View style={styles.factBlock}>
      <FactRow label="Source version" value={sourceLabel} />
      {productName && productName !== sourceLabel ? <FactRow label="Product" value={productName} /> : null}
      <FactRow label="Requested material" value={request.requestedMaterial} />
      <FactRow label="Requested color" value={request.requestedColor} />
      <FactRow label="Requested size" value={requestedSize} />
      <FactRow label="Request note" value={getRequestNote(request)} />
    </View>
  );
}

type VersionProps = {
  request: CustomizationRequestDto;
  version: CustomizationRequestVersionDto;
  audience: "customer" | "designer";
  acceptPending?: boolean;
  onAccept?: () => void;
};

export function CustomVersionCard({
  request,
  version,
  audience,
  acceptPending = false,
  onAccept,
}: VersionProps): React.JSX.Element {
  const product = version.productVersion;
  const size = formatSizeLine(product.width, product.height, product.depth, product.dimensionUnit ?? "cm");
  const showAccept = audience === "customer" && canAcceptCustomVersion(request, version);
  const feasibility = getFeasibilityPresentation(version);
  const estimatedPrice = product.estimatedPrice ?? product.price;
  const versionLabel = getVersionDisplayLabel(version);
  const title = getVersionTitle(version, request.requestTitle);

  return (
    <View style={[styles.versionCard, showAccept && styles.versionCardFeasible]}>
      <View style={styles.versionAccent} />
      <View style={styles.rowBetween}>
        <Text style={[styles.versionTitle, { flex: 1 }]}>{title}</Text>
      </View>
      {title !== request.requestTitle ? <Text style={styles.versionSubtitle}>{request.requestTitle}</Text> : null}
      <View style={styles.badgeRow}>
        <StatusBadge label={getVersionStatusLabel(version.status)} tone={getVersionStatusTone(version.status)} />
        <StatusBadge label={feasibility.label} tone={feasibility.tone} />
      </View>

      <View style={styles.factBlock}>
        <FactRow label="Version" value={versionLabel} />
        <FactRow label="Designer note" value={version.designerNote} />
        <FactRow label="Feasibility note" value={version.feasibilityNote} />
        <FactRow label="Material" value={product.material} />
        <FactRow label="Color" value={product.color} />
        <FactRow label="Dimensions" value={size} />
        {audience === "designer" ? (
          <FactRow label="Estimated price" value={estimatedPrice != null ? formatVndAmount(estimatedPrice) : null} />
        ) : null}
        <FactRow
          label={audience === "customer" ? "Extra cost" : "Additional cost"}
          value={version.estimatedAdditionalCost != null ? formatVndAmount(version.estimatedAdditionalCost) : null}
        />
        <FactRow label="Cost reason" value={version.additionalCostReason} />
        <FactRow
          label="Production days"
          value={version.estimatedProductionDays != null ? String(version.estimatedProductionDays) : null}
        />
      </View>

      {showAccept ? (
        <Pressable
          style={[styles.acceptButton, acceptPending && { opacity: 0.5 }]}
          disabled={acceptPending || version.feasibilityStatus !== "FEASIBLE"}
          onPress={onAccept}
        >
          <Text style={styles.acceptButtonText}>{acceptPending ? "Accepting..." : "Accept custom version"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
