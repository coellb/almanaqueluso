interface SymbolicWeatherPrediction {
  observation: string;
  prediction: string;
  reliability: "alta" | "média" | "baixa";
  season: string;
}

interface RuralPoetry {
  title: string;
  author?: string;
  text: string;
  region?: string;
  theme: "natureza" | "trabalho" | "saudade" | "celebração";
}

interface ScientificCuriosity {
  title: string;
  description: string;
  category: "astronomia" | "natureza" | "física" | "biologia";
  didYouKnow: string;
}

interface AgriculturalRegion {
  name: string;
  districts: string[];
  climate: string;
  soilType: string;
  mainCrops: string[];
  characteristics: string;
}

interface DailyAstrology {
  sign: string;
  dateRange: string;
  element: "fogo" | "terra" | "ar" | "água";
  dailyAdvice: string;
  luckyColor: string;
  compatibility: string[];
}

class CultureService {
  /**
   * Previsões simbólicas do tempo baseadas em observações da natureza
   */
  getSymbolicWeatherPredictions(): SymbolicWeatherPrediction[] {
    return [
      {
        observation: "Lua com círculo ao redor",
        prediction: "Chuva nas próximas 24 horas",
        reliability: "alta",
        season: "todo o ano"
      },
      {
        observation: "Céu vermelho ao pôr do sol",
        prediction: "Bom tempo no dia seguinte",
        reliability: "alta",
        season: "todo o ano"
      },
      {
        observation: "Céu vermelho ao nascer do sol",
        prediction: "Chuva durante o dia",
        reliability: "média",
        season: "todo o ano"
      },
      {
        observation: "Andorinhas voam baixo",
        prediction: "Tempestade a aproximar-se",
        reliability: "alta",
        season: "primavera/verão"
      },
      {
        observation: "Nevoeiro pela manhã",
        prediction: "Dia quente e seco",
        reliability: "média",
        season: "verão"
      },
      {
        observation: "Gatos lavam as orelhas",
        prediction: "Chuva próxima",
        reliability: "baixa",
        season: "todo o ano"
      },
      {
        observation: "Formigas escondem-se",
        prediction: "Tempestade iminente",
        reliability: "alta",
        season: "primavera/verão"
      },
      {
        observation: "Fumo desce ao chão",
        prediction: "Chuva aproxima-se",
        reliability: "média",
        season: "outono/inverno"
      },
      {
        observation: "Pinheiros abrem as pinhas",
        prediction: "Tempo seco a caminho",
        reliability: "alta",
        season: "todo o ano"
      },
      {
        observation: "Rãs coaxam intensamente",
        prediction: "Chuva nas próximas horas",
        reliability: "alta",
        season: "primavera/verão"
      }
    ];
  }

  /**
   * Poesia e textos literários rurais portugueses
   */
  getRuralPoetry(): RuralPoetry[] {
    return [
      {
        title: "O Lavrador",
        author: "Guerra Junqueiro",
        text: "Curvo sobre a enxada,\nSob o sol causticante,\nO lavrador trabalha\nNa terra que o sustenta.",
        region: "Minho",
        theme: "trabalho"
      },
      {
        title: "Canção do Campo",
        text: "Entre olivais e vinhas,\nCorre o vento suave,\nCantam os passarinhos,\nNa manhã que desperta.",
        region: "Douro",
        theme: "natureza"
      },
      {
        title: "Saudade da Terra",
        author: "Popular",
        text: "Longe da minha terra,\nLonge do meu lugar,\nSinto falta dos campos,\nDo cheiro a rosmaninho e a mar.",
        region: "Alentejo",
        theme: "saudade"
      },
      {
        title: "Vindimas",
        text: "Chegou o tempo das uvas,\nDas cantigas e da dança,\nO vinho na pipa nova,\nÉ promessa de abundância.",
        region: "Douro",
        theme: "celebração"
      },
      {
        title: "Primavera no Campo",
        text: "Florescem as amendoeiras,\nBrancas como a neve pura,\nA primavera chegou,\nTrazendo nova frescura.",
        region: "Trás-os-Montes",
        theme: "natureza"
      },
      {
        title: "O Ceifeiro",
        author: "Popular Alentejano",
        text: "Ceifa o trigo dourado,\nSob o sol do Alentejo,\nCom a foice afiada,\nE o coração no desejo.",
        region: "Alentejo",
        theme: "trabalho"
      },
      {
        title: "Noite de São João",
        text: "Saltam-se as fogueiras,\nAo som de acordeão,\nFesteja-se a colheita,\nNa noite de São João.",
        region: "Minho",
        theme: "celebração"
      },
      {
        title: "Mar e Campo",
        text: "Entre o mar e o monte,\nVive o povo português,\nDa terra tira o sustento,\nDo mar traz o peixe à mesa.",
        region: "Litoral",
        theme: "natureza"
      }
    ];
  }

