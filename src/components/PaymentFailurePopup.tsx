import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, Clock, XCircle } from "lucide-react";
import { PaymentStatus } from "@/hooks/usePaymentStatus";

interface PaymentFailurePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentIssue: PaymentStatus | null;
  gracePeriodRemaining: number | null;
}

export function PaymentFailurePopup({
  open,
  onOpenChange,
  paymentIssue,
  gracePeriodRemaining,
}: PaymentFailurePopupProps) {
  const navigate = useNavigate();

  if (!paymentIssue) return null;

  const isSuspended = paymentIssue.status === "suspended";
  const entityLabel = paymentIssue.entity_type === "family" ? "Family" : "Provider";

  const handleUpdatePayment = () => {
    onOpenChange(false);
    navigate(`/update-payment?entity=${paymentIssue.entity_type}&id=${paymentIssue.entity_id}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {isSuspended ? (
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            )}
            <AlertDialogTitle className="text-xl">
              {isSuspended ? "Account Suspended" : "Payment Failed"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isSuspended ? (
                <p className="text-foreground">
                  Your {entityLabel.toLowerCase()} subscription has been suspended due to 
                  payment failure. Please update your payment method to restore access.
                </p>
              ) : (
                <>
                  <p className="text-foreground">
                    We were unable to process your payment for the {entityLabel.toLowerCase()} subscription.
                  </p>
                  {gracePeriodRemaining !== null && gracePeriodRemaining > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                      <Clock className="h-5 w-5 text-warning" />
                      <span className="text-sm font-medium">
                        {gracePeriodRemaining} day{gracePeriodRemaining !== 1 ? "s" : ""} remaining 
                        before account suspension
                      </span>
                    </div>
                  )}
                </>
              )}

              {paymentIssue.last_error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Error:</span> {paymentIssue.last_error}
                  </p>
                </div>
              )}

              {paymentIssue.card_last_four && (
                <p className="text-sm text-muted-foreground">
                  Card ending in •••• {paymentIssue.card_last_four}
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                We will automatically retry charging your card daily. You can also update 
                your payment method now to resolve this immediately.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel>Remind Me Later</AlertDialogCancel>
          <Button onClick={handleUpdatePayment} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Update Payment Method
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
