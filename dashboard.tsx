import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { CreateEventDialog } from "@/components/dialogs/CreateEventDialog";
import { MonthView } from "@/components/calendar/MonthView";
import { LunarPhaseWidget } from "@/components/calendar/LunarPhaseWidget";
import { WisdomWidget } from "@/components/calendar/WisdomWidget";
import { AstronomyWidget } from "@/components/calendar/AstronomyWidget";
import { PortugueseCalendarWidget } from "@/components/calendar/PortugueseCalendarWidget";
import { AgricultureWidget } from "@/components/calendar/AgricultureWidget";
import { CultureWidget } from "@/components/calendar/CultureWidget";
import { SubscriptionWidget } from "@/components/subscription/SubscriptionWidget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar as CalendarIcon, List } from "lucide-react";
import type { Event, EventType } from "@shared/schema";

export default function DashboardPage() {
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const handleTypeToggle = (type: EventType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
  };

  const filteredEvents = events?.filter(event => {
    if (selectedTypes.length === 0) return true;
    return selectedTypes.includes(event.type as EventType);
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe os eventos culturais e astronómicos de Portugal
          </p>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionWidget />
        </div>

        {/* Today's Overview with Lunar Phase */}
        <div className="mb-8">
          <LunarPhaseWidget />
        </div>

        {/* Portuguese Wisdom & Culture */}
        <div className="mb-8">
          <WisdomWidget />
        </div>

        {/* Astronomy & Calendar Info */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AstronomyWidget />
          <PortugueseCalendarWidget />
        </div>

        {/* Agriculture & Nature */}
        <div className="mb-8">
          <AgricultureWidget />
        </div>

        {/* Society & Culture */}
        <div className="mb-8">
          <CultureWidget />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <EventFilters
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              data-testid="button-view-calendar"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-event">
            <Plus className="h-4 w-4 mr-2" />
            Criar Evento
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : viewMode === "calendar" ? (
          <MonthView
            events={filteredEvents}
            onEventClick={setSelectedEvent}
          />
        ) : (
          <div>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTypes.length > 0
                    ? "Tente alterar os filtros para ver mais eventos"
                    : "Ainda não há eventos disponíveis"}
                </p>
                {selectedTypes.length > 0 && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />

        {/* Create Event Dialog */}
        <CreateEventDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </div>
  );
}
