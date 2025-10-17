export interface Holiday {
  date: Date;
  name: string;
  type: "civil" | "religious" | "municipal";
  isNationalHoliday: boolean;
  description?: string;
}

export interface HistoricalEvent {
  date: string; // Format: MM-DD
  year?: number; // Optional year for specific events
  title: string;
  description: string;
  category: "history" | "culture" | "politics" | "discovery" | "independence";
}

class PortugueseCalendarService {
  /**
   * Get Portuguese holidays for a specific year
   */
  getHolidays(year: number = 2025): Holiday[] {
    return [
      {
        date: new Date(year, 0, 1),
        name: "Ano Novo",
        type: "civil",
        isNationalHoliday: true,
        description: "Primeiro dia do ano"
      },
      {
        date: new Date(year, 1, 13),
        name: "Carnaval",
        type: "religious",
        isNationalHoliday: false,
        description: "Terça-feira de Carnaval (data móvel)"
      },
      {
        date: new Date(year, 3, 25),
        name: "Dia da Liberdade",
        type: "civil",
        isNationalHoliday: true,
        description: "Comemoração da Revolução dos Cravos (25 de Abril de 1974)"
      },
      {
        date: new Date(year, 4, 1),
        name: "Dia do Trabalhador",
        type: "civil",
        isNationalHoliday: true,
        description: "Dia Internacional dos Trabalhadores"
      },
      {
        date: new Date(year, 5, 10),
        name: "Dia de Portugal",
        type: "civil",
        isNationalHoliday: true,
        description: "Dia de Portugal, de Camões e das Comunidades Portuguesas"
      },
      {
        date: new Date(year, 5, 13),
        name: "Santo António (Lisboa)",
        type: "municipal",
        isNationalHoliday: false,
        description: "Feriado municipal de Lisboa"
      },
      {
        date: new Date(year, 5, 24),
        name: "São João (Porto)",
        type: "municipal",
        isNationalHoliday: false,
        description: "Feriado municipal do Porto"
      },
      {
        date: new Date(year, 7, 15),
        name: "Assunção de Nossa Senhora",
        type: "religious",
        isNationalHoliday: true,
        description: "Assunção de Maria ao Céu"
      },
      {
        date: new Date(year, 9, 5),
        name: "Implantação da República",
        type: "civil",
        isNationalHoliday: true,
        description: "Comemoração da implantação da República (5 de Outubro de 1910)"
      },
      {
        date: new Date(year, 10, 1),
        name: "Dia de Todos os Santos",
        type: "religious",
        isNationalHoliday: true,
        description: "Dia de Todos os Santos"
      },
      {
        date: new Date(year, 11, 1),
        name: "Restauração da Independência",
        type: "civil",
        isNationalHoliday: true,
        description: "Restauração da Independência (1 de Dezembro de 1640)"
      },
      {
        date: new Date(year, 11, 8),
        name: "Imaculada Conceição",
        type: "religious",
        isNationalHoliday: true,
        description: "Imaculada Conceição - Padroeira de Portugal"
      },
      {
        date: new Date(year, 11, 25),
        name: "Natal",
        type: "religious",
        isNationalHoliday: true,
        description: "Nascimento de Jesus Cristo"
      },
    ];
  }

