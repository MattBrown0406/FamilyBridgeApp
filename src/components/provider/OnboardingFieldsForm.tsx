import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// eslint-disable-next-line react-refresh/only-export-components
export const PROVIDER_CATEGORIES = [
  { value: 'residential', label: 'Residential treatment' },
  { value: 'outpatient', label: 'Outpatient program' },
  { value: 'sober_living', label: 'Sober living' },
  { value: 'interventionist', label: 'Interventionist' },
  { value: 'therapy_practice', label: 'Therapy practice' },
  { value: 'case_management', label: 'Case management' },
  { value: 'multi_program', label: 'Multi-program / continuum' },
  { value: 'other', label: 'Other' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const LEVELS_OF_CARE = [
  'Detox',
  'Residential/Inpatient',
  'PHP',
  'IOP',
  'Outpatient',
  'Sober Living',
  'Aftercare/continuing care',
  'Intervention services',
  'Case management',
  'Therapy/Counseling',
];

export interface OnboardingFieldsValue {
  provider_category: string;
  levels_of_care: string[];
  primary_service_duration_days: string; // string in form, parsed on save
  outcome_tracking_enabled: boolean;
  intervention_tracking_enabled: boolean;
  benchmark_opt_in: boolean;
  intake_notes: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultOnboardingFields: OnboardingFieldsValue = {
  provider_category: '',
  levels_of_care: [],
  primary_service_duration_days: '',
  outcome_tracking_enabled: true,
  intervention_tracking_enabled: false,
  benchmark_opt_in: false,
  intake_notes: '',
};

interface Props {
  value: OnboardingFieldsValue;
  onChange: (next: OnboardingFieldsValue) => void;
}

export const OnboardingFieldsForm = ({ value, onChange }: Props) => {
  const set = <K extends keyof OnboardingFieldsValue>(key: K, v: OnboardingFieldsValue[K]) =>
    onChange({ ...value, [key]: v });

  const toggleLoc = (loc: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...value.levels_of_care, loc]))
      : value.levels_of_care.filter((l) => l !== loc);
    set('levels_of_care', next);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Primary service type</Label>
        <Select value={value.provider_category} onValueChange={(v) => set('provider_category', v)}>
          <SelectTrigger><SelectValue placeholder="Select primary service type" /></SelectTrigger>
          <SelectContent>
            {PROVIDER_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Levels of care / services offered</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
          {LEVELS_OF_CARE.map((loc) => {
            const checked = value.levels_of_care.includes(loc);
            return (
              <label key={loc} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={(c) => toggleLoc(loc, c === true)} />
                <span>{loc}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary-duration">Typical primary duration (days)</Label>
        <Input
          id="primary-duration"
          type="number"
          min={0}
          placeholder="e.g. 30"
          value={value.primary_service_duration_days}
          onChange={(e) => set('primary_service_duration_days', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Leave blank if not applicable.</p>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm">Track provider outcomes</Label>
            <p className="text-xs text-muted-foreground">Measure recovery outcomes for this organization.</p>
          </div>
          <Switch
            checked={value.outcome_tracking_enabled}
            onCheckedChange={(c) => set('outcome_tracking_enabled', c)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm">Track intervention outcomes</Label>
            <p className="text-xs text-muted-foreground">Track outcomes from interventions performed.</p>
          </div>
          <Switch
            checked={value.intervention_tracking_enabled}
            onCheckedChange={(c) => set('intervention_tracking_enabled', c)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm">Anonymous benchmark participation (optional)</Label>
            <p className="text-xs text-muted-foreground">Off by default. An organization administrator must explicitly opt in before de-identified aggregate data is contributed.</p>
          </div>
          <Switch
            checked={value.benchmark_opt_in}
            onCheckedChange={(c) => set('benchmark_opt_in', c)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intake-notes">Additional intake notes</Label>
        <Textarea
          id="intake-notes"
          placeholder="Anything specific about your services or measurement assumptions"
          rows={3}
          value={value.intake_notes}
          onChange={(e) => set('intake_notes', e.target.value)}
        />
      </div>
    </div>
  );
};
