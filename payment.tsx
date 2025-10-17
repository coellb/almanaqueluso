import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check } from "lucide-react";

interface PaymentInfo {
  price: number;
  currency: string;
  description: string;
  features: string[];
}

function CheckoutForm() {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return; // Still loading
    }

    setIsProcessing(true);

    try {
      // Submit the form to trigger validation
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast({
          title: "Erro de Validação",
          description: submitError.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast({
        title: "Erro no Pagamento",
        description: err.message || "Ocorreu um erro ao processar o pagamento",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-payment">
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/pricing")}
          className="flex-1"
          data-testid="button-back-payment"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-pay"
        >
          {isProcessing ? "A processar..." : "Pagar €0.99"}
        </Button>
      </div>
    </form>
  );
}

export default function Payment() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Get payment info
  const { data: paymentInfo } = useQuery<PaymentInfo>({
    queryKey: ['/api/payment/info'],
  });

  // Check if user already has premium
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
  });

  // 1) Get public key - try env var first, fallback to API
  useEffect(() => {
    const getPublicKey = async () => {
      const fromEnv = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;
      console.log('[Payment] Checking env var VITE_STRIPE_PUBLIC_KEY:', fromEnv ? 'exists' : 'not found');
      if (fromEnv) {
        console.log('[Payment] Using env var public key');
        setPublicKey(fromEnv);
        return;
      }
      
      try {
        console.log('[Payment] Fetching public key from /api/stripe/config');
        const res = await fetch('/api/stripe/config');
        const data = await res.json();
        console.log('[Payment] Received public key from API');
        setPublicKey(data.publicKey);
      } catch (error) {
        console.error('[Payment] Failed to load Stripe key:', error);
        toast({
          title: "Erro de Configuração",
          description: "Não foi possível carregar a configuração de pagamento",
          variant: "destructive",
        });
      }
    };
    getPublicKey();
  }, []);

  // 2) Create payment intent
  useEffect(() => {
    if ((subscriptionStatus as any)?.isPremium) {
      toast({
        title: "Acesso Premium Ativo",
        description: "Já tem acesso premium!",
      });
      setLocation("/dashboard");
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!res.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
        setLocation("/dashboard");
      }
    };

    createPaymentIntent();
  }, [subscriptionStatus]);

  // 3) Create stripePromise only when publicKey exists
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (publicKey) {
      console.log('[Payment] Creating stripePromise with public key:', publicKey.substring(0, 15) + '...');
      return loadStripe(publicKey);
    }
    console.log('[Payment] No public key yet, stripePromise is null');
    return null;
  }, [publicKey]);

  // 4) Only render Elements when EVERYTHING is ready
  if (!stripePromise || !clientSecret) {
    console.log('[Payment] Waiting for:', {
      hasStripePromise: !!stripePromise,
      hasClientSecret: !!clientSecret
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">A preparar pagamento...</p>
        </div>
      </div>
    );
  }

  console.log('[Payment] Rendering Elements with stripePromise and clientSecret');

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
        <Card data-testid="card-payment">
          <CardHeader>
            <CardTitle data-testid="title-payment">
              {paymentInfo?.description || "Acesso Premium Vitalício"}
            </CardTitle>
            <CardDescription data-testid="desc-payment">
              Complete o seu pagamento de forma segura com Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Payment Details */}
            {paymentInfo && (
              <div className="mb-6 space-y-4" data-testid="payment-details">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-semibold">{paymentInfo.description}</p>
                      <p className="text-sm text-muted-foreground">Pagamento único</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">€{paymentInfo.price}</p>
                      <p className="text-sm text-muted-foreground">uma vez</p>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Incluído:</p>
                    {paymentInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <p className="text-sm text-muted-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stripe Payment Element */}
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm />
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

            {/* Security Note */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                🔒 Pagamento seguro processado por Stripe. Não armazenamos dados do seu cartão.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