  /**
   * Get historical ephemerides - important dates in Portuguese history
   */
  getHistoricalEphemerides(): HistoricalEvent[] {
    return [
      // January
      {
        date: "01-01",
        year: 1986,
        title: "Portugal entra na CEE",
        description: "Portugal torna-se membro da Comunidade Económica Europeia (atual União Europeia)",
        category: "politics"
      },
      {
        date: "03-29",
        year: 1998,
        title: "Inauguração da Ponte Vasco da Gama",
        description: "Inauguração da maior ponte da Europa com 17,2 km sobre o rio Tejo",
        category: "history"
      },
      // March
      {
        date: "03-01",
        year: 1495,
        title: "Início do reinado de D. Manuel I",
        description: "D. Manuel I, O Venturoso, inicia o seu reinado marcado pela Era dos Descobrimentos",
        category: "history"
      },
      {
        date: "03-09",
        year: 1500,
        title: "Partida para o Brasil",
        description: "Pedro Álvares Cabral parte de Lisboa rumo à Índia, descobrindo o Brasil",
        category: "discovery"
      },
      // April
      {
        date: "04-22",
        year: 1500,
        title: "Descobrimento do Brasil",
        description: "Pedro Álvares Cabral avista terras brasileiras",
        category: "discovery"
      },
      {
        date: "04-25",
        year: 1974,
        title: "Revolução dos Cravos",
        description: "Queda do regime do Estado Novo e início da democracia em Portugal",
        category: "independence"
      },
      // May
      {
        date: "05-13",
        year: 1917,
        title: "Primeira Aparição de Fátima",
        description: "Primeira aparição de Nossa Senhora aos três pastorinhos em Fátima",
        category: "culture"
      },
      {
        date: "05-20",
        year: 1498,
        title: "Vasco da Gama chega à Índia",
        description: "Vasco da Gama chega a Calecute, descobrindo o caminho marítimo para a Índia",
        category: "discovery"
      },
      // June
      {
        date: "06-10",
        year: 1580,
        title: "Morte de Luís de Camões",
        description: "Falecimento do maior poeta português, autor de 'Os Lusíadas'",
        category: "culture"
      },
      {
        date: "06-13",
        title: "Santo António de Lisboa",
        description: "Dia de Santo António, padroeiro de Lisboa",
        category: "culture"
      },
      // July
      {
        date: "07-04",
        year: 1415,
        title: "Conquista de Ceuta",
        description: "Início da expansão portuguesa com a conquista de Ceuta no Norte de África",
        category: "discovery"
      },
      // August
      {
        date: "08-04",
        year: 1578,
        title: "Batalha de Alcácer-Quibir",
        description: "Derrota portuguesa em Marrocos e desaparecimento de D. Sebastião",
        category: "history"
      },
      // September
      {
        date: "09-20",
        year: 1519,
        title: "Partida de Fernão de Magalhães",
        description: "Fernão de Magalhães parte para a primeira circum-navegação do globo",
        category: "discovery"
      },
      // October
      {
        date: "10-05",
        year: 1910,
        title: "Implantação da República",
        description: "Fim da Monarquia e implantação da Primeira República Portuguesa",
        category: "politics"
      },
      {
        date: "10-12",
        year: 1492,
        title: "Descoberta da América",
        description: "Cristóvão Colombo chega à América (navegador ao serviço de Espanha, mas de possível origem portuguesa)",
        category: "discovery"
      },
      // November
      {
        date: "11-01",
        year: 1755,
        title: "Terramoto de Lisboa",
        description: "Grande terramoto que destruiu Lisboa e marcou a história portuguesa",
        category: "history"
      },
      // December
      {
        date: "12-01",
        year: 1640,
        title: "Restauração da Independência",
        description: "Portugal recupera a independência após 60 anos de domínio espanhol",
        category: "independence"
      },
      {
        date: "12-13",
        year: 1545,
        title: "Início do Concílio de Trento",
        description: "Participação portuguesa no importante Concílio da Contra-Reforma",
        category: "history"
      },
    ];
  }

  /**
   * Get ephemeris for a specific date
   */
  getEphemerisForDate(month: number, day: number): HistoricalEvent[] {
    const allEphemerides = this.getHistoricalEphemerides();
    const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEphemerides.filter(e => e.date === dateStr);
  }

  /**
   * Get holidays for a specific month
   */
  getHolidaysForMonth(year: number, month: number): Holiday[] {
    const allHolidays = this.getHolidays(year);
    return allHolidays.filter(h => h.date.getMonth() === month - 1);
  }

  /**
   * Check if a specific date is a holiday
   */
  isHoliday(date: Date): Holiday | null {
    const holidays = this.getHolidays(date.getFullYear());
    return holidays.find(h => 
      h.date.getDate() === date.getDate() && 
      h.date.getMonth() === date.getMonth()
    ) || null;
  }
}

export const portugueseCalendarService = new PortugueseCalendarService();
