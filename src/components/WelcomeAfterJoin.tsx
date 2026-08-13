import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Compass, ArrowRight, HeartHandshake } from "lucide-react";
import { getStageActionHref, getStageMeta, type JourneyStage } from "@/components/home/JourneyStageCard";

/**
 * CX improvement 3.4 — first-session experience for an invited family member.
 *
 * JoinFamily sets sessionStorage["fb_welcome_pending"] before handing off to
 * /auth. The first time the new member lands in their family space, this shows
 * a short, warm 3-step welcome keyed to the family's journey stage instead of
 * dropping them into a generic dashboard. Shows once, then clears the flag.
 */

const FLAG_KEY = "fb_welcome_pending";

export const markWelcomePending = () => {
  try {
    sessionStorage.setItem(FLAG_KEY, "1");
  } catch {
    /* private mode etc. — welcome is best-effort */
  }
};

interface WelcomeAfterJoinProps {
  familyId: string;
}

export const WelcomeAfterJoin = ({ familyId }: WelcomeAfterJoinProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState<string>("");
  const [stage, setStage] = useState<JourneyStage | null>(null);

  useEffect(() => {
    let pending = false;
    try {
      pending = sessionStorage.getItem(FLAG_KEY) === "1";
    } catch {
      pending = false;
    }
    if (!pending) return;

    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("families")
        .select("name, journey_stage")
        .eq("id", familyId)
        .maybeSingle();
      if (cancelled) return;
      setFamilyName(data?.name ?? "your family");
      setStage((data?.journey_stage as JourneyStage | null) ?? null);
      setOpen(true);
      try {
        sessionStorage.removeItem(FLAG_KEY);
      } catch {
        /* noop */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  if (!open) return null;

  const meta = getStageMeta(stage);

  const steps = [
    {
      icon: Users,
      title: `Welcome — you're part of ${familyName}`,
      body: "Someone who cares about the same person you do invited you here. FamilyBridge is your family's private space to stay aligned, communicate safely, and support each other through this.",
      cta: "Next",
    },
    {
      icon: Compass,
      title: meta ? `Your family is: ${meta.label.toLowerCase()}` : "Every family is somewhere",
      body: meta
        ? `${meta.description} The app is organized around this stage, so what you see is what matters right now — not everything at once.`
        : "Your family hasn't chosen a stage yet. When someone does, FamilyBridge will focus everyone on the right next step for where you actually are.",
      cta: "Next",
    },
    {
      icon: HeartHandshake,
      title: "One good first step",
      body: meta
        ? `A good way to start: ${meta.actionLabel.toLowerCase()}. And any time things feel overwhelming, the "Need help now?" button is always in the corner of your screen.`
        : `A good way to start: say hello in your family's chat. And any time things feel overwhelming, the "Need help now?" button is always in the corner of your screen.`,
      cta: meta ? meta.actionLabel : "Open family chat",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleCta = () => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setOpen(false);
    if (meta) {
      navigate(getStageActionHref(stage, familyId));
    } else {
      navigate(`/family/${familyId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <current.icon className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            {current.body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-1.5 py-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleCta}>
            {current.cta} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          {isLast && (
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              I'll explore on my own
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
