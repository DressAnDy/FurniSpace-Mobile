import { useEffect } from "react";
import { PaymentStatus, PaymentUpdatedRealtimeDto } from "../models/payment.model";
import {
  connectPaymentHub,
  joinPaymentHub,
  leavePaymentHub,
  subscribePaymentHub,
} from "../../../core/realtime/paymentHub";

type UsePaymentRealtimeOptions = {
  paymentId: string | null;
  enabled?: boolean;
  onUpdated?: (payload: PaymentUpdatedRealtimeDto) => void;
};

export function usePaymentRealtime({ paymentId, enabled = true, onUpdated }: UsePaymentRealtimeOptions): void {
  useEffect(() => {
    if (!enabled || !paymentId || !onUpdated) {
      return;
    }

    let active = true;

    void connectPaymentHub().then((connected) => {
      if (!active || !connected) {
        return;
      }

      void joinPaymentHub(paymentId);
    });

    const unsubscribe = subscribePaymentHub((payload) => {
      if (payload.paymentId !== paymentId) {
        return;
      }

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
}

export function isPaymentTerminalStatus(status: PaymentStatus): boolean {
  return status === "PAID" || status === "EXPIRED" || status === "CANCELLED";
}
