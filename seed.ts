import { db } from "./db";
import { events } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding AlmanaqueLuso database...");

  const sampleEvents = [
    // Astronomy events
    {
      type: "astronomy",
      title: "Chuva de Meteoros das Perseidas",
      description: "Observação da chuva de meteoros anual das Perseidas, visível em todo Portugal continental",
      startAt: new Date("2025-08-12T22:00:00Z"),
      endAt: new Date("2025-08-13T05:00:00Z"),
      location: "Todo Portugal",
      visibility: "PT",
      tags: ["meteoros", "observação", "céu noturno"],
      source: "seed",
    },
    {
      type: "astronomy",
      title: "Eclipse Lunar Parcial",
      description: "Eclipse lunar parcial visível de Portugal continental",
      startAt: new Date("2025-09-07T18:00:00Z"),
      endAt: new Date("2025-09-07T22:00:00Z"),
      location: "Portugal Continental",
      visibility: "PT",
      tags: ["eclipse", "lua", "observação"],
      source: "seed",
    },
    // Moon phases
    {
      type: "moon",
      title: "Lua Cheia de Novembro",
      description: "Lua Cheia - Lua do Castor",
      startAt: new Date("2025-11-15T20:00:00Z"),
      location: "Portugal",
      visibility: "PT",
      tags: ["lua", "fase lunar"],
      source: "seed",
    },
    {
      type: "moon",
      title: "Lua Nova de Dezembro",
      description: "Lua Nova - Melhor momento para observação de estrelas",
      startAt: new Date("2025-12-01T06:00:00Z"),
      location: "Portugal",
      visibility: "PT",
      tags: ["lua", "fase lunar", "céu escuro"],
      source: "seed",
    },
    // Tide events
    {
      type: "tide",
      title: "Maré Alta em Cascais",
      description: "Maré alta de 3.2m - Ideal para desportos aquáticos",
      startAt: new Date("2025-10-20T14:30:00Z"),
      location: "Cascais, Lisboa",
      visibility: "PT",
      tags: ["maré", "costa", "cascais"],
      source: "seed",
    },
    {
      type: "tide",
      title: "Maré Baixa no Algarve",
      description: "Maré baixa de 0.5m - Perfeito para explorar grutas",
      startAt: new Date("2025-10-21T08:00:00Z"),
      location: "Albufeira, Algarve",
      visibility: "PT",
      tags: ["maré", "algarve", "grutas"],
      source: "seed",
    },
    // Sports - Liga Portugal
    {
      type: "match_liga",
      title: "FC Porto vs SL Benfica",
      description: "Clássico da Liga Portugal - Estádio do Dragão",
      startAt: new Date("2025-11-08T20:15:00Z"),
      location: "Estádio do Dragão, Porto",
      visibility: "PT",
      tags: ["futebol", "liga portugal", "clássico"],
      meta: { homeTeam: "FC Porto", awayTeam: "SL Benfica" },
      source: "seed",
    },
    {
      type: "match_liga",
      title: "Sporting CP vs SC Braga",
      description: "Jogo da Liga Portugal - Estádio José Alvalade",
      startAt: new Date("2025-11-15T18:00:00Z"),
      location: "Estádio José Alvalade, Lisboa",
      visibility: "PT",
      tags: ["futebol", "liga portugal"],
      meta: { homeTeam: "Sporting CP", awayTeam: "SC Braga" },
      source: "seed",
    },
    // UEFA Champions League
    {
      type: "uefa",
      title: "SL Benfica vs Bayern München",
      description: "UEFA Champions League - Fase de Grupos",
      startAt: new Date("2025-11-25T20:00:00Z"),
      location: "Estádio da Luz, Lisboa",
      visibility: "PT",
      tags: ["futebol", "champions league", "benfica"],
      meta: { competition: "UEFA Champions League" },
      source: "seed",
    },
    // Cultural events
    {
      type: "event_pt",
      title: "Festa de São Martinho",
      description: "Celebração tradicional portuguesa com castanhas e vinho novo",
      startAt: new Date("2025-11-11T10:00:00Z"),
      endAt: new Date("2025-11-11T22:00:00Z"),
      location: "Todo Portugal",
      visibility: "PT",
      tags: ["tradição", "festa", "cultura"],
      source: "seed",
    },
    {
      type: "event_pt",
      title: "Festival de Jazz de Lisboa",
      description: "Festival anual de jazz com artistas internacionais",
      startAt: new Date("2025-11-20T19:00:00Z"),
      endAt: new Date("2025-11-23T23:00:00Z"),
      location: "Lisboa",
      visibility: "PT",
      tags: ["música", "jazz", "festival", "lisboa"],
      source: "seed",
    },
    {
      type: "event_pt",
      title: "Mercado de Natal do Porto",
      description: "Mercado tradicional de Natal na Avenida dos Aliados",
      startAt: new Date("2025-12-01T10:00:00Z"),
      endAt: new Date("2025-12-24T22:00:00Z"),
      location: "Avenida dos Aliados, Porto",
      visibility: "PT",
      tags: ["natal", "mercado", "porto", "tradição"],
      source: "seed",
    },
  ];

  try {
    await db.insert(events).values(sampleEvents);
    console.log(`✅ Seeded ${sampleEvents.length} events successfully!`);
    console.log("   - Astronomy events: 2");
    console.log("   - Moon phases: 2");
    console.log("   - Tide events: 2");
    console.log("   - Liga Portugal: 2");
    console.log("   - UEFA: 1");
    console.log("   - Cultural events: 3");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
