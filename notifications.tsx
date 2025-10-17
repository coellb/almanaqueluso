import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNotificationPreferencesSchema, type InsertNotificationPreferences, type NotificationPreferences } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Waves, Trophy, Moon, Sprout, Calendar as CalendarIcon, PartyPopper, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(true);

  // Check push notification support
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsPushSupported(false);
    }
  }, []);

  // Check subscription status
  const { data: subscriptionStatus } = useQuery<{ isSubscribed: boolean }>({
    queryKey: ["/api/push/subscription-status"],
    enabled: isPushSupported,
  });

  // Update local state when subscription status is loaded
  useEffect(() => {
    if (subscriptionStatus) {
      setIsSubscribed(subscriptionStatus.isSubscribed);
    }
  }, [subscriptionStatus]);

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertNotificationPreferences) =>
      apiRequest<NotificationPreferences>("PUT", "/api/notifications/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
      toast({
        title: t('notifications.saved'),
        description: t('notifications.saved'),
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t('notifications.error'),
        description: error.message || t('notifications.error'),
      });
    },
  });

  const form = useForm<InsertNotificationPreferences>({
    resolver: zodResolver(insertNotificationPreferencesSchema),
    defaultValues: {
      tidesEnabled: true,
      sportsEnabled: true,
      astronomyEnabled: true,
      agricultureEnabled: false,
      culturalEnabled: true,
      holidaysEnabled: true,
      tidesFrequency: "immediate",
      sportsFrequency: "daily",
      astronomyFrequency: "daily",
      agricultureFrequency: "weekly",
      culturalFrequency: "weekly",
      holidaysFrequency: "daily",
      preferredNotificationTime: "09:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        tidesEnabled: preferences.tidesEnabled ?? true,
        sportsEnabled: preferences.sportsEnabled ?? true,
        astronomyEnabled: preferences.astronomyEnabled ?? true,
        agricultureEnabled: preferences.agricultureEnabled ?? false,
        culturalEnabled: preferences.culturalEnabled ?? true,
        holidaysEnabled: preferences.holidaysEnabled ?? true,
        tidesFrequency: preferences.tidesFrequency ?? "immediate",
        sportsFrequency: preferences.sportsFrequency ?? "daily",
        astronomyFrequency: preferences.astronomyFrequency ?? "daily",
        agricultureFrequency: preferences.agricultureFrequency ?? "weekly",
        culturalFrequency: preferences.culturalFrequency ?? "weekly",
        holidaysFrequency: preferences.holidaysFrequency ?? "daily",
        preferredNotificationTime: preferences.preferredNotificationTime ?? "09:00",
        quietHoursStart: preferences.quietHoursStart ?? "22:00",
        quietHoursEnd: preferences.quietHoursEnd ?? "08:00",
      });
    }
  }, [preferences, form]);

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          variant: "destructive",
          title: t('notifications.permissionDenied'),
          description: t('notifications.permissionDenied'),
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidResponse = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await vapidResponse.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      const response = await apiRequest("POST", "/api/push/subscribe", subscription.toJSON());
      
      // Invalidate and refetch subscription status
      await queryClient.invalidateQueries({ queryKey: ["/api/push/subscription-status"] });
      
      toast({
        title: t('notifications.subscribed'),
        description: t('notifications.subscribed'),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('notifications.error'),
        description: error.message,
      });
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await apiRequest("POST", "/api/push/unsubscribe", { endpoint: subscription.endpoint });
        
        // Invalidate and refetch subscription status
        await queryClient.invalidateQueries({ queryKey: ["/api/push/subscription-status"] });
        
        toast({
          title: t('notifications.unsubscribe'),
          description: t('notifications.unsubscribe'),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('notifications.error'),
        description: error.message,
      });
    }
  };

  const onSubmit = (data: InsertNotificationPreferences) => {
    updateMutation.mutate(data);
  };

  const notificationTypes = [
    { key: "tides", icon: Waves, color: "text-blue-500" },
    { key: "sports", icon: Trophy, color: "text-green-500" },
    { key: "astronomy", icon: Moon, color: "text-purple-500" },
    { key: "agriculture", icon: Sprout, color: "text-emerald-500" },
    { key: "cultural", icon: PartyPopper, color: "text-orange-500" },
    { key: "holidays", icon: CalendarIcon, color: "text-red-500" },
  ];

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

  if (!isPushSupported) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellOff className="h-6 w-6" />
                {t('notifications.browserNotSupported')}
              </CardTitle>
              <CardDescription>
                {t('notifications.browserNotSupported')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('notifications.title')}</h1>
          <p className="text-muted-foreground">{t('notifications.subtitle')}</p>
        </div>

        {/* Push Subscription */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notifications.enablePush')}
              </span>
              <Badge variant={isSubscribed ? "default" : "secondary"} data-testid="badge-subscription-status">
                {isSubscribed ? t('notifications.subscribed') : t('notifications.notSubscribed')}
              </Badge>
            </CardTitle>
            <CardDescription>{t('notifications.enablePushDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubscribed ? (
              <Button onClick={subscribeToPush} data-testid="button-subscribe-push">
                {t('notifications.subscribe')}
              </Button>
            ) : (
              <Button variant="outline" onClick={unsubscribeFromPush} data-testid="button-unsubscribe-push">
                {t('notifications.unsubscribe')}
              </Button>
            )}
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle>{t('notifications.types.title')}</CardTitle>
                <CardDescription>{t('notifications.types.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationTypes.map(({ key, icon: Icon, color }) => (
                  <div key={key} className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base">
                            {t(`notifications.types.${key}`)}
                          </FormLabel>
                          <FormDescription>
                            {t(`notifications.types.${key}Desc`)}
                          </FormDescription>
                        </div>
                        <FormField
                          control={form.control}
                          name={`${key}Enabled` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-${key}-enabled`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`${key}Frequency` as any}
                      render={({ field }) => (
                        <FormItem className="ml-8">
                          <FormLabel>{t('notifications.frequency.title')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!form.watch(`${key}Enabled` as any)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid={`select-${key}-frequency`}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">{t('notifications.frequency.immediate')}</SelectItem>
                              <SelectItem value="daily">{t('notifications.frequency.daily')}</SelectItem>
                              <SelectItem value="weekly">{t('notifications.frequency.weekly')}</SelectItem>
                              <SelectItem value="never">{t('notifications.frequency.never')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Timing Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('notifications.timing.title')}
                </CardTitle>
                <CardDescription>{t('notifications.timing.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="preferredNotificationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('notifications.timing.preferredTime')}</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-preferred-time"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('notifications.timing.preferredTimeDesc')}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>{t('notifications.timing.quietHours')}</FormLabel>
                  <FormDescription className="mb-3">
                    {t('notifications.timing.quietHoursDesc')}
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quietHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notifications.timing.quietStart')}</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-quiet-start"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quietHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notifications.timing.quietEnd')}</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-quiet-end"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-notifications"
              >
                {updateMutation.isPending ? "A guardar..." : t('notifications.save')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
