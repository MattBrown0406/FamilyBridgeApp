import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowRight,
  Compass,
  ClipboardList,
  CalendarCheck,
  HeartHandshake,
  Pencil,
} from "lucide-react";

/**
 * CX improvement 3.1 — stage-based onboarding.
 *
 * A compact strip that asks "Where is your family right now?" once, stores the
 * answer on families.journey_stage (via the set_family_journey_stage RPC so any
 * member can answer), and from then on shows ONE highlighted next action for
 * that stage instead of leaving the family to wander 30+ routes.
 */

export type JourneyStage = "considering" | "preparing" | "intervention" | "aftercare";

const STAGES: {
  id: JourneyStage;
  icon: typeof Compass;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
}[] = [
  {
    id: "considering",
    icon: Compass,
    label: "Considering an intervention",
    description: "We're worried and trying to figure out what to do.",
    actionLabel: "Take the readiness assessment",
    actionPath: "/intervention-readiness",
  },
  {
    id: "preparing",
    icon: ClipboardList,
    label: "Preparing for one",
    description: "We've decided — now we're getting everyone aligned.",
    actionLabel: "Work on your intervention plan",
    actionPath: "/intervention-execution",
  },
  {
    id: "intervention",
    icon: CalendarCheck,
    label: "Intervention week",
    description: "It's happening now or within days.",
    actionLabel: "Open day-of support",
    actionPath: "/intervention-execution",
  },
  {
    id: "aftercare",
    icon: HeartHandshake,
    label: "After the intervention",
    description: "Our loved one is in (or out of) treatment — now what?",
    actionLabel: "Open your aftercare hub",
    actionPath: "/post-intervention",
  },
];

export function getStageMeta(stage: JourneyStage | null | undefined) {
  return STAGES.find((s) => s.id === stage) ?? null;
}

interface JourneyStageCardProps {
  familyId: string;
}

export const JourneyStageCard = ({ familyId }: JourneyStageCardProps) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<JourneyStage | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("families")
        .select("journey_stage")
        .eq("id", familyId)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) {
          setStage((data.journey_stage as JourneyStage | null) ?? null);
        }
        setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  const saveStage = async (next: JourneyStage) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("set_family_journey_stage", {
        _family_id: familyId,
        _stage: next,
      });
      if (error) throw error;
      setStage(next);
      setPickerOpen(false);
      const meta = getStageMeta(next);
      toast.success(`Got it — we'll focus on: ${meta?.actionLabel ?? "your next step"}`);
    } catch (err) {
      console.error("Failed to save journey stage:", err);
      toast.error("Couldn't save that right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const meta = getStageMeta(stage);

  return (
    <>
      <Card className="shrink-0 mb-2 sm:mb-3 border-primary/20 bg-primary/5">
        <CardContent className="py-2.5 px-3 sm:px-4">
          {meta ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <meta.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Your family's stage:{" "}
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="underline decoration-dotted underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5"
                    >
                      {meta.label}
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  </p>
                  <p className="text-sm font-medium leading-tight truncate">
                    Recommended next step: {meta.actionLabel}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(meta.actionPath)} className="shrink-0">
                Go <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium">
                  Where is your family right now? We'll point you to the right next step.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="shrink-0">
                Choose
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Where is your family right now?</DialogTitle>
            <DialogDescription>
              This helps FamilyBridge show you the right next step — you can change it any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={saving}
                onClick={() => saveStage(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/60 disabled:opacity-50 ${
                  stage === s.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <s.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
