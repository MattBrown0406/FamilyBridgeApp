import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PaymentStatus {
  id: string;
  user_id: string;
  entity_type: "family" | "organization";
  entity_id: string;
  status: "active" | "past_due" | "suspended" | "canceled";
  last_payment_attempt: string | null;
  next_retry_at: string | null;
  failed_at: string | null;
  suspension_date: string | null;
  grace_period_ends_at: string | null;
  retry_count: number;
  last_error: string | null;
  card_last_four: string | null;
  payment_updated_at: string | null;
}

export function usePaymentStatus() {
  const { user } = useAuth();
  const [paymentIssues, setPaymentIssues] = useState<PaymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<PaymentStatus | null>(null);

  const fetchPaymentStatus = useCallback(async () => {
    if (!user) {
      setPaymentIssues([]);
      setIsLoading(false);
      return;
    }

    try {
      // Get all payment statuses where user is an admin
      const { data, error } = await supabase
        .from("subscription_payment_status")
        .select("*")
        .in("status", ["past_due", "suspended"]);

      if (error) throw error;

      const issues = (data || []) as PaymentStatus[];
      setPaymentIssues(issues);

      // Show popup if there are any payment issues
      if (issues.length > 0) {
        setSelectedIssue(issues[0]);
        setShowPaymentPopup(true);
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  // Listen for realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("payment-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_payment_status",
        },
        (payload) => {
          console.log("Payment status change:", payload);
          fetchPaymentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPaymentStatus]);

  const dismissPopup = useCallback(() => {
    setShowPaymentPopup(false);
  }, []);

  const getGracePeriodRemaining = useCallback((issue: PaymentStatus) => {
    if (!issue.grace_period_ends_at) return null;
    const endDate = new Date(issue.grace_period_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  return {
    paymentIssues,
    isLoading,
    showPaymentPopup,
    selectedIssue,
    setShowPaymentPopup,
    setSelectedIssue,
    dismissPopup,
    getGracePeriodRemaining,
    refetch: fetchPaymentStatus,
  };
}
