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
  RefreshCw, Clock, Check, X, AlertTriangle, Trash2, Edit, ChevronDown, ChevronUp, ScanLine, Layers3, ShieldAlert
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isPast, addHours } from 'date-fns';
import { usePlatform } from '@/hooks/usePlatform';
import { AIProcessingNotice } from '@/components/AIProcessingNotice';
import { createStorageRef, resolveStorageUrl } from '@/lib/storageRefs';

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  prescriber_name?: string | null;
  prescriber_phone?: string | null;
  last_refill_date: string | null;
  refills_remaining: number | null;
  instructions: string | null;
  frequency: string | null;
  times_per_day: number;
  specific_times: string[] | null;
  label_image_url: string | null;
  label_image_urls?: string[] | null;
  label_analysis_confidence?: number | null;
  label_analysis_raw_text?: string | null;
  label_analysis_field_confidence?: Record<string, string> | null;
  label_capture_mode?: string | null;
  label_images_verified_at?: string | null;
  label_images_verified_by?: string | null;
  label_images_deleted_at?: string | null;
  label_images_deleted_by?: string | null;
  label_disclaimer_accepted_at?: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
  quantity_dispensed?: number | null;
  units_remaining?: number | null;
  unit_type?: string | null;
  doses_per_administration?: number | null;
  days_supply?: number | null;
  expected_runout_date?: string | null;
  refill_reminder_days?: number | null;
  risk_level?: string;
  is_prn?: boolean;
  max_daily_doses?: number | null;
  min_hours_between_doses?: number | null;
  out_of_medication_at?: string | null;
  last_inventory_reconciled_at?: string | null;
  inventory_notes?: string | null;
}

interface LabelAnalysisResult {
  confidence?: number;
  raw_text?: string;
  field_confidence?: Record<string, string>;
  review_flags?: string[];
}

