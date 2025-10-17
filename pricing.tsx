// Referenced from javascript_stripe blueprint integration
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { SubscriptionPlan } from "@shared/subscriptionPlans";

interface SubscriptionStatus {
  plan: string;
  status: string;
  stripeSubscription: any;
  isPremium: boolean;
}

export default function Pricing() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    enabled: !!user,
  });

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      setLocation('/login');
      return;
    }

    if (planId === 'free') {
      return; // Already on free plan
    }

    setLocation(`/subscribe?plan=${planId}`);
  };

  const isCurrentPlan = (planId: string) => {
    return subscriptionStatus?.plan === planId;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-pricing">
            {t('pricing.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Special One-Time Payment Offer */}
        {user && !subscriptionStatus?.isPremium && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-lifetime-offer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className="mb-2" data-testid="badge-special-offer">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Oferta Especial
                    </Badge>
                    <CardTitle className="text-3xl mb-2">Acesso Premium Vitalício</CardTitle>
                    <CardDescription className="text-base">
                      Pague uma vez, tenha acesso para sempre a todas as funcionalidades premium
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-primary">€0.99</div>
                    <p className="text-sm text-muted-foreground">pagamento único</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium mb-3">Incluído:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Todas as funcionalidades premium
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Marés e eventos desportivos
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Calendário agrícola completo
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-3">Benefícios:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Sem mensalidades
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Acesso vitalício
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        Sem anúncios
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setLocation('/payment')}
                  data-testid="button-lifetime-payment"
                >
                  Obter Acesso Vitalício - €0.99
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`relative hover-elevate ${
                plan.popular ? 'border-primary shadow-lg' : ''
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 flex items-center gap-1" data-testid="badge-popular">
                    <Sparkles className="w-3 h-3" />
                    {t('pricing.premium.popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl" data-testid={`title-plan-${plan.id}`}>
                  {plan.name}
                </CardTitle>
                <CardDescription data-testid={`desc-plan-${plan.id}`}>
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold" data-testid={`price-plan-${plan.id}`}>
                    {plan.price === 0 ? t('pricing.free.price') : `€${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">
                      /{plan.interval === 'year' ? t('pricing.yearly') : t('pricing.monthly')}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2"
                      data-testid={`feature-${plan.id}-${index}`}
                    >
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  {isCurrentPlan(plan.id)
                    ? t('pricing.cta.current')
                    : plan.price === 0
                    ? t('pricing.cta.choose')
                    : t('pricing.cta.upgrade')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Methods Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Pagamento seguro com Stripe
          </p>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Cartão de Crédito
            </Badge>
            <Badge variant="outline" className="text-xs">
              MB WAY
            </Badge>
            <Badge variant="outline" className="text-xs">
              Multibanco
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cancele a qualquer momento. Sem taxas escondidas.
          </p>
        </div>
      </div>
    </div>
  );
}