  /**
   * Curiosidades científicas e astronómicas
   */
  getScientificCuriosities(): ScientificCuriosity[] {
    return [
      {
        title: "O Céu Noturno Português",
        description: "Portugal continental está numa posição privilegiada para observar estrelas, com baixa poluição luminosa em muitas regiões.",
        category: "astronomia",
        didYouKnow: "A Reserva Dark Sky Alqueva é um dos melhores locais do mundo para observação astronómica!"
      },
      {
        title: "Influência da Lua nas Marés",
        description: "As marés no Atlântico podem variar até 4 metros em Portugal devido à força gravitacional da Lua.",
        category: "astronomia",
        didYouKnow: "A Lua afasta-se da Terra cerca de 3,8 cm por ano!"
      },
      {
        title: "Biodiversidade Portuguesa",
        description: "Portugal tem mais de 3.000 espécies de plantas nativas, muitas delas endémicas.",
        category: "biologia",
        didYouKnow: "O sobreiro português produz a melhor cortiça do mundo!"
      },
      {
        title: "Ventos Atlânticos",
        description: "Os ventos do Atlântico influenciam diretamente o clima português, trazendo humidade no inverno.",
        category: "física",
        didYouKnow: "A Nortada é um vento regular que refresca o verão português!"
      },
      {
        title: "Estações do Ano",
        description: "Portugal tem estações bem definidas devido à inclinação do eixo da Terra em relação ao Sol.",
        category: "astronomia",
        didYouKnow: "No solstício de verão, Portugal tem mais de 15 horas de luz solar!"
      },
      {
        title: "Solos Férteis",
        description: "O basalto vulcânico dos Açores cria alguns dos solos mais férteis de Portugal.",
        category: "natureza",
        didYouKnow: "O solo de terra rossa do Alentejo é perfeito para oliveiras!"
      },
      {
        title: "Fauna Noturna",
        description: "Portugal abriga várias espécies de morcegos que ajudam a controlar pragas agrícolas.",
        category: "biologia",
        didYouKnow: "Um morcego pode comer até 1.000 mosquitos por hora!"
      },
      {
        title: "Ciclos Lunares",
        description: "A lua completa um ciclo de fases em aproximadamente 29,5 dias.",
        category: "astronomia",
        didYouKnow: "Sempre vemos a mesma face da Lua porque ela roda sincronizada com a Terra!"
      }
    ];
  }

