import { useEffect, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { PaymentStatus, PaymentUpdatedRealtimeDto } from "../models/payment.model";
import {
  connectPaymentHub,
  getPaymentHubState,
  joinPaymentHub,
  leavePaymentHub,
  subscribePaymentHub,
} from "../../../core/realtime/paymentHub";

type UsePaymentRealtimeOptions = {
  paymentId: string | null;
  enabled?: boolean;
  onUpdated?: (payload: PaymentUpdatedRealtimeDto) => void;
};

export function usePaymentRealtime({ paymentId, enabled = true, onUpdated }: UsePaymentRealtimeOptions): boolean {
  const [hubConnected, setHubConnected] = useState(
    () => getPaymentHubState() === HubConnectionState.Connected,
  );

  useEffect(() => {
    if (!enabled || !paymentId || !onUpdated) {
      setHubConnected(false);
      return;
    }

    let active = true;

    void connectPaymentHub().then((connected) => {
      if (!active) {
        return;
      }
      setHubConnected(connected);
      if (!connected) {
        return;
      }
      void joinPaymentHub(paymentId);
    });

    const unsubscribe = subscribePaymentHub((payload) => {
      if (payload.paymentId !== paymentId) {
        return;
      }
      setHubConnected(getPaymentHubState() === HubConnectionState.Connected);
      onUpdated(payload);
    });

    return () => {
      active = false;
      unsubscribe();
      if (paymentId) {
        void leavePaymentHub(paymentId);
      }
    };
  }, [enabled, onUpdated, paymentId]);

  return hubConnected;
}

export function isPaymentTerminalStatus(status: PaymentStatus): boolean {
  return status === "PAID" || status === "EXPIRED" || status === "CANCELLED";
}
