// Subscription plans configuration - reusable across apps
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string; // Set this in your Stripe dashboard
  features: string[];
  popular?: boolean;
}

// Portuguese-focused plans with EUR pricing (MB WAY support)
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Grátis',
    description: 'Para começar a explorar',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Calendário básico de eventos',
      'Fases lunares e astronomia',
      'Ditados e sabedoria popular',
      'Até 10 eventos personalizados',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Acesso completo a todas as funcionalidades',
    price: 4.99,
    currency: 'EUR',
    interval: 'month',
    // stripePriceId will be injected by backend from env vars
    popular: true,
    features: [
      'Todos os eventos do plano grátis',
      'Marés e desportos (Liga Portugal, UEFA, FIFA)',
      'Eventos culturais portugueses',
      'Calendário agrícola completo',
      'Poesia e cultura portuguesa',
      'Eventos personalizados ilimitados',
      'Resumo diário personalizado',
      'Notificações avançadas',
      'Sem anúncios',
    ],
  },
  {
    id: 'premium_annual',
    name: 'Premium Anual',
    description: 'Poupe 20% com o plano anual',
    price: 47.99,
    currency: 'EUR',
    interval: 'year',
    // stripePriceId will be injected by backend from env vars
    features: [
      'Todos os benefícios do Premium',
      'Poupe 20% (€59.88 → €47.99/ano)',
      'Suporte prioritário',
      'Acesso antecipado a novas funcionalidades',
    ],
  },
];

// Helper functions
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.id === planId);
}

export function getPaidPlans(): SubscriptionPlan[] {
  return subscriptionPlans.filter(plan => plan.price > 0);
}

export function isPremiumPlan(planId: string): boolean {
  return planId === 'premium' || planId === 'premium_annual';
}

export function formatPrice(plan: SubscriptionPlan): string {
  if (plan.price === 0) return 'Grátis';
  
  const formatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.price);
  
  return plan.interval === 'year' 
    ? `${formatted}/ano` 
    : `${formatted}/mês`;
}
