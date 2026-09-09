import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ProductIssuesCard } from "../../project/components/ProductIssuesCard";
import { useSaleOrdersQuery, useSaleProductionRequestsQuery } from "../hooks/useSaleFulfillment";
import { OperationalDelayPanel } from "./OperationalDelayPanel";
import { styles } from "./OperationalDelayPanel.styles";

type SaleIssueScope = "PRODUCTION" | "DELIVERY" | "CUSTOMER";

const SCOPES: { key: SaleIssueScope; label: string }[] = [
  { key: "PRODUCTION", label: "Production" },
  { key: "DELIVERY", label: "Delivery" },
  { key: "CUSTOMER", label: "Customer" },
];

type SaleIssuesTabProps = {
  projectId: string | null;
};

export function SaleIssuesTab({ projectId }: SaleIssuesTabProps): React.JSX.Element {
  const [scope, setScope] = useState<SaleIssueScope>("PRODUCTION");
  const ordersQuery = useSaleOrdersQuery(projectId);
  const primaryOrderId = ordersQuery.data?.[0]?.orderId ?? null;
  const productionRequestsQuery = useSaleProductionRequestsQuery(projectId, primaryOrderId);
  const productionRequestId = productionRequestsQuery.data?.[0]?.productionRequestId ?? null;

  if (!projectId) {
    return <Text style={styles.hintText}>Select a project to view issues.</Text>;
  }

  return (
    <View>
      <View style={styles.scopeRow}>
        {SCOPES.map((item) => {
          const active = scope === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => setScope(item.key)}
              style={[styles.scopeChip, active ? styles.scopeChipActive : null]}
            >
              <Text style={[styles.scopeChipText, active ? styles.scopeChipTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {scope === "CUSTOMER" ? (
        <ProductIssuesCard projectId={projectId} allowCreate={false} />
      ) : (
        <OperationalDelayPanel
          projectId={projectId}
          phase={scope}
          productionRequestId={productionRequestId}
          orderId={primaryOrderId}
          allowCreate
          title={`${itemLabel(scope)} delays`}
        />
      )}
    </View>
  );
}

function itemLabel(scope: Exclude<SaleIssueScope, "CUSTOMER">): string {
  return scope === "PRODUCTION" ? "Production" : "Delivery";
}
