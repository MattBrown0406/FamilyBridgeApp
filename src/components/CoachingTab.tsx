import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import {
  Mic, MicOff, Phone, MessageSquare, Image, Upload, Send, Loader2,
  AlertTriangle, Copy, CheckCircle, X, Brain, PhoneCall, Camera, Users
} from 'lucide-react';

interface CoachingTabProps {
  familyId: string;
  members?: Array<{ user_id: string; full_name: string }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ScreenshotAnalysis {
  conversation_summary: string;
  emotional_dynamics: string;
  suggested_responses: { response: string; approach: string; when_to_use: string }[];
  warning_signs?: string[];
  coaching_tip: string;
}

export const CoachingTab = ({ familyId, members = [] }: CoachingTabProps) => {
  const { toast } = useToast();

  // Talking to state
  const [talkingToUserId, setTalkingToUserId] = useState<string>('');
  const [talkingToCustomName, setTalkingToCustomName] = useState('');

  // Live coaching state
  const [isListening, setIsListening] = useState(false);
  const [liveMode, setLiveMode] = useState<'speakerphone' | 'text'>('text');
  const [liveInput, setLiveInput] = useState('');
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveStreamText, setLiveStreamText] = useState('');
  const recognitionRef = useRef<any>(null);
  const [transcribedText, setTranscribedText] = useState('');

