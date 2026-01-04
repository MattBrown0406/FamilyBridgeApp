import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MeetingFinder } from '@/components/MeetingFinder';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const Meetings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 border-b border-border">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 w-auto object-contain" />
              <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={() => navigate('/auth?mode=signup')}>
            Get Started
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Find a Recovery Meeting
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Search for AA, Al-Anon, and other recovery meetings. Connect with a supportive community.
            </p>
          </div>
          <MeetingFinder />
        </div>
      </main>
    </div>
  );
};

export default Meetings;
