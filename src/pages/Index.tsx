import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Shield, Users, DollarSign, MessageCircle, Eye, MapPin, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: MessageCircle,
      title: 'Safe Communication',
      description: 'Moderated messaging that filters harmful language.',
    },
    {
      icon: Shield,
      title: 'Content Protection',
      description: 'Automatic profanity and abuse filtering.',
    },
    {
      icon: Eye,
      title: 'Professional Oversight',
      description: 'Designated moderators can monitor conversations.',
    },
    {
      icon: Users,
      title: 'Family Unity',
      description: 'Private family groups for connection and accountability.',
    },
    {
      icon: DollarSign,
      title: 'Financial Transparency',
      description: 'Group-approved financial requests.',
    },
    {
      icon: Heart,
      title: 'Recovery Support',
      description: 'Built to help families navigate recovery together.',
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            Healing Starts with{' '}
            <span className="text-primary">Connection</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A safe space for families affected by addiction to communicate, 
            set boundaries, and support their loved ones on the path to recovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={() => navigate('/auth?mode=signup')}>
              Start Your Journey
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Already a Member
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Tools for Recovery
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything your family needs for healthy communication and accountability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Finder Link */}
      <section className="container mx-auto px-4 py-10">
        <div 
          className="max-w-3xl mx-auto bg-secondary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/meetings')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Find a Recovery Meeting
              </h3>
              <p className="text-sm text-muted-foreground">
                Search for AA, NA, and other 12-step meetings near you
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Find Meetings
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-8 md:p-12 shadow-elevated">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            Your Family's Recovery Starts Here
          </h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            Join families rebuilding trust through transparent, moderated communication.
          </p>
          <Button 
            size="lg" 
            className="bg-card text-primary hover:bg-card/90 shadow-elevated"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Create Your Family Group
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 FamilyBridge. Supporting families on the path to recovery.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
