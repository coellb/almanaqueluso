import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Moon, Waves, Trophy, Star, MapPin } from "lucide-react";
import heroImage from "@assets/generated_images/Portuguese_coastal_sunset_hero_6773bd5c.png";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const eventTypes = [
    {
      icon: Star,
      title: "Astronomia",
      description: "Eclipses, chuvas de meteoros e eventos celestes",
      color: "text-event-astronomy",
      bgColor: "bg-event-astronomy/10",
    },
    {
      icon: Moon,
      title: "Fases da Lua",
      description: "Acompanhe o ciclo lunar português",
      color: "text-event-astronomy",
      bgColor: "bg-event-astronomy/10",
    },
    {
      icon: Waves,
      title: "Marés",
      description: "Previsões de marés para a costa portuguesa",
      color: "text-event-tide",
      bgColor: "bg-event-tide/10",
    },
    {
      icon: Trophy,
      title: "Desporto",
      description: "Liga Portugal, UEFA Champions League e FIFA",
      color: "text-event-sports",
      bgColor: "bg-event-sports/10",
    },
    {
      icon: MapPin,
      title: "Eventos Culturais",
      description: "Festas, festivais e eventos locais de Portugal",
      color: "text-event-cultural",
      bgColor: "bg-event-cultural/10",
    },
    {
      icon: Calendar,
      title: "Personalizados",
      description: "Crie e acompanhe os seus próprios eventos",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-96 lg:h-[500px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="Portuguese coastal landscape"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/50 to-secondary/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="font-serif text-5xl font-bold text-white sm:text-6xl lg:text-7xl mb-6">
            AlmanaqueLuso
          </h1>
          <p className="max-w-2xl text-lg text-white/95 sm:text-xl lg:text-2xl mb-8">
            O calendário cultural de Portugal. Astronomia, marés, desporto e eventos locais num só lugar.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/auth/register")}
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
              data-testid="button-hero-register"
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/auth/login")}
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20"
              data-testid="button-hero-login"
            >
              Entrar
            </Button>
          </div>
        </div>
      </section>

      {/* Event Types Showcase */}
      <section className="py-16 px-4 bg-background">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Todos os Eventos de Portugal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acompanhe os eventos mais importantes para a comunidade portuguesa
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((type, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center mb-4`}>
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-secondary">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Crie a sua conta gratuita e personalize o seu calendário cultural português
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/auth/register")}
            className="bg-white text-primary hover:bg-white/90"
            data-testid="button-cta-register"
          >
            Criar Conta Gratuita
          </Button>
        </div>
      </section>
    </div>
  );
}
