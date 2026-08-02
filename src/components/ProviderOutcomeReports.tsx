import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Info, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ProviderOutcomeReportsProps {
  organizationId: string;
  organizationName: string;
}

interface ProviderOutcomeAggregateRow {
  metric_key: string;
  cohort_size: number | null;
  numerator: number | null;
  metric_value: number | null;
  suppressed: boolean;
}

const RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
];

const METRIC_COPY: Record<string, { label: string; description: string; format: (value: number) => string }> = {
  sobriety_stability_rate: {
    label: "Active sobriety journey rate",
    description: "Share of the reporting cohort with a currently active sobriety journey.",
    format: (value) => `${Math.round(value * 100)}%`,
  },
  independent_living_rate: {
    label: "Independent living rate",
    description: "Share of the reporting cohort whose current documented care phase is independent living.",
    format: (value) => `${Math.round(value * 100)}%`,
  },
  completed_handoff_rate: {
    label: "Completed handoff rate",
    description: "Share of the reporting cohort with a completed, consented provider handoff.",
    format: (value) => `${Math.round(value * 100)}%`,
  },
  average_days_in_care: {
    label: "Average documented days in care",
    description: "Average days represented by documented care phases in the reporting cohort.",
    format: (value) => `${Math.round(value)} days`,
  },
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const ProviderOutcomeReports = ({ organizationId, organizationName }: ProviderOutcomeReportsProps) => {
  const [rangeDays, setRangeDays] = useState("90");
  const [rows, setRows] = useState<ProviderOutcomeAggregateRow[]>([]);
  const [benchmarkOptIn, setBenchmarkOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const windowEnd = new Date();
      const windowStart = new Date(windowEnd);
      windowStart.setUTCDate(windowStart.getUTCDate() - Number(rangeDays));

      const [reportResult, organizationResult] = await Promise.all([
        supabase.rpc("get_provider_outcome_aggregates", {
          p_organization_id: organizationId,
          p_window_start: isoDate(windowStart),
          p_window_end: isoDate(windowEnd),
        }),
        supabase.from("organizations").select("benchmark_opt_in").eq("id", organizationId).single(),
      ]);

      if (reportResult.error) throw reportResult.error;
      if (organizationResult.error) throw organizationResult.error;
      setRows((reportResult.data || []).map((row) => ({
        ...row,
        cohort_size: row.cohort_size === null ? null : Number(row.cohort_size),
      })) as ProviderOutcomeAggregateRow[]);
      setBenchmarkOptIn(organizationResult.data.benchmark_opt_in === true);
    } catch (cause) {
      console.error("Unable to load privacy-safe outcome report", cause);
      setError(cause instanceof Error ? cause.message : "Unable to load this report.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, rangeDays]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const cohortSize = rows[0]?.cohort_size ?? null;
  const suppressed = rows.some((row) => row.suppressed);
  const metrics = useMemo(() => rows.map((row) => ({
    ...row,
    copy: METRIC_COPY[row.metric_key] || {
      label: row.metric_key.replace(/_/g, " "),
      description: "Privacy-safe organization aggregate.",
      format: (value: number) => value.toFixed(2),
    },
  })), [rows]);

  const exportAggregate = () => {
    if (suppressed || metrics.length === 0) return;
    const csvRows = [
      ["Organization", organizationName],
      ["Period (days)", rangeDays],
      ["Cohort size", cohortSize ?? ""],
      ...metrics.map((metric) => [metric.copy.label, metric.metric_value === null ? "" : metric.copy.format(metric.metric_value)]),
    ];
    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${organizationName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-aggregate-outcomes.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Aggregate report downloaded");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Organization outcomes</h2>
          <p className="text-sm text-muted-foreground">Server-calculated, minimum-necessary engagement measures.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Reporting period"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void loadReport()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh
          </Button>
          <Button variant="outline" onClick={exportAggregate} disabled={suppressed || metrics.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export aggregate
          </Button>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Privacy-safe reporting</AlertTitle>
        <AlertDescription>
          Family profiles and message content never enter this reporting screen. Calculations run on the server, and cohorts under ten families are suppressed. Benchmark contribution is separate and remains off until an administrator explicitly opts in.
        </AlertDescription>
      </Alert>

      {loading && <Card><CardContent className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></CardContent></Card>}

      {!loading && error && (
        <Alert variant="destructive"><AlertTitle>Report unavailable</AlertTitle><AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadReport()}>Try again</Button></AlertDescription></Alert>
      )}

      {!loading && !error && (suppressed || cohortSize === null || cohortSize < 10) && (
        <Card>
          <CardHeader><CardTitle>Protected small cohort</CardTitle><CardDescription>Results remain hidden until at least ten families are represented.</CardDescription></CardHeader>
          <CardContent><Badge variant="secondary">Below minimum reporting threshold</Badge></CardContent>
        </Card>
      )}

      {!loading && !error && !suppressed && cohortSize !== null && cohortSize >= 10 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.metric_key}>
                <CardHeader className="pb-2"><CardDescription>{metric.copy.label}</CardDescription><CardTitle className="text-3xl">{metric.metric_value === null ? "—" : metric.copy.format(metric.metric_value)}</CardTitle></CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">{metric.copy.description}</p></CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Aggregate cohort: {cohortSize} families</span>
            <Badge variant={benchmarkOptIn ? "default" : "secondary"}>{benchmarkOptIn ? "Benchmark sharing enabled" : "Benchmark sharing off"}</Badge>
          </div>
        </>
      )}

      <div className="flex gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>These measures summarize documented operational outcomes. They do not predict treatment acceptance, recovery, or relapse and are not a substitute for professional judgment.</p>
      </div>
    </div>
  );
};

export default ProviderOutcomeReports;
