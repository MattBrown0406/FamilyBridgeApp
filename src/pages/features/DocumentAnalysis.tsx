import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, ShieldCheck, BookOpen, Scan, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';

const extractionDemo = [
  { type: 'Boundary', text: '"I will no longer provide money for rent if Tyler is not attending outpatient treatment."', author: 'Linda (Mother)', confidence: '94%' },
  { type: 'Boundary', text: '"Tyler is not welcome to stay at my house if he is actively using substances."', author: 'Robert (Father)', confidence: '97%' },
  { type: 'Commitment', text: '"I commit to attending Al-Anon meetings weekly regardless of Tyler\'s behavior."', author: 'Sarah (Sister)', confidence: '91%' },
  { type: 'Consequence', text: '"If Tyler refuses treatment, I will not co-sign any financial obligations."', author: 'Kevin (Brother)', confidence: '89%' },
];

const features = [
  { icon: Scan, title: 'AI-Powered Extraction', description: 'FIIS reads uploaded intervention letters and automatically identifies boundaries, commitments, consequences, and action items — with confidence scoring for each extraction.' },
  { icon: ShieldCheck, title: 'Boundary Tracking', description: 'Extracted boundaries are automatically added to the family\'s boundary tracker, enabling automated compliance monitoring and enforcement alerts.' },
  { icon: BookOpen, title: 'Aftercare Plan Analysis', description: 'Upload aftercare documents from treatment facilities. FIIS parses treatment recommendations, follow-up schedules, and medication protocols.' },
  { icon: Upload, title: 'Multi-Format Support', description: 'Accepts PDFs, Word documents, images of handwritten letters, and text uploads. AI handles formatting inconsistencies and handwriting recognition.' },
];

const DocumentAnalysis = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Smart Document Analysis | FamilyBridge" description="AI-powered document analysis that extracts boundaries, commitments, and action items from intervention letters and aftercare plans." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Smart Document Analysis</h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Smart Document Analysis</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload intervention letters and aftercare plans. FIIS automatically extracts boundaries, commitments, and consequences — turning static documents into actionable, trackable items.
            </p>
          </div>

          {/* Demo extraction */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Intervention Letter Extraction</h2>
              <p className="text-sm text-muted-foreground mb-4">Sample extractions from an uploaded family intervention letter</p>
              <div className="space-y-3">
                {extractionDemo.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">by {item.author}</span>
                        <Badge variant="outline" className="text-xs ml-auto">{item.confidence} confidence</Badge>
                      </div>
                      <p className="text-sm text-foreground/80 italic">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Key Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">See It in Action</h2>
              <p className="text-sm text-muted-foreground">Explore how FIIS processes real intervention letters in the provider demo.</p>
              <Button onClick={() => navigate('/demo/provider')} className="gap-2">View Provider Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default DocumentAnalysis;
