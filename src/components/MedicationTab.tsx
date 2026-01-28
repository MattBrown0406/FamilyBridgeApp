import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pill, Camera, Plus, Loader2, Phone, User, Building2, Calendar, 
  RefreshCw, Clock, Check, X, AlertTriangle, Trash2, Edit, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isPast, addHours } from 'date-fns';
import { usePlatform } from '@/hooks/usePlatform';

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  last_refill_date: string | null;
  refills_remaining: number | null;
  instructions: string | null;
  frequency: string | null;
  times_per_day: number;
  specific_times: string[] | null;
  label_image_url: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

interface MedicationDose {
  id: string;
  medication_id: string;
  scheduled_at: string;
  scheduled_time: string | null;
  taken_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  medication?: Medication;
}

interface MedicationAlert {
  id: string;
  medication_id: string;
  alert_type: string;
  message: string;
  acknowledged_at: string | null;
  created_at: string;
}

interface MedicationTabProps {
  familyId: string;
  currentUserId: string;
  isAdminOrModerator: boolean;
  recoveringMemberId?: string;
  members: { user_id: string; full_name: string; role: string }[];
}

export const MedicationTab = ({ 
  familyId, 
  currentUserId, 
  isAdminOrModerator,
  recoveringMemberId,
  members 
}: MedicationTabProps) => {
  const { toast } = useToast();
  const { isNative } = usePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysDoses, setTodaysDoses] = useState<MedicationDose[]>([]);
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set());
  
  // Form state
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    pharmacy_name: '',
    pharmacy_phone: '',
    doctor_name: '',
    doctor_phone: '',
    last_refill_date: '',
    refills_remaining: '',
    instructions: '',
    frequency: 'once daily',
    times_per_day: 1,
    specific_times: ['08:00'],
    target_user_id: recoveringMemberId || ''
  });

  const recoveringMembers = members.filter(m => m.role === 'recovering');

  useEffect(() => {
    loadData();
    
    // Set up realtime subscription for doses
    const dosesChannel = supabase
      .channel('medication-doses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medication_doses',
        filter: `family_id=eq.${familyId}`
      }, () => {
        loadTodaysDoses();
      })
      .subscribe();

    // Set up realtime subscription for alerts
    const alertsChannel = supabase
      .channel('medication-alerts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medication_alerts',
        filter: `family_id=eq.${familyId}`
      }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dosesChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [familyId]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadMedications(), loadTodaysDoses(), loadAlerts()]);
    setIsLoading(false);
  };

  const loadMedications = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('medication_name');

    if (error) {
      console.error('Error loading medications:', error);
    } else {
      setMedications(data || []);
    }
  };

  const loadTodaysDoses = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('medication_doses')
      .select('*, medications(*)')
      .eq('family_id', familyId)
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at');

    if (error) {
      console.error('Error loading doses:', error);
    } else {
      // Map the nested medication data
      const mappedDoses = (data || []).map(d => ({
        ...d,
        medication: d.medications as unknown as Medication
      }));
      setTodaysDoses(mappedDoses);
    }
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('medication_alerts')
      .select('*')
      .eq('family_id', familyId)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading alerts:', error);
    } else {
      setAlerts(data || []);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLabelImage(base64);
      await analyzeLabelImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeLabelImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-medication-label', {
        body: { image: imageData }
      });

      if (error) throw error;

      if (data && !data.error) {
        setFormData(prev => ({
          ...prev,
          medication_name: data.medication_name || prev.medication_name,
          dosage: data.dosage || prev.dosage,
          pharmacy_name: data.pharmacy_name || prev.pharmacy_name,
          pharmacy_phone: data.pharmacy_phone || prev.pharmacy_phone,
          doctor_name: data.doctor_name || prev.doctor_name,
          doctor_phone: data.doctor_phone || prev.doctor_phone,
          last_refill_date: data.last_refill_date || prev.last_refill_date,
          refills_remaining: data.refills_remaining?.toString() || prev.refills_remaining,
          instructions: data.instructions || prev.instructions,
          frequency: data.frequency || prev.frequency
        }));

        toast({
          title: 'Label analyzed!',
          description: `Confidence: ${data.confidence}%. Please verify the extracted information.`
        });
      }
    } catch (error) {
      console.error('Error analyzing label:', error);
      toast({
        title: 'Analysis failed',
        description: 'Could not analyze the label. Please enter information manually.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMedication = async () => {
    if (!formData.medication_name.trim()) {
      toast({
        title: 'Medication name required',
        description: 'Please enter the medication name.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.target_user_id) {
      toast({
        title: 'Select patient',
        description: 'Please select who this medication is for.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Upload label image if present
      let labelImageUrl = null;
      if (labelImage) {
        const fileName = `${familyId}/${Date.now()}-medication-label.jpg`;
        const base64Data = labelImage.split(',')[1];
        const { error: uploadError } = await supabase.storage
          .from('medication-labels')
          .upload(fileName, decode(base64Data), {
            contentType: 'image/jpeg'
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('medication-labels')
            .getPublicUrl(fileName);
          labelImageUrl = urlData.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('medications')
        .insert({
          family_id: familyId,
          user_id: formData.target_user_id,
          created_by: currentUserId,
          medication_name: formData.medication_name,
          dosage: formData.dosage || null,
          pharmacy_name: formData.pharmacy_name || null,
          pharmacy_phone: formData.pharmacy_phone || null,
          doctor_name: formData.doctor_name || null,
          doctor_phone: formData.doctor_phone || null,
          last_refill_date: formData.last_refill_date || null,
          refills_remaining: formData.refills_remaining ? parseInt(formData.refills_remaining) : null,
          instructions: formData.instructions || null,
          frequency: formData.frequency,
          times_per_day: formData.times_per_day,
          specific_times: formData.specific_times,
          label_image_url: labelImageUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Generate today's doses
      if (data) {
        await generateDosesForMedication(data.id);
      }

      toast({
        title: 'Medication added!',
        description: `${formData.medication_name} has been added to the medication list.`
      });

      resetForm();
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: 'Error',
        description: 'Failed to save medication. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateDosesForMedication = async (medicationId: string) => {
    const { error } = await supabase.rpc('generate_medication_doses_for_day', {
      _medication_id: medicationId
    });
    if (error) console.error('Error generating doses:', error);
  };

  const handleMarkDoseTaken = async (doseId: string) => {
    const { error } = await supabase
      .from('medication_doses')
      .update({
        taken_at: new Date().toISOString(),
        confirmed_by: currentUserId
      })
      .eq('id', doseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark dose as taken.',
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Dose recorded!' });
      loadTodaysDoses();
    }
  };

  const handleSkipDose = async (doseId: string, reason: string) => {
    const { error } = await supabase
      .from('medication_doses')
      .update({
        skipped: true,
        skip_reason: reason,
        confirmed_by: currentUserId
      })
      .eq('id', doseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to skip dose.',
        variant: 'destructive'
      });
    } else {
      loadTodaysDoses();
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('medication_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: currentUserId
      })
      .eq('id', alertId);

    if (!error) {
      loadAlerts();
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    const { error } = await supabase
      .from('medications')
      .update({ 
        is_active: false, 
        discontinued_at: new Date().toISOString() 
      })
      .eq('id', medicationId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove medication.',
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Medication discontinued' });
      loadMedications();
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      pharmacy_name: '',
      pharmacy_phone: '',
      doctor_name: '',
      doctor_phone: '',
      last_refill_date: '',
      refills_remaining: '',
      instructions: '',
      frequency: 'once daily',
      times_per_day: 1,
      specific_times: ['08:00'],
      target_user_id: recoveringMemberId || ''
    });
    setLabelImage(null);
  };

  const updateTimesPerDay = (count: number) => {
    const defaultTimes = ['08:00', '12:00', '18:00', '22:00'];
    setFormData(prev => ({
      ...prev,
      times_per_day: count,
      specific_times: defaultTimes.slice(0, count)
    }));
  };

  const updateSpecificTime = (index: number, time: string) => {
    setFormData(prev => {
      const newTimes = [...prev.specific_times];
      newTimes[index] = time;
      return { ...prev, specific_times: newTimes };
    });
  };

  const toggleMedicationExpanded = (id: string) => {
    setExpandedMedications(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.full_name || 'Unknown';
  };

  const pendingDoses = todaysDoses.filter(d => !d.taken_at && !d.skipped && new Date(d.scheduled_at) <= new Date());
  const upcomingDoses = todaysDoses.filter(d => !d.taken_at && !d.skipped && new Date(d.scheduled_at) > new Date());
  const completedDoses = todaysDoses.filter(d => d.taken_at || d.skipped);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              Medication Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span className="text-sm">{alert.message}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Doses */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Medications
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysDoses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No medications scheduled for today.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Pending/Overdue */}
              {pendingDoses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Needs Attention ({pendingDoses.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingDoses.map(dose => (
                      <DoseCard
                        key={dose.id}
                        dose={dose}
                        onMarkTaken={() => handleMarkDoseTaken(dose.id)}
                        onSkip={(reason) => handleSkipDose(dose.id, reason)}
                        getMemberName={getMemberName}
                        status="overdue"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingDoses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Upcoming ({upcomingDoses.length})
                  </h4>
                  <div className="space-y-2">
                    {upcomingDoses.map(dose => (
                      <DoseCard
                        key={dose.id}
                        dose={dose}
                        onMarkTaken={() => handleMarkDoseTaken(dose.id)}
                        onSkip={(reason) => handleSkipDose(dose.id, reason)}
                        getMemberName={getMemberName}
                        status="upcoming"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedDoses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Completed ({completedDoses.length})
                  </h4>
                  <div className="space-y-2">
                    {completedDoses.map(dose => (
                      <DoseCard
                        key={dose.id}
                        dose={dose}
                        onMarkTaken={() => {}}
                        onSkip={() => {}}
                        getMemberName={getMemberName}
                        status={dose.skipped ? 'skipped' : 'completed'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications List */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              Medications ({medications.length})
            </CardTitle>
            <CardDescription>
              Active prescriptions and supplements
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
                <DialogDescription>
                  Take a photo of the medication label to auto-fill, or enter details manually.
                </DialogDescription>
              </DialogHeader>
              
              {/* Image Capture */}
              <div className="space-y-4">
                <div>
                  <Label>Medication Label Photo</Label>
                  <div className="mt-2 flex flex-col items-center gap-2">
                    {labelImage ? (
                      <div className="relative w-full">
                        <img 
                          src={labelImage} 
                          alt="Medication label" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <span className="ml-2 text-white">Analyzing...</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setLabelImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-24 flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-8 w-8" />
                        <span>Take Photo of Label</span>
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageCapture}
                    />
                  </div>
                </div>

                {/* Target User */}
                <div>
                  <Label>Who is this medication for?</Label>
                  <Select 
                    value={formData.target_user_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, target_user_id: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      {recoveringMembers.length > 0 ? (
                        recoveringMembers.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        members.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Medication Name *</Label>
                    <Input
                      value={formData.medication_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                      placeholder="e.g., Lisinopril"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={formData.dosage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 10mg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, frequency: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once daily">Once daily</SelectItem>
                        <SelectItem value="twice daily">Twice daily</SelectItem>
                        <SelectItem value="three times daily">Three times daily</SelectItem>
                        <SelectItem value="four times daily">Four times daily</SelectItem>
                        <SelectItem value="as needed">As needed</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Times per day */}
                <div>
                  <Label>Times Per Day</Label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4].map(n => (
                      <Button
                        key={n}
                        type="button"
                        variant={formData.times_per_day === n ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTimesPerDay(n)}
                      >
                        {n}x
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Specific times */}
                <div>
                  <Label>Schedule Times</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {formData.specific_times.map((time, i) => (
                      <Input
                        key={i}
                        type="time"
                        value={time}
                        onChange={(e) => updateSpecificTime(i, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Pharmacy & Doctor Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pharmacy Name</Label>
                    <Input
                      value={formData.pharmacy_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, pharmacy_name: e.target.value }))}
                      placeholder="CVS, Walgreens..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Pharmacy Phone</Label>
                    <Input
                      value={formData.pharmacy_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, pharmacy_phone: e.target.value }))}
                      placeholder="555-123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doctor Name</Label>
                    <Input
                      value={formData.doctor_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctor_name: e.target.value }))}
                      placeholder="Dr. Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doctor Phone</Label>
                    <Input
                      value={formData.doctor_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctor_phone: e.target.value }))}
                      placeholder="555-123-4567"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Refill Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Last Refill Date</Label>
                    <Input
                      type="date"
                      value={formData.last_refill_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_refill_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Refills Remaining</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.refills_remaining}
                      onChange={(e) => setFormData(prev => ({ ...prev, refills_remaining: e.target.value }))}
                      placeholder="3"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Take with food..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMedication} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Medication'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No medications added yet. Tap "Add" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {medications.map(med => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  expanded={expandedMedications.has(med.id)}
                  onToggle={() => toggleMedicationExpanded(med.id)}
                  onDelete={() => handleDeleteMedication(med.id)}
                  getMemberName={getMemberName}
                  isAdminOrModerator={isAdminOrModerator}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Dose Card Component
interface DoseCardProps {
  dose: MedicationDose;
  onMarkTaken: () => void;
  onSkip: (reason: string) => void;
  getMemberName: (id: string) => string;
  status: 'overdue' | 'upcoming' | 'completed' | 'skipped';
}

const DoseCard = ({ dose, onMarkTaken, onSkip, getMemberName, status }: DoseCardProps) => {
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const statusColors = {
    overdue: 'border-destructive/50 bg-destructive/5',
    upcoming: 'border-border',
    completed: 'border-success/50 bg-success/5',
    skipped: 'border-warning/50 bg-warning/5'
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          status === 'completed' ? 'bg-success/20' : 
          status === 'skipped' ? 'bg-warning/20' :
          status === 'overdue' ? 'bg-destructive/20' : 'bg-primary/20'
        }`}>
          {status === 'completed' ? (
            <Check className="h-5 w-5 text-success" />
          ) : status === 'skipped' ? (
            <X className="h-5 w-5 text-warning" />
          ) : (
            <Pill className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {dose.medication?.medication_name || 'Unknown Medication'}
            {dose.medication?.dosage && (
              <span className="text-muted-foreground font-normal"> - {dose.medication.dosage}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(dose.scheduled_at), 'h:mm a')}
            {dose.taken_at && ` • Taken at ${format(new Date(dose.taken_at), 'h:mm a')}`}
            {dose.skipped && dose.skip_reason && ` • Skipped: ${dose.skip_reason}`}
          </p>
        </div>
      </div>

      {(status === 'overdue' || status === 'upcoming') && (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowSkipDialog(true)}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onMarkTaken}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Dose</DialogTitle>
            <DialogDescription>
              Why is this dose being skipped?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="Enter reason (optional)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              onSkip(skipReason);
              setShowSkipDialog(false);
              setSkipReason('');
            }}>
              Skip Dose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Medication Card Component
interface MedicationCardProps {
  medication: Medication;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  getMemberName: (id: string) => string;
  isAdminOrModerator: boolean;
}

const MedicationCard = ({ medication, expanded, onToggle, onDelete, getMemberName, isAdminOrModerator }: MedicationCardProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <Pill className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium">{medication.medication_name}</p>
            <p className="text-xs text-muted-foreground">
              {medication.dosage && `${medication.dosage} • `}
              {medication.frequency}
              {medication.refills_remaining !== null && medication.refills_remaining <= 2 && (
                <Badge variant="destructive" className="ml-2 text-[10px]">
                  {medication.refills_remaining} refills left
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getMemberName(medication.user_id)}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="p-3 border-t bg-muted/30 space-y-3">
          {/* Schedule */}
          {medication.specific_times && medication.specific_times.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {medication.specific_times.map(t => {
                  const [h, m] = t.split(':');
                  const hour = parseInt(h);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const hour12 = hour % 12 || 12;
                  return `${hour12}:${m} ${ampm}`;
                }).join(', ')}
              </span>
            </div>
          )}

          {/* Pharmacy */}
          {medication.pharmacy_name && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{medication.pharmacy_name}</span>
              {medication.pharmacy_phone && (
                <a href={`tel:${medication.pharmacy_phone}`} className="text-primary text-sm hover:underline">
                  {medication.pharmacy_phone}
                </a>
              )}
            </div>
          )}

          {/* Doctor */}
          {medication.doctor_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{medication.doctor_name}</span>
              {medication.doctor_phone && (
                <a href={`tel:${medication.doctor_phone}`} className="text-primary text-sm hover:underline">
                  {medication.doctor_phone}
                </a>
              )}
            </div>
          )}

          {/* Refill info */}
          {medication.last_refill_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Last refill: {format(new Date(medication.last_refill_date), 'MMM d, yyyy')}
                {medication.refills_remaining !== null && ` • ${medication.refills_remaining} refills remaining`}
              </span>
            </div>
          )}

          {/* Instructions */}
          {medication.instructions && (
            <p className="text-sm text-muted-foreground italic">
              "{medication.instructions}"
            </p>
          )}

          {/* Label image */}
          {medication.label_image_url && (
            <a href={medication.label_image_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
              View Label Photo →
            </a>
          )}

          {/* Actions */}
          {isAdminOrModerator && (
            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4 mr-1" />
                Discontinue
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
