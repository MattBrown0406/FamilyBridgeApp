import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { useState } from 'react';

const styles = [
  { value: 'johnson', label: 'Johnson Model (Direct)', description: 'Structured, direct confrontation with pre-written impact statements. Most effective when resistance is clearly weakening.' },
  { value: 'invitational', label: 'Invitational', description: 'Non-confrontational approach that invites the individual to participate. Best when some self-awareness already exists.' },
  { value: 'systemic', label: 'Systemic / Family Systems', description: 'Focuses on the family system as a whole. Appropriate when enabling patterns are deeply embedded.' },
  { value: 'arise', label: 'ARISE (Gradual)', description: 'Multi-stage approach that escalates gradually. Useful when family is not yet fully aligned.' },
  { value: 'hybrid', label: 'Hybrid / Custom', description: 'Combines elements based on the specific situation. Recommended for complex or atypical cases.' },
];

interface StrategyBuilderProps {
  score: number;
  statusLabel: string;
}

export const StrategyBuilder = ({ score, statusLabel }: StrategyBuilderProps) => {
  const [style, setStyle] = useState('');
  const [location, setLocation] = useState('');
  const [timing, setTiming] = useState('');
  const [keyMessages, setKeyMessages] = useState('');

  const selectedStyle = styles.find((s) => s.value === style);

  const getSuggestion = () => {
    if (score >= 80) {
      return 'Direct, structured intervention recommended. Reduced resistance and elevated consequence awareness create a narrow but clear window. Act within 24–72 hours with a Johnson or hybrid approach.';
    }
    return 'Readiness is building but not yet critical. An invitational or ARISE approach may be appropriate to avoid premature confrontation. Continue preparation and monitor for escalation.';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Intervention Strategy Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Suggested Approach */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs font-semibold text-primary mb-1">Suggested Approach</p>
          <p className="text-sm text-foreground">{getSuggestion()}</p>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <Label className="text-sm">Intervention Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Select approach..." />
            </SelectTrigger>
            <SelectContent>
              {styles.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStyle && (
            <p className="text-xs text-muted-foreground">{selectedStyle.description}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm">Location</Label>
          <Input
            placeholder="e.g., Family home, neutral location, therapist office..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Choose a private, controlled environment. Avoid public spaces or locations with easy exit routes.</p>
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <Label className="text-sm">Target Timing</Label>
          <Input
            placeholder="e.g., Saturday morning, after they wake up sober..."
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Early morning typically offers the lowest resistance. Avoid times when the individual is likely impaired.</p>
        </div>

        {/* Key Messages */}
        <div className="space-y-2">
          <Label className="text-sm">Key Messages / Themes</Label>
          <Textarea
            placeholder="What are the core themes the family wants to communicate? E.g., love, concern, specific consequences..."
            value={keyMessages}
            onChange={(e) => setKeyMessages(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