  /**
   * Mapa das regiões agrícolas e zonas climáticas de Portugal
   */
  getAgriculturalRegions(): AgriculturalRegion[] {
    return [
      {
        name: "Minho",
        districts: ["Viana do Castelo", "Braga"],
        climate: "Atlântico húmido, chuvas abundantes",
        soilType: "Granítico, ácido e profundo",
        mainCrops: ["Vinho Verde", "Milho", "Hortícolas", "Kiwi"],
        characteristics: "Região de minifúndio, policultura intensiva, paisagem verdejante"
      },
      {
        name: "Trás-os-Montes",
        districts: ["Bragança", "Vila Real"],
        climate: "Continental, invernos frios e verões quentes",
        soilType: "Xistoso e granítico",
        mainCrops: ["Azeite", "Amêndoa", "Castanha", "Vinho do Porto"],
        characteristics: "Agricultura de montanha, terraços, produtos de alta qualidade"
      },
      {
        name: "Douro",
        districts: ["Vila Real", "Viseu", "Guarda"],
        climate: "Mediterrâneo continental",
        soilType: "Xistoso em socalcos",
        mainCrops: ["Vinho do Porto", "Vinhas", "Azeite", "Amêndoa"],
        characteristics: "Vinhas em socalcos, paisagem classificada UNESCO"
      },
      {
        name: "Beira Litoral",
        districts: ["Aveiro", "Coimbra", "Leiria"],
        climate: "Atlântico temperado",
        soilType: "Arenoso e aluvionar",
        mainCrops: ["Arroz", "Milho", "Hortícolas", "Fruta"],
        characteristics: "Agricultura intensiva, rega abundante, hortas"
      },
      {
        name: "Ribatejo",
        districts: ["Santarém", "Lisboa (parcial)"],
        climate: "Mediterrâneo",
        soilType: "Aluvionar fértil",
        mainCrops: ["Tomate", "Melão", "Cereais", "Criação de toiros"],
        characteristics: "Lezírias férteis, agricultura mecanizada, pecuária"
      },
      {
        name: "Alentejo",
        districts: ["Évora", "Beja", "Portalegre", "Setúbal (parcial)"],
        climate: "Mediterrâneo continental, seco",
        soilType: "Terra rossa, barros",
        mainCrops: ["Trigo", "Azeite", "Cortiça", "Vinha"],
        characteristics: "Latifúndio, montado de sobro e azinho, planícies douradas"
      },
      {
        name: "Algarve",
        districts: ["Faro"],
        climate: "Mediterrâneo, ameno todo o ano",
        soilType: "Calcário e arenoso",
        mainCrops: ["Citrinos", "Alfarroba", "Figo", "Amêndoa"],
        characteristics: "Sequeiro, amendoeiras, pomares de citrinos"
      },
      {
        name: "Oeste",
        districts: ["Leiria", "Lisboa (parcial)"],
        climate: "Atlântico moderado",
        soilType: "Calcário e argiloso",
        mainCrops: ["Hortícolas", "Fruta", "Vinha", "Pera Rocha"],
        characteristics: "Horta de Lisboa, produção intensiva, estufas"
      }
    ];
  }

  /**
   * Get região by district name
   */
  getRegionByDistrict(district: string): AgriculturalRegion | null {
    const regions = this.getAgriculturalRegions();
    return regions.find(region => 
      region.districts.some(d => d.toLowerCase().includes(district.toLowerCase()))
    ) || null;
  }