  // Screenshot coaching state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [screenshotAnalysis, setScreenshotAnalysis] = useState<ScreenshotAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveScrollRef.current) {
      liveScrollRef.current.scrollTop = liveScrollRef.current.scrollHeight;
    }
  }, [liveMessages, liveStreamText]);

  const getTalkingToName = (): string => {
    if (talkingToUserId === '__custom__') return talkingToCustomName || 'someone';
    if (talkingToUserId) {
      const member = members.find(m => m.user_id === talkingToUserId);
      return member?.full_name || 'a family member';
    }
    return '';
  };

  // Speech recognition for speakerphone mode
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setTranscribedText(prev => prev + finalTranscript);
      }
      setLiveInput(prev => {
        const base = prev.replace(/\[listening\.\.\.\].*$/, '');
        return (base + finalTranscript + (interimTranscript ? `[listening...] ${interimTranscript}` : '')).trim();
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast({ title: "Listening error", description: `Speech recognition error: ${event.error}`, variant: "destructive" });
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLiveInput(prev => prev.replace(/\[listening\.\.\.\].*$/, '').trim());
  }, []);

  // Send live coaching request (streaming)
  const sendLiveCoaching = async () => {
    const text = liveMode === 'speakerphone' ? transcribedText : liveInput;
    if (!text.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setLiveMessages(prev => [...prev, userMessage]);
    setLiveInput('');
    setTranscribedText('');
    setIsLiveLoading(true);
    setLiveStreamText('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const talkingTo = getTalkingToName();

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-coaching`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            familyId,
            transcript: text.trim(),
            context: liveMode === 'speakerphone' ? 'phone' : 'text',
            chatHistory: liveMessages.slice(-10),
            talkingToName: talkingTo,
            talkingToUserId: talkingToUserId && talkingToUserId !== '__custom__' ? talkingToUserId : undefined,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setLiveStreamText(assistantText);
            }
          } catch { /* partial chunk */ }
        }
      }

      if (assistantText) {
        setLiveMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
      }
      setLiveStreamText('');
    } catch (error: any) {
      toast({ title: 'Coaching error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Screenshot analysis
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    setScreenshotFile(file);
    setScreenshotAnalysis(null);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeScreenshot = async () => {
    if (!screenshotFile) return;
    setIsAnalyzing(true);
    setScreenshotAnalysis(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const arrayBuffer = await screenshotFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const talkingTo = getTalkingToName();

      const { data, error } = await supabase.functions.invoke('screenshot-coaching', {
        body: {
          familyId,
          imageBase64: base64,
          additionalContext,
          talkingToName: talkingTo,
          talkingToUserId: talkingToUserId && talkingToUserId !== '__custom__' ? talkingToUserId : undefined,
        },
      });

      if (error) throw error;
      setScreenshotAnalysis(data as ScreenshotAnalysis);
    } catch (error: any) {
      toast({ title: 'Analysis error', description: error.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyResponse = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied!', description: 'Response copied to clipboard' });
  };

  return (
    <div className="space-y-4">
      {/* Feature intro */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">FIIS Live Coaching</p>
              <p className="text-xs text-muted-foreground mt-1">
                Get real-time coaching from FIIS during conversations with family members or loved ones. 
                Use speakerphone mode during calls or type what they're saying for text-based coaching.
                Coaching insights are factored into FIIS analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Who are you talking to? */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Who are you talking to?</span>
          </div>
          <Select value={talkingToUserId} onValueChange={(val) => { setTalkingToUserId(val); if (val !== '__custom__') setTalkingToCustomName(''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a person..." />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.full_name}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">Someone not in the app...</SelectItem>
            </SelectContent>
          </Select>
          {talkingToUserId === '__custom__' && (
            <input
              type="text"
              value={talkingToCustomName}
              onChange={(e) => setTalkingToCustomName(e.target.value)}
              placeholder="Enter their name..."
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            <span>Live Coaching</span>
          </TabsTrigger>
          <TabsTrigger value="screenshot" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Text Screenshots</span>
          </TabsTrigger>
        </TabsList>

        {/* Live Coaching Tab */}
        <TabsContent value="live" className="space-y-4 mt-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={liveMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setLiveMode('text'); stopListening(); }}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Type What They Say
            </Button>
            <Button
              variant={liveMode === 'speakerphone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLiveMode('speakerphone')}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Speakerphone
            </Button>
          </div>

          {/* Speakerphone controls */}
          {liveMode === 'speakerphone' && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isListening ? (
                      <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
                    ) : (
                      <div className="h-3 w-3 bg-muted rounded-full" />
                    )}
                    <span className="text-sm font-medium">
                      {isListening ? 'Listening... Put phone on speaker' : 'Ready to listen'}
                    </span>
                  </div>
                  <Button
                    variant={isListening ? 'destructive' : 'default'}
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                  >
                    {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                    {isListening ? 'Stop' : 'Start Listening'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Put your phone on speaker and tap Start. FIIS will transcribe the conversation and provide coaching in real-time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chat area */}
          <Card className="flex flex-col" style={{ minHeight: '300px' }}>
            <ScrollArea className="flex-1 p-4" ref={liveScrollRef} style={{ maxHeight: '400px' }}>
              {liveMessages.length === 0 && !liveStreamText && (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {liveMode === 'text'
                      ? 'Type what they\'re saying and FIIS will coach you on how to respond.'
                      : 'Start listening and FIIS will provide coaching suggestions as the conversation progresses.'}
                  </p>
                </div>
              )}
              {liveMessages.map((msg, i) => (
                <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.role === 'user' ? 'You' : 'FIIS Coach'}
                  </p>
                </div>
              ))}
              {liveStreamText && (
                <div className="mb-4">
                  <div className="inline-block max-w-[85%] rounded-lg p-3 text-sm bg-muted">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{liveStreamText}</ReactMarkdown>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">FIIS Coach</p>
                </div>
              )}
              {isLiveLoading && !liveStreamText && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">FIIS is thinking...</span>
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-3 flex gap-2">
              <Textarea
                value={liveInput}
                onChange={(e) => setLiveInput(e.target.value)}
                placeholder={liveMode === 'text' 
                  ? 'Type what they said or what\'s happening...' 
                  : 'Transcribed speech will appear here...'}
                className="min-h-[40px] max-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendLiveCoaching();
                  }
                }}
              />
              <Button
                onClick={sendLiveCoaching}
                disabled={isLiveLoading || !(liveMode === 'speakerphone' ? transcribedText : liveInput).trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Screenshot Coaching Tab */}
        <TabsContent value="screenshot" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                Upload Text Conversation Screenshot
              </CardTitle>
              <CardDescription>
                Upload a screenshot of your text conversation and FIIS will analyze it and suggest how to respond.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotUpload}
                accept="image/*"
                className="hidden"
              />

              {!screenshotPreview ? (
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed border-2 flex flex-col items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Tap to upload screenshot
                  </span>
                </Button>
              ) : (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full max-h-96 object-contain rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                      setScreenshotAnalysis(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Add any context (optional): e.g., 'They just got out of rehab 2 weeks ago' or 'They've been avoiding my calls'"
                className="min-h-[60px]"
              />

              <Button
                onClick={analyzeScreenshot}
                disabled={!screenshotFile || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing conversation...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Get Coaching Suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis results */}
          {screenshotAnalysis && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Conversation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{screenshotAnalysis.conversation_summary}</p>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Emotional Dynamics</p>
                    <p className="text-sm">{screenshotAnalysis.emotional_dynamics}</p>
                  </div>
                </CardContent>
              </Card>

              {screenshotAnalysis.warning_signs && screenshotAnalysis.warning_signs.length > 0 && (
                <Card className="border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold">Warning Signs</span>
                    </div>
                    <ul className="space-y-1">
                      {screenshotAnalysis.warning_signs.map((sign, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Suggested Responses</CardTitle>
                  <CardDescription>Tap to copy any response to your clipboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {screenshotAnalysis.suggested_responses.map((suggestion, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => copyResponse(suggestion.response, i)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {suggestion.approach}
                          </Badge>
                          <p className="text-sm font-medium">{suggestion.response}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Best when: {suggestion.when_to_use}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                          {copiedIndex === i ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary">Coaching Tip</p>
                      <p className="text-sm mt-1">{screenshotAnalysis.coaching_tip}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
