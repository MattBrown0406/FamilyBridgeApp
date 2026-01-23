import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, Paperclip, X, Loader2, CheckCircle, AlertTriangle, 
  RefreshCw, ImageIcon, Sparkles 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BillReceiptCaptureProps {
  onImageCapture: (file: File, preview: string) => void;
  onClear: () => void;
  preview: string | null;
  requestCategory?: string; // The category of the financial request (e.g., "Gas", "Utilities", "Food")
}

interface ClarityResult {
  isAcceptable: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  categoryMatch?: {
    matches: boolean;
    detectedType: string;
    expectedType: string;
    confidence: number;
  };
}

export const BillReceiptCapture = ({ 
  onImageCapture, 
  onClear, 
  preview,
  requestCategory 
}: BillReceiptCaptureProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clarityResult, setClarityResult] = useState<ClarityResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Analyze image clarity using AI
  const analyzeImageClarity = async (imageBase64: string): Promise<ClarityResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image-clarity', {
        body: { 
          image: imageBase64,
          expectedCategory: requestCategory 
        }
      });

      if (error) throw error;
      return data as ClarityResult;
    } catch (error) {
      console.error('Clarity analysis error:', error);
      // Fallback to basic analysis if edge function fails
      return performBasicClarityCheck(imageBase64);
    }
  };

  // Basic client-side clarity check as fallback
  const performBasicClarityCheck = (imageBase64: string): Promise<ClarityResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({
            isAcceptable: true,
            score: 70,
            issues: [],
            suggestions: ['Could not perform detailed analysis']
          });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate basic image metrics
        let totalBrightness = 0;
        let variance = 0;
        const pixelCount = data.length / 4;

        // Calculate average brightness
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
        }
        const avgBrightness = totalBrightness / pixelCount;

        // Calculate variance (indicator of contrast/sharpness)
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          variance += Math.pow(brightness - avgBrightness, 2);
        }
        const stdDev = Math.sqrt(variance / pixelCount);

        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Check for too dark
        if (avgBrightness < 50) {
          issues.push('Image appears too dark');
          suggestions.push('Try taking the photo with better lighting');
          score -= 30;
        } else if (avgBrightness > 230) {
          issues.push('Image appears overexposed');
          suggestions.push('Reduce brightness or avoid direct light');
          score -= 25;
        }

        // Check for low contrast (blurry indicator)
        if (stdDev < 30) {
          issues.push('Image may be blurry or lack detail');
          suggestions.push('Hold the camera steady and ensure focus');
          score -= 35;
        }

        // Check resolution
        if (img.width < 640 || img.height < 480) {
          issues.push('Image resolution is low');
          suggestions.push('Get closer to the document or use higher quality');
          score -= 20;
        }

        resolve({
          isAcceptable: score >= 60,
          score: Math.max(0, Math.min(100, score)),
          issues,
          suggestions
        });
      };

      img.onerror = () => {
        resolve({
          isAcceptable: false,
          score: 0,
          issues: ['Failed to load image'],
          suggestions: ['Please try again with a different image']
        });
      };

      img.src = imageBase64;
    });
  };

  // Process and analyze image
  const processImage = async (file: File) => {
    setIsAnalyzing(true);
    setClarityResult(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB.',
          variant: 'destructive',
        });
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setCapturedImage(base64);
        setPendingFile(file);

        // Analyze clarity
        const result = await analyzeImageClarity(base64);
        setClarityResult(result);
        setIsAnalyzing(false);

        if (result.isAcceptable) {
          toast({
            title: 'Image quality acceptable',
            description: `Quality score: ${result.score}%`,
          });
        } else {
          toast({
            title: 'Image quality issues detected',
            description: result.issues.join('. '),
            variant: 'destructive',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsAnalyzing(false);
      toast({
        title: 'Error',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle file selection from gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  // Handle camera capture (mobile)
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  // Start camera stream (for in-browser camera)
  const startCamera = async () => {
    // On iOS/iPadOS, always use the native file input with capture attribute
    // This is more reliable and avoids crashes with getUserMedia on some devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // Use native camera picker which is more reliable on iOS/iPadOS
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
        video: { facingMode: 'environment' } // Use back camera
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      // Fallback to file input with capture
      cameraInputRef.current?.click();
    }
  };

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  // Capture photo from video stream
  const captureFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            processImage(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Accept the analyzed image
  const acceptImage = () => {
    if (pendingFile && capturedImage) {
      onImageCapture(pendingFile, capturedImage);
      setCapturedImage(null);
      setPendingFile(null);
      setClarityResult(null);
    }
  };

  // Retake/clear the captured image
  const retakeImage = () => {
    setCapturedImage(null);
    setPendingFile(null);
    setClarityResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Clear accepted image
  const handleClear = () => {
    retakeImage();
    onClear();
  };

  // If we have an accepted preview, show it
  if (preview) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Bill/Receipt Photo (recommended for utilities)
        </Label>
        <div className="relative">
          <img
            src={preview}
            alt="Bill preview"
            className="w-full max-h-48 object-contain rounded-lg border border-border"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Image quality verified and ready to submit.
        </p>
      </div>
    );
  }

  // Show camera view
  if (showCamera) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Bill/Receipt Photo (recommended for utilities)
        </Label>
        <Card className="relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
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
              className="bg-white text-black hover:bg-gray-100"
            >
              <Camera className="h-5 w-5 mr-1" />
              Capture
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show captured image for review
  if (capturedImage) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Bill/Receipt Photo (recommended for utilities)
        </Label>
        <div className="relative">
          <img
            src={capturedImage}
            alt="Captured preview"
            className="w-full max-h-48 object-contain rounded-lg border border-border"
          />
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  AI analyzing image quality{requestCategory ? ` & verifying ${requestCategory} receipt` : ''}...
                </p>
              </div>
            </div>
          )}
        </div>

        {clarityResult && (
          <div className={`mt-3 p-3 rounded-lg border ${
            clarityResult.isAcceptable 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {clarityResult.isAcceptable ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={`font-medium ${
                clarityResult.isAcceptable 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                Quality Score: {clarityResult.score}%
              </span>
            </div>

            {/* Category Match Result */}
            {clarityResult.categoryMatch && (
              <div className={`mb-2 p-2 rounded ${
                clarityResult.categoryMatch.matches 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  {clarityResult.categoryMatch.matches ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={clarityResult.categoryMatch.matches 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                  }>
                    {clarityResult.categoryMatch.matches 
                      ? `✓ Receipt matches ${clarityResult.categoryMatch.expectedType} request`
                      : `⚠ Expected ${clarityResult.categoryMatch.expectedType} receipt, detected: ${clarityResult.categoryMatch.detectedType}`
                    }
                  </span>
                </div>
                {clarityResult.categoryMatch.confidence > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(clarityResult.categoryMatch.confidence)}%
                  </p>
                )}
              </div>
            )}
            
            {clarityResult.issues.length > 0 && (
              <ul className="text-sm text-muted-foreground space-y-1 mb-2">
                {clarityResult.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span> {issue}
                  </li>
                ))}
              </ul>
            )}
            
            {clarityResult.suggestions.length > 0 && !clarityResult.isAcceptable && (
              <p className="text-xs text-muted-foreground italic">
                Tip: {clarityResult.suggestions[0]}
              </p>
            )}
          </div>
        )}

        {clarityResult && (
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={retakeImage}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retake
            </Button>
            {clarityResult.isAcceptable ? (
              <Button
                type="button"
                className="flex-1"
                onClick={acceptImage}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Use This Photo
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={acceptImage}
              >
                Use Anyway
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default state - show capture options
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-2 block">
        Bill/Receipt Photo (recommended for utilities)
      </Label>
      
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex flex-col items-center py-4 h-auto"
          onClick={startCamera}
        >
          <Camera className="h-6 w-6 mb-1 text-primary" />
          <span className="text-xs">Take Photo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex flex-col items-center py-4 h-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-6 w-6 mb-1 text-primary" />
          <span className="text-xs">From Gallery</span>
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        AI will check image clarity{requestCategory ? ` & verify it matches your ${requestCategory} request` : ''} before upload
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Include a photo showing the account name, number, and amount due.
      </p>
    </div>
  );
};