  /**
   * Influências astrológicas diárias por signo
   */
  getDailyAstrology(): DailyAstrology[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Conselhos rotativos baseados no dia da semana
    const advicePatterns = [
      "Dia favorável para projetos no campo",
      "Momento ideal para plantar e semear",
      "Energia positiva para colheitas",
      "Bom dia para cuidar dos animais",
      "Propício para poda e manutenção",
      "Tempo de descanso e planeamento",
      "Dia de celebração e comunidade"
    ];

    return [
      {
        sign: "Carneiro",
        dateRange: "21 Mar - 20 Abr",
        element: "fogo",
        dailyAdvice: advicePatterns[dayOfWeek],
        luckyColor: "Vermelho",
        compatibility: ["Leão", "Sagitário", "Gémeos"]
      },
      {
        sign: "Touro",
        dateRange: "21 Abr - 20 Mai",
        element: "terra",
        dailyAdvice: "Persistência traz bons frutos hoje",
        luckyColor: "Verde",
        compatibility: ["Virgem", "Capricórnio", "Caranguejo"]
      },
      {
        sign: "Gémeos",
        dateRange: "21 Mai - 20 Jun",
        element: "ar",
        dailyAdvice: "Partilhe conhecimento com outros",
        luckyColor: "Amarelo",
        compatibility: ["Balança", "Aquário", "Carneiro"]
      },
      {
        sign: "Caranguejo",
        dateRange: "21 Jun - 22 Jul",
        element: "água",
        dailyAdvice: "Cuide da sua terra com carinho",
        luckyColor: "Prateado",
        compatibility: ["Escorpião", "Peixes", "Touro"]
      },
      {
        sign: "Leão",
        dateRange: "23 Jul - 22 Ago",
        element: "fogo",
        dailyAdvice: "Lidere com confiança nos trabalhos",
        luckyColor: "Dourado",
        compatibility: ["Carneiro", "Sagitário", "Gémeos"]
      },
      {
        sign: "Virgem",
        dateRange: "23 Ago - 22 Set",
        element: "terra",
        dailyAdvice: "Atenção aos detalhes traz sucesso",
        luckyColor: "Castanho",
        compatibility: ["Touro", "Capricórnio", "Escorpião"]
      },
      {
        sign: "Balança",
        dateRange: "23 Set - 22 Out",
        element: "ar",
        dailyAdvice: "Harmonia nas relações de trabalho",
        luckyColor: "Rosa",
        compatibility: ["Gémeos", "Aquário", "Leão"]
      },
      {
        sign: "Escorpião",
        dateRange: "23 Out - 21 Nov",
        element: "água",
        dailyAdvice: "Transforme desafios em oportunidades",
        luckyColor: "Bordô",
        compatibility: ["Caranguejo", "Peixes", "Virgem"]
      },
      {
        sign: "Sagitário",
        dateRange: "22 Nov - 21 Dez",
        element: "fogo",
        dailyAdvice: "Explore novas técnicas agrícolas",
        luckyColor: "Roxo",
        compatibility: ["Carneiro", "Leão", "Aquário"]
      },
      {
        sign: "Capricórnio",
        dateRange: "22 Dez - 20 Jan",
        element: "terra",
        dailyAdvice: "Disciplina garante boas colheitas",
        luckyColor: "Preto",
        compatibility: ["Touro", "Virgem", "Escorpião"]
      },
      {
        sign: "Aquário",
        dateRange: "21 Jan - 19 Fev",
        element: "ar",
        dailyAdvice: "Inove nos métodos tradicionais",
        luckyColor: "Azul turquesa",
        compatibility: ["Gémeos", "Balança", "Sagitário"]
      },
      {
        sign: "Peixes",
        dateRange: "20 Fev - 20 Mar",
        element: "água",
        dailyAdvice: "Intuição guia as decisões do campo",
        luckyColor: "Verde-água",
        compatibility: ["Caranguejo", "Escorpião", "Touro"]
      }
    ];
  }

  /**
   * Get daily astrology for a specific sign
   */
  getAstrologyBySign(sign: string): DailyAstrology | null {
    const astrology = this.getDailyAstrology();
    return astrology.find(a => a.sign.toLowerCase() === sign.toLowerCase()) || null;
  }

  /**
   * Get random scientific curiosity
   */
  getRandomCuriosity(): ScientificCuriosity {
    const curiosities = this.getScientificCuriosities();
    return curiosities[Math.floor(Math.random() * curiosities.length)];
  }

  /**
   * Get random rural poetry
   */
  getRandomPoetry(): RuralPoetry {
    const poetry = this.getRuralPoetry();
    return poetry[Math.floor(Math.random() * poetry.length)];
  }
}

export const cultureService = new CultureService();
export type { 
  SymbolicWeatherPrediction, 
  RuralPoetry, 
  ScientificCuriosity, 
  AgriculturalRegion,
  DailyAstrology 
};
