import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPreferencesSchema, type InsertPreferences, type Preferences } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PreferencesPage() {
  const { toast } = useToast();

  const { data: preferences, isLoading } = useQuery<Preferences>({
    queryKey: ["/api/preferences"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPreferences) =>
      apiRequest<Preferences>("PUT", "/api/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Preferências guardadas",
        description: "As suas preferências foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar as preferências.",
      });
    },
  });

  const form = useForm<InsertPreferences>({
    resolver: zodResolver(insertPreferencesSchema),
    defaultValues: {
      dailyDigestEnabled: true,
      dailyDigestTime: "08:30",
      eventTypes: [],
      notificationChannels: ["push"],
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        dailyDigestEnabled: preferences.dailyDigestEnabled ?? true,
        dailyDigestTime: preferences.dailyDigestTime ?? "08:30",
        eventTypes: preferences.eventTypes ?? [],
        notificationChannels: preferences.notificationChannels ?? ["push"],
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: InsertPreferences) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Preferências</h1>
          <p className="text-muted-foreground">
            Personalize a sua experiência no AlmanaqueLuso
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Daily Digest Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Resumo Diário
                </CardTitle>
                <CardDescription>
                  Receba um resumo dos eventos do dia todos os dias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="dailyDigestEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Ativar Resumo Diário
                        </FormLabel>
                        <FormDescription>
                          Receba notificações com os eventos do dia
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-daily-digest"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dailyDigestTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora do Resumo</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          disabled={!form.watch("dailyDigestEnabled")}
                          data-testid="input-digest-time"
                        />
                      </FormControl>
                      <FormDescription>
                        Escolha a hora em que deseja receber o resumo (fuso horário de Lisboa)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Event Type Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Eventos</CardTitle>
                <CardDescription>
                  Selecione os tipos de eventos que quer acompanhar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento. Por enquanto, todos os tipos de eventos são mostrados.
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-preferences"
              >
                {updateMutation.isPending ? "A guardar..." : "Guardar Preferências"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
