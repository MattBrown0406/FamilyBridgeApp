import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LifeBuoy, Phone, MessageSquare, HeartHandshake } from "lucide-react";

/**
 * CX improvement 3.5 — a quiet, persistent crisis affordance.
 *
 * Small floating "Need help now?" button rendered on every in-app screen
 * (hidden on marketing/legal/auth pages). Opens immediate options: 988 call
 * and text, the Crisis Text Line, 911 guidance, and app support.
 */

const HIDDEN_PREFIXES = [
  "/auth",
  "/privacy",
  "/terms",
  "/for-providers",
  "/demo",
  "/join",
];

export const CrisisHelpButton = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  if (path === "/" || HIDDEN_PREFIXES.some((p) => path.startsWith(p))) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Need help now? Crisis resources"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-foreground hover:border-primary/40"
      >
        <LifeBuoy className="h-3.5 w-3.5 text-primary" />
        Need help now?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>You're not alone</DialogTitle>
            <DialogDescription>
              If anyone is in immediate danger, call 911. Otherwise, these are free,
              confidential, and available 24/7.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <a href="tel:988" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Phone className="h-4 w-4 mr-3 text-primary shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Call 988</span>
                  <span className="block text-xs text-muted-foreground">
                    Suicide &amp; Crisis Lifeline — press 1 for veterans
                  </span>
                </span>
              </Button>
            </a>
            <a href="sms:988" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <MessageSquare className="h-4 w-4 mr-3 text-primary shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Text 988</span>
                  <span className="block text-xs text-muted-foreground">
                    If talking feels like too much right now
                  </span>
                </span>
              </Button>
            </a>
            <a href="sms:741741?&body=HOME" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <MessageSquare className="h-4 w-4 mr-3 text-primary shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Crisis Text Line</span>
                  <span className="block text-xs text-muted-foreground">
                    Text HOME to 741741
                  </span>
                </span>
              </Button>
            </a>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => {
                setOpen(false);
                navigate("/support");
              }}
            >
              <HeartHandshake className="h-4 w-4 mr-3 text-primary shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-medium">FamilyBridge support</span>
                <span className="block text-xs text-muted-foreground">
                  Questions about the app or your family space
                </span>
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
