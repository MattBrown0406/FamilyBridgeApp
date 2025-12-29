import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInAppPurchases, PRODUCT_IDS } from '@/hooks/useInAppPurchases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ArrowLeft, Check, Loader2, Crown, RefreshCw, Settings } from 'lucide-react';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isReady,
    isLoading,
    isNativePlatform,
    products,
    activeSubscription,
    error,
    purchase,
    restorePurchases,
    manageSubscription,
  } = useInAppPurchases();

  const features = [
    'Unlimited family groups',
    'Priority support',
    'Advanced financial tracking',
    'Extended message history',
    'Custom meeting reminders',
    'Ad-free experience',
  ];

  if (!isNativePlatform) {
    return (
      <div className="min-h-screen bg-background">
        <header className="container mx-auto px-4 py-4 border-b border-border">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
              <Heart className="h-7 w-7 text-primary" />
              <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="shadow-elevated text-center">
            <CardHeader>
              <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-display">Premium Subscriptions</CardTitle>
              <CardDescription className="text-base">
                Premium subscriptions are available in our mobile app. Download FamilyBridge from the App Store or Google Play to subscribe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 rounded-lg p-4 mb-6">
                <h4 className="font-display font-semibold mb-3">Premium Features Include:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="hero" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-4 border-b border-border">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {activeSubscription && (
          <Card className="shadow-elevated mb-6 border-primary">
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-2">Active Subscription</Badge>
              <CardTitle className="text-xl font-display flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Premium Member
              </CardTitle>
              <CardDescription>
                You have an active subscription. Thank you for supporting FamilyBridge!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={manageSubscription}>
                <Settings className="h-4 w-4 mr-1" />
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-display">Upgrade to Premium</CardTitle>
            <CardDescription className="text-base">
              Unlock all features and support families on their recovery journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-display font-semibold mb-3">What you get:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Products */}
            {isReady && !isLoading && (
              <div className="space-y-4">
                {products.length > 0 ? (
                  products.map((product) => (
                    <Card 
                      key={product.id} 
                      className={`cursor-pointer transition-all ${
                        activeSubscription === product.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-semibold">{product.title}</h3>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-lg">{product.price}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.id.includes('yearly') ? 'per year' : 'per month'}
                            </p>
                          </div>
                        </div>
                        {activeSubscription !== product.id && (
                          <Button 
                            variant="hero" 
                            className="w-full mt-4"
                            onClick={() => purchase(product.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Subscribe
                          </Button>
                        )}
                        {activeSubscription === product.id && (
                          <Badge className="mt-4">Current Plan</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Loading subscription options...</p>
                  </div>
                )}

                {/* Fallback if products aren't loaded yet */}
                {products.length === 0 && !error && (
                  <div className="space-y-4">
                    <Card className="cursor-pointer hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-semibold">Monthly Plan</h3>
                            <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-lg">$4.99</p>
                            <p className="text-xs text-muted-foreground">per month</p>
                          </div>
                        </div>
                        <Button 
                          variant="hero" 
                          className="w-full mt-4"
                          onClick={() => purchase(PRODUCT_IDS.MONTHLY_SUBSCRIPTION)}
                          disabled={isLoading}
                        >
                          Subscribe
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:border-primary/50 transition-all border-primary">
                      <CardContent className="p-4">
                        <Badge className="mb-2">Best Value</Badge>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-semibold">Yearly Plan</h3>
                            <p className="text-sm text-muted-foreground">Save 17% with annual billing</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-lg">$49.99</p>
                            <p className="text-xs text-muted-foreground">per year</p>
                          </div>
                        </div>
                        <Button 
                          variant="hero" 
                          className="w-full mt-4"
                          onClick={() => purchase(PRODUCT_IDS.YEARLY_SUBSCRIPTION)}
                          disabled={isLoading}
                        >
                          Subscribe
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Restore Purchases */}
            <div className="text-center pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={restorePurchases}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Restore Purchases
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Already subscribed? Restore your purchase to unlock premium features.
              </p>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              Payment will be charged to your Apple ID or Google account. 
              Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Subscription;