interface MedicationDose {
  id: string;
  medication_id: string;
  scheduled_at: string;
  scheduled_time: string | null;
  taken_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  status?: string | null;
  confirmation_type?: string | null;
  inventory_delta?: number | null;
  taken_notes?: string | null;
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [captureMode, setCaptureMode] = useState<'bottle' | 'flat'>('bottle');
  const [labelImages, setLabelImages] = useState<string[]>([]);
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysDoses, setTodaysDoses] = useState<MedicationDose[]>([]);
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set());
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set());
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  // Form state
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [labelAnalysis, setLabelAnalysis] = useState<LabelAnalysisResult | null>(null);
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
    target_user_id: recoveringMemberId || '',
    quantity_dispensed: '',
    units_remaining: '',
    unit_type: 'tablets',
    doses_per_administration: '1',
    days_supply: '',
    refill_reminder_days: '7',
    low_supply_threshold: '',
    risk_level: 'standard',
    is_prn: false,
    max_daily_doses: '',
    min_hours_between_doses: '',
    inventory_notes: ''
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
      const resolvedMedications = await Promise.all((data || []).map(async (medication: any) => ({
        ...medication,
        label_image_url: await resolveStorageUrl(medication.label_image_url),
        label_image_urls: medication.label_image_urls
          ? await Promise.all((medication.label_image_urls as string[]).map((url: string) => resolveStorageUrl(url)))
          : [],
      })));

      setMedications(resolvedMedications);
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = '';

    const encodedImages = await Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    })));

    setLabelImages(prev => {
      const next = captureMode === 'flat' ? [encodedImages[0]] : [...prev, ...encodedImages].slice(0, 3);
      const primaryImage = next[0] || null;
      setLabelImage(primaryImage);
      analyzeLabelImages(next);
      return next;
    });
  };

  // Robust camera opening function with iOS/iPadOS fallback
  const openCamera = async () => {
    // Detect iOS/iPadOS - always use native file picker for reliability
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS || isNative) {
      // Use native camera picker which is more reliable on iOS/iPadOS and Capacitor
      cameraInputRef.current?.click();
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia not supported, falling back to file input');
      cameraInputRef.current?.click();
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera for labels
      });
      setCameraStream(mediaStream);
      setShowCameraPreview(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      // Fallback to file input with capture attribute
      cameraInputRef.current?.click();
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraPreview(false);
  };

  // Capture photo from video stream
  const captureFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        const nextImages = captureMode === 'flat' ? [base64] : [...labelImages, base64].slice(0, 3);
        setLabelImages(nextImages);
        setLabelImage(nextImages[0] || null);
        analyzeLabelImages(nextImages);
      } else {
        toast({
          title: 'Capture failed',
          description: 'Camera not ready. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const analyzeLabelImages = async (images: string[]) => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-medication-label', {
        body: {
          image: images[0],
          images,
          capture_mode: captureMode
        }
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
          frequency: data.frequency || prev.frequency,
          is_prn: (data.frequency || prev.frequency || '').toLowerCase() === 'as needed'
        }));

        setLabelAnalysis({
          confidence: data.confidence,
          raw_text: data.raw_text,
          field_confidence: data.field_confidence || {},
          review_flags: data.review_flags || []
        });

        const weakFields = Object.entries(data.field_confidence || {})
          .filter(([, value]) => value === 'low' || value === 'missing')
          .map(([key]) => key.replace(/_/g, ' '));

        toast({
          title: images.length > 1 ? 'Label images analyzed!' : 'Label analyzed!',
          description: weakFields.length > 0
            ? `Confidence: ${data.confidence}%. Please review: ${weakFields.join(', ')}.`
            : `Confidence: ${data.confidence}%. Please verify the extracted information.`
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

    if (!disclaimerAccepted) {
      toast({
        title: 'Acknowledge privacy notice',
        description: 'Please confirm the medication label disclaimer before saving.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Upload label image if present
      let labelImageUrl = null;
      const uploadedRefs: string[] = [];
      if (labelImages.length > 0) {

        for (const [index, image] of labelImages.entries()) {
          const fileName = `${familyId}/${Date.now()}-medication-label-${index + 1}.jpg`;
          const base64Data = image.split(',')[1];
          const { error: uploadError } = await supabase.storage
            .from('medication-labels')
            .upload(fileName, decode(base64Data), {
              contentType: 'image/jpeg'
            });

          if (!uploadError) {
            uploadedRefs.push(createStorageRef('medication-labels', fileName));
          }
        }

        labelImageUrl = uploadedRefs[0] || null;
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
          prescriber_name: formData.doctor_name || null,
          prescriber_phone: formData.doctor_phone || null,
          last_refill_date: formData.last_refill_date || null,
          refills_remaining: formData.refills_remaining ? parseInt(formData.refills_remaining) : null,
          instructions: formData.instructions || null,
          frequency: formData.frequency,
          times_per_day: formData.is_prn ? 0 : formData.times_per_day,
          specific_times: formData.is_prn ? [] : formData.specific_times,
          label_image_url: labelImageUrl,
          label_image_urls: uploadedRefs,
          label_analysis_confidence: labelAnalysis?.confidence ?? null,
          label_analysis_raw_text: labelAnalysis?.raw_text ?? null,
          label_analysis_field_confidence: {
            ...(labelAnalysis?.field_confidence ?? {}),
            ...Object.fromEntries(Array.from(correctedFields).map((field) => [field, 'corrected']))
          },
          label_capture_mode: captureMode,
          label_disclaimer_accepted_at: new Date().toISOString(),
          quantity_dispensed: formData.quantity_dispensed ? parseInt(formData.quantity_dispensed) : null,
          units_remaining: formData.units_remaining ? parseFloat(formData.units_remaining) : null,
          unit_type: formData.unit_type || null,
          doses_per_administration: formData.doses_per_administration ? parseFloat(formData.doses_per_administration) : 1,
          days_supply: formData.days_supply ? parseInt(formData.days_supply) : null,
          refill_reminder_days: formData.refill_reminder_days ? parseInt(formData.refill_reminder_days) : 7,
          low_supply_threshold: formData.low_supply_threshold ? parseInt(formData.low_supply_threshold) : null,
          risk_level: formData.risk_level,
          is_prn: formData.is_prn,
          max_daily_doses: formData.max_daily_doses ? parseInt(formData.max_daily_doses) : null,
          min_hours_between_doses: formData.min_hours_between_doses ? parseFloat(formData.min_hours_between_doses) : null,
          inventory_notes: formData.inventory_notes || null
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
    const dose = todaysDoses.find(d => d.id === doseId);
    const inventoryDelta = dose?.inventory_delta ?? dose?.medication?.doses_per_administration ?? 1;

    const { error } = await supabase
      .from('medication_doses')
      .update({
        taken_at: new Date().toISOString(),
        confirmed_by: currentUserId,
        confirmation_type: 'self',
        status: 'taken',
        inventory_delta: inventoryDelta
      })
      .eq('id', doseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark dose as taken.',
        variant: 'destructive'
      });
    } else {
      if (dose?.medication_id) {
        await (supabase.rpc as any)('recalculate_medication_inventory', { _medication_id: dose.medication_id });
      }
      toast({ title: 'Dose recorded!' });
      loadData();
    }
  };

  const handleSkipDose = async (doseId: string, reason: string) => {
    const { error } = await supabase
      .from('medication_doses')
      .update({
        skipped: true,
        skip_reason: reason,
        confirmed_by: currentUserId,
        status: reason.toLowerCase().includes('out') ? 'out_of_medication' : 'skipped'
      })
      .eq('id', doseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to skip dose.',
        variant: 'destructive'
      });
    } else {
      loadData();
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
      target_user_id: recoveringMemberId || '',
      quantity_dispensed: '',
      units_remaining: '',
      unit_type: 'tablets',
      doses_per_administration: '1',
      days_supply: '',
      refill_reminder_days: '7',
      low_supply_threshold: '',
      risk_level: 'standard',
      is_prn: false,
      max_daily_doses: '',
      min_hours_between_doses: '',
      inventory_notes: ''
    });
    setLabelImage(null);
    setLabelImages([]);
    setLabelAnalysis(null);
    setCorrectedFields(new Set());
    setCaptureMode('bottle');
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
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={captureMode === 'bottle' ? 'default' : 'outline'}
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => {
                        setCaptureMode('bottle');
                        setLabelImages([]);
                        setLabelImage(null);
                      }}
                    >
                      <Layers3 className="h-4 w-4" />
                      <div className="text-left">
                        <div>Bottle Mode</div>
                        <div className="text-xs opacity-80">Take 2 to 3 guided photos around the bottle</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={captureMode === 'flat' ? 'default' : 'outline'}
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => {
                        setCaptureMode('flat');
                        setLabelImages([]);
                        setLabelImage(null);
                      }}
                    >
                      <ScanLine className="h-4 w-4" />
                      <div className="text-left">
                        <div>Flat Label Mode</div>
                        <div className="text-xs opacity-80">Single photo for flat packaging or unfolded labels</div>
                      </div>
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {captureMode === 'bottle'
                      ? `Bottle Mode works best for skinny bottles. ${[
                          'Start with the medication name and strength.',
                          'Rotate right and capture the pharmacy and refill section.',
                          'Finish with prescriber and instructions if still hidden.'
                        ][Math.min(labelImages.length, 2)]}`
                      : 'Flat Label Mode is best when the full label fits in one clear shot.'}
                  </p>
                  <div className="mt-2 flex flex-col items-center gap-2">
                    {/* Camera Preview Mode */}
                    {showCameraPreview ? (
                      <div className="relative w-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full rounded-lg bg-muted"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                          <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            onClick={stopCamera}
                          >
                            <X className="h-5 w-5 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="lg"
                            onClick={captureFromVideo}
                          >
                            <Camera className="h-5 w-5 mr-1" />
                            Capture
                          </Button>
                        </div>
                      </div>
                    ) : labelImages.length > 0 ? (
                      <div className="relative w-full space-y-2">
                        <div className={`grid gap-2 ${labelImages.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                          {labelImages.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Medication label ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <span className="ml-2 text-white">Analyzing...</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {captureMode === 'bottle' && labelImages.length < 3 && (
                            <Button type="button" variant="outline" onClick={openCamera}>
                              <Camera className="h-4 w-4 mr-1" />
                              Add Another Angle
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setLabelImage(null);
                              setLabelImages([]);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear Photos
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 flex flex-col gap-2"
                        onClick={openCamera}
                      >
                        <Camera className="h-8 w-8" />
                        <span>{captureMode === 'bottle' ? 'Take Bottle Photo' : 'Take Photo of Label'}</span>
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple={captureMode === 'bottle'}
                      className="hidden"
                      onChange={handleImageCapture}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple={captureMode === 'bottle'}
                      className="hidden"
                      onChange={handleImageCapture}
                    />
                    {!showCameraPreview && labelImages.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-muted-foreground"
                      >
                        {captureMode === 'bottle' ? 'Or select 2 to 3 images from gallery' : 'Or select from gallery'}
                      </Button>
                    )}
                  </div>

                  <div className="mt-3 rounded-lg border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-600" />
                      <div>
                        <div className="font-medium text-foreground">Medication Label Disclaimer</div>
                        FamilyBridge stores medication label images only to extract and verify prescription details. This feature is organizational support only, not medical advice, diagnosis, pharmacy services, or medication-management direction. Only authorized users should upload or review these images, and source images should be deleted once verified unless retention is clearly necessary.
                      </div>
                    </div>
                    <label className="flex items-start gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={disclaimerAccepted}
                        onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>I understand this tool stores sensitive medication label information for verification only and should not be used as medical advice or a substitute for professional review.</span>
                    </label>
                    {labelAnalysis && (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">Label Review</div>
                          <Badge variant={labelAnalysis.confidence && labelAnalysis.confidence >= 85 ? 'default' : 'secondary'}>
                            {labelAnalysis.confidence ?? 0}% confidence
                          </Badge>
                        </div>
                        {labelAnalysis.review_flags && labelAnalysis.review_flags.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Review: {labelAnalysis.review_flags.join(' • ')}
                          </div>
                        )}
                        {labelAnalysis.field_confidence && Object.keys(labelAnalysis.field_confidence).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(labelAnalysis.field_confidence).map(([field, confidence]) => (
                              <Badge
                                key={field}
                                variant={correctedFields.has(field) ? 'default' : 'outline'}
                                className="text-[10px]"
                              >
                                {field.replace(/_/g, ' ')}: {correctedFields.has(field) ? 'corrected' : confidence}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <AIProcessingNotice
                      subject="medication label photos you upload for auto-fill"
                      className="mt-3 text-xs"
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
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('medication_name'));
                        setFormData(prev => ({ ...prev, medication_name: e.target.value }));
                      }}
                      placeholder="e.g., Lisinopril"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={formData.dosage}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('dosage'));
                        setFormData(prev => ({ ...prev, dosage: e.target.value }));
                      }}
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

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">PRN / As Needed</Label>
                    <p className="text-xs text-muted-foreground">Disable rigid missed-dose alerts for medications that are only taken when needed.</p>
                  </div>
                  <Button
                    type="button"
                    variant={formData.is_prn ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, is_prn: !prev.is_prn, frequency: !prev.is_prn ? 'as needed' : 'once daily' }))}
                  >
                    {formData.is_prn ? 'PRN Enabled' : 'Set PRN'}
                  </Button>
                </div>

                {!formData.is_prn && (
                  <>
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
                  </>
                )}

                {/* Pharmacy & Doctor Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pharmacy Name</Label>
                    <Input
                      value={formData.pharmacy_name}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('pharmacy_name'));
                        setFormData(prev => ({ ...prev, pharmacy_name: e.target.value }));
                      }}
                      placeholder="CVS, Walgreens..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Pharmacy Phone</Label>
                    <Input
                      value={formData.pharmacy_phone}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('pharmacy_phone'));
                        setFormData(prev => ({ ...prev, pharmacy_phone: e.target.value }));
                      }}
                      placeholder="555-123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doctor Name</Label>
                    <Input
                      value={formData.doctor_name}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('doctor_name'));
                        setFormData(prev => ({ ...prev, doctor_name: e.target.value }));
                      }}
                      placeholder="Dr. Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doctor Phone</Label>
                    <Input
                      value={formData.doctor_phone}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('doctor_phone'));
                        setFormData(prev => ({ ...prev, doctor_phone: e.target.value }));
                      }}
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
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('last_refill_date'));
                        setFormData(prev => ({ ...prev, last_refill_date: e.target.value }));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Refills Remaining</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.refills_remaining}
                      onChange={(e) => {
                        setCorrectedFields(prev => new Set(prev).add('refills_remaining'));
                        setFormData(prev => ({ ...prev, refills_remaining: e.target.value }));
                      }}
                      placeholder="3"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity Dispensed</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.quantity_dispensed}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity_dispensed: e.target.value, units_remaining: prev.units_remaining || e.target.value }))}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Units Remaining</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.units_remaining}
                      onChange={(e) => setFormData(prev => ({ ...prev, units_remaining: e.target.value }))}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Unit Type</Label>
                    <Input
                      value={formData.unit_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_type: e.target.value }))}
                      placeholder="tablets"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doses Per Administration</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.doses_per_administration}
                      onChange={(e) => setFormData(prev => ({ ...prev, doses_per_administration: e.target.value }))}
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Days Supply</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.days_supply}
                      onChange={(e) => setFormData(prev => ({ ...prev, days_supply: e.target.value }))}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Refill Reminder Days</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.refill_reminder_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, refill_reminder_days: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Low Supply Threshold</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.low_supply_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_supply_threshold: e.target.value }))}
                      placeholder="5"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Risk Level</Label>
                    <Select value={formData.risk_level} onValueChange={(v) => setFormData(prev => ({ ...prev, risk_level: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.is_prn && (
                    <>
                      <div>
                        <Label>Max Daily Doses</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.max_daily_doses}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_daily_doses: e.target.value }))}
                          placeholder="3"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Minimum Hours Between Doses</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.min_hours_between_doses}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_hours_between_doses: e.target.value }))}
                          placeholder="4"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
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

                <div>
                  <Label>Inventory Notes</Label>
                  <Textarea
                    value={formData.inventory_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_notes: e.target.value }))}
                    placeholder="Bottle count corrected, partial fill, lockbox note..."
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
                  actingUserId={currentUserId}
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
  actingUserId: string;
}

const MedicationCard = ({ medication, expanded, onToggle, onDelete, getMemberName, isAdminOrModerator, actingUserId }: MedicationCardProps) => {
  const handleVerifyAndDeleteImages = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isAdminOrModerator) return;

    const imageRefs = medication.label_image_urls && medication.label_image_urls.length > 0
      ? medication.label_image_urls
      : medication.label_image_url
        ? [medication.label_image_url]
        : [];

    if (imageRefs.length > 0) {
      const storagePaths = imageRefs
        .map((url) => {
          const match = url.match(/medication-labels\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter((value): value is string => Boolean(value));

      if (storagePaths.length > 0) {
        await supabase.storage.from('medication-labels').remove(storagePaths);
      }
    }

    await supabase
      .from('medications')
      .update({
        label_images_verified_at: new Date().toISOString(),
        label_images_verified_by: actingUserId,
        label_images_deleted_at: new Date().toISOString(),
        label_images_deleted_by: actingUserId,
        label_image_url: null,
        label_image_urls: []
      })
      .eq('id', medication.id);
  };

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
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span>
                {medication.dosage && `${medication.dosage} • `}
                {medication.is_prn ? 'As needed' : medication.frequency}
              </span>
              {medication.risk_level && medication.risk_level !== 'standard' && (
                <Badge variant="secondary" className="text-[10px] uppercase">{medication.risk_level}</Badge>
              )}
              {medication.refills_remaining !== null && medication.refills_remaining <= 2 && (
                <Badge variant="destructive" className="text-[10px]">
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
          {(medication.last_refill_date || medication.expected_runout_date || medication.units_remaining !== null) && (
            <div className="space-y-1">
              {medication.last_refill_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Last refill: {format(new Date(medication.last_refill_date), 'MMM d, yyyy')}
                    {medication.refills_remaining !== null && ` • ${medication.refills_remaining} refills remaining`}
                  </span>
                </div>
              )}
              {medication.expected_runout_date && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span>Expected runout: {format(new Date(medication.expected_runout_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {medication.units_remaining !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span>{medication.units_remaining} {medication.unit_type || 'units'} remaining</span>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {medication.instructions && (
            <p className="text-sm text-muted-foreground italic">
              "{medication.instructions}"
            </p>
          )}

          {medication.inventory_notes && (
            <p className="text-xs text-muted-foreground">
              Inventory note: {medication.inventory_notes}
            </p>
          )}

          {/* Label images */}
          {((medication.label_image_urls && medication.label_image_urls.length > 0) || medication.label_image_url || medication.label_images_verified_at) && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(medication.label_image_urls && medication.label_image_urls.length > 0
                  ? medication.label_image_urls
                  : medication.label_image_url
                    ? [medication.label_image_url]
                    : []
                ).map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    View Label Photo {index + 1} →
                  </a>
                ))}
              </div>
              {(medication.label_analysis_confidence !== null && medication.label_analysis_confidence !== undefined) && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>OCR confidence: {medication.label_analysis_confidence}%</span>
                  {medication.label_capture_mode && <span>Capture mode: {medication.label_capture_mode}</span>}
                  {medication.label_images_verified_at && <span>Verified: {format(new Date(medication.label_images_verified_at), 'MMM d, yyyy')}</span>}
                  {medication.label_images_deleted_at && <span>Source images deleted</span>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {isAdminOrModerator && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              {((medication.label_image_urls && medication.label_image_urls.length > 0) || medication.label_image_url) && (
                <Button size="sm" variant="outline" onClick={handleVerifyAndDeleteImages}>
                  <Check className="h-4 w-4 mr-1" />
                  Verify + Delete Images
                </Button>
              )}
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
