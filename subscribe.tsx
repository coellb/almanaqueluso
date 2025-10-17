// Referenced from javascript_stripe blueprint integration
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import type { SubscriptionPlan } from "@shared/subscriptionPlans";

// Load Stripe outside of component render
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn("VITE_STRIPE_PUBLIC_KEY not configured");
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

function CheckoutForm({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?subscription=success`,
      },
    });

    if (error) {
      toast({
        title: t('subscription.error'),
        description: error.message,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-checkout">
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/pricing")}
          className="flex-1"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-subscribe"
        >
          {isProcessing ? t('subscription.processing') : t('subscription.subscribe')}
        </Button>
      </div>
    </form>
  );
}

export default function Subscribe() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Get plan ID from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get("plan") || "premium";

  // Get plan details
  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  const plan = plans?.find((p) => p.id === planId);

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/create", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
      setLocation("/pricing");
    },
  });

  useEffect(() => {
    // Create subscription on mount
    createSubscription.mutate();
  }, []);

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Serviço Indisponível</CardTitle>
            <CardDescription>
              O sistema de pagamentos não está configurado. Por favor, contacte o suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/pricing")} className="w-full">
              Voltar aos Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || createSubscription.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">A preparar pagamento...</p>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card data-testid="card-subscribe">
          <CardHeader>
            <CardTitle data-testid="title-subscribe">
              Subscrever {plan?.name || "Premium"}
            </CardTitle>
            <CardDescription data-testid="desc-subscribe">
              Complete o seu pagamento de forma segura com Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Plan Details */}
            {plan && (
              <div className="mb-6 p-4 bg-muted rounded-lg" data-testid="plan-details">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">€{plan.price}</p>
                    <p className="text-sm text-muted-foreground">
                      /{plan.interval === 'year' ? 'ano' : 'mês'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stripe Payment Element */}
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm planId={planId} />
            </Elements>

            {/* Payment Methods Info */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Métodos de pagamento aceites:
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Cartão de Crédito/Débito, MB WAY, Multibanco
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
