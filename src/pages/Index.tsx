import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Shield, Users, DollarSign, MessageCircle, Eye } from 'lucide-react';
import { MeetingFinder } from '@/components/MeetingFinder';

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
      description: 'Moderated messaging that filters harmful language, ensuring respectful conversations.',
    },
    {
      icon: Shield,
      title: 'Content Protection',
      description: 'Automatic profanity and abuse filtering keeps communication healthy and supportive.',
    },
    {
      icon: Eye,
      title: 'Professional Oversight',
      description: 'Designated moderators can monitor conversations and provide guidance.',
    },
    {
      icon: Users,
      title: 'Family Unity',
      description: 'Create private family groups where everyone stays connected and accountable.',
    },
    {
      icon: DollarSign,
      title: 'Financial Transparency',
      description: 'Group-approved financial requests prevent secret money exchanges.',
    },
    {
      icon: Heart,
      title: 'Recovery Support',
      description: 'Built with love to help families navigate the journey to recovery together.',
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Healing Starts with{' '}
            <span className="text-primary">Connection</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            A safe space for families affected by addiction to communicate, 
            set boundaries, and support their loved ones on the path to recovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate('/auth?mode=signup')}>
              Start Your Journey
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate('/auth')}>
              Already a Member
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Tools for Recovery
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything your family needs to maintain healthy communication and accountability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Finder Section */}
      <section className="container mx-auto px-4 py-20 bg-secondary/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Find a Recovery Meeting
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Search for AA, NA, and other 12-step meetings near you. Connect with a supportive community.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <MeetingFinder />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-primary rounded-3xl p-12 md:p-16 shadow-elevated">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
            Your Family's Recovery Starts Here
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of families who are rebuilding trust and supporting 
            their loved ones through transparent, moderated communication.
          </p>
          <Button 
            size="xl" 
            className="bg-card text-primary hover:bg-card/90 shadow-elevated"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Create Your Family Group
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
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
