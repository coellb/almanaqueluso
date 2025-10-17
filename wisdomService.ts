import { format } from "date-fns";
import { pt } from "date-fns/locale";

export interface MonthlyProverb {
  month: number;
  proverbs: string[];
}

export interface Saint {
  day: number;
  month: number;
  name: string;
  description: string;
  celebration?: string;
}

export interface Recipe {
  month: number;
  season: string;
  name: string;
  description: string;
  ingredients: string[];
  region?: string;
}

export interface FolkTradition {
  name: string;
  date?: string; // Format: MM-DD or just MM for monthly
  month?: number;
  location: string;
  region: string;
  type: "feira" | "romaria" | "festa" | "tradição";
  description: string;
}

export interface Superstition {
  category: "lua" | "tempo" | "saúde" | "agricultura" | "sorte";
  text: string;
  context?: string;
}

class WisdomService {
  // Ditados e provérbios por mês
  private readonly MONTHLY_PROVERBS: MonthlyProverb[] = [
    {
      month: 1,
      proverbs: [
        "Janeiro geado, melhor há-de ser o ano.",
        "Pelo Janeiro, faz o feijão o celeiro.",
        "Janeiro claro, pescador ao largo.",
        "Quem em Janeiro não semeia, em Agosto não ceifa.",
      ],
    },
    {
      month: 2,
      proverbs: [
        "Fevereiro, curto e amargoso.",
        "Neve em Fevereiro, celeiro cheio.",
        "Fevereiro, o mês dos loucos e dos namorados.",
        "Sol de Fevereiro, pouco dura e não é verdadeiro.",
      ],
    },
    {
      month: 3,
      proverbs: [
        "Março, marçagão, manhã de inverno, tarde de verão.",
        "Em Março, tanto faz o sol como o vento.",
        "Água de Março, encharca e não farta.",
        "Vento de Março, nem bom para o barco, nem bom para o carro.",
      ],
    },
    {
      month: 4,
      proverbs: [
        "Em Abril, águas mil.",
        "Abril frio e molhado, enche o celeiro e farta o gado.",
        "Abril, águas mil, todas caber em um barril.",
        "Chuva em Abril, para quem semeia é sutil.",
      ],
    },
    {
      month: 5,
      proverbs: [
        "Maio quer ver o grão no cabeço e o vinho no garrafão.",
        "Maio quente e molhado, dá pão e vinho encartado.",
        "Maio ronceiro, lavrador certeiro.",
        "Pela Senhora de Maio, pega a enxada e deixa o balanço.",
      ],
    },
    {
      month: 6,
      proverbs: [
        "Junho, fouce em punho.",
        "Por São João, põe teu chapéu na mão.",
        "Pelo São João, guarda o agasalho na mão.",
        "Água pelo São João, tira vinho e não dá pão.",
      ],
    },
    {
      month: 7,
      proverbs: [
        "Julho, quente e seguro, não faz ao lavrador figura.",
        "Água em Julho, rega e não fartura.",
        "Se chove pelo São Tiago, leva o vinho e deixa o bagaço.",
        "Julho quente e seco, faz bom vinho e muito trigo.",
      ],
    },
    {
      month: 8,
      proverbs: [
        "Agosto, fresco no rosto.",
        "Agosto maduro, Setembro seguro.",
        "Agosto tem a culpa, e Setembro leva a puba.",
        "Por Nossa Senhora de Agosto, tornam-se os figos em mosto.",
      ],
    },
    {
      month: 9,
      proverbs: [
        "Setembro ou seca as fontes ou leva as pontes.",
        "Água de Setembro, ou fome ou enchente.",
        "Trovoada de Setembro, três dias em cima e três por baixo.",
        "Setembro, o mês das vindimas e dos amores.",
      ],
    },
    {
      month: 10,
      proverbs: [
        "Outubro, molha a terra e cobre.",
        "Por São Simão, castanha assada e vinho são.",
        "Em Outubro, capa nova ou trapo podre.",
        "Outubro que seja claro, guarda o agasalho para Janeiro.",
      ],
    },
    {
      month: 11,
      proverbs: [
        "Pelo São Martinho, lume, castanhas e vinho.",
        "No dia de São Martinho, vai à adega e prova o vinho.",
        "Por São Martinho, todo o mosto é vinho.",
        "Se a águia voa em São Martinho, melhor é o vinho.",
      ],
    },
    {
      month: 12,
      proverbs: [
        "Natal à varanda, Páscoa à lareira.",
        "Dezembro frio e claro, faz tornar rico o lavrador varo.",
        "Dia de Natal, debaixo de cada telha um pardal.",
        "Por Santa Luzia, cresce o dia uma agulhia.",
      ],
    },
  ];

  // Santos do dia (seleção dos mais importantes)
  private readonly SAINTS: Saint[] = [
    { day: 1, month: 1, name: "Santa Maria, Mãe de Deus", description: "Solenidade de Santa Maria, Mãe de Deus" },
    { day: 6, month: 1, name: "Dia de Reis", description: "Epifania do Senhor - Dia de Reis" },
    { day: 13, month: 1, name: "Santo Hilário de Poitiers", description: "Bispo e Doutor da Igreja" },
    { day: 20, month: 1, name: "São Sebastião", description: "Mártir, padroeiro de muitas localidades portuguesas", celebration: "Festas e procissões em várias terras" },
    { day: 21, month: 1, name: "Santa Inês", description: "Virgem e Mártir" },
    
    { day: 3, month: 2, name: "São Brás", description: "Bispo e Mártir, protetor da garganta", celebration: "Bênção das gargantas" },
    { day: 14, month: 2, name: "São Valentim", description: "Mártir - Dia dos Namorados" },
    
    { day: 19, month: 3, name: "São José", description: "Esposo de Maria, padroeiro da Igreja Universal", celebration: "Dia do Pai em Portugal" },
    
    { day: 13, month: 5, name: "Nossa Senhora de Fátima", description: "Aparições de Fátima", celebration: "Grande peregrinação a Fátima" },
    { day: 24, month: 5, name: "Nossa Senhora Auxiliadora", description: "Auxílio dos Cristãos" },
    
    { day: 10, month: 6, name: "Dia de Portugal", description: "Dia de Portugal, de Camões e das Comunidades Portuguesas" },
    { day: 13, month: 6, name: "Santo António de Lisboa", description: "Padroeiro de Lisboa", celebration: "Marchas e festas populares em Lisboa" },
    { day: 24, month: 6, name: "São João", description: "Nascimento de São João Batista", celebration: "Festas de São João no Porto e outras cidades" },
    { day: 29, month: 6, name: "São Pedro", description: "Apóstolo", celebration: "Festas de São Pedro" },
    
    { day: 25, month: 7, name: "Santiago Maior", description: "Apóstolo, padroeiro da Espanha" },
    
    { day: 15, month: 8, name: "Assunção de Nossa Senhora", description: "Assunção de Maria ao Céu" },
    { day: 22, month: 8, name: "Nossa Senhora Rainha", description: "Rainha do Céu e da Terra" },
    
    { day: 8, month: 9, name: "Natividade de Nossa Senhora", description: "Nascimento de Maria" },
    { day: 15, month: 9, name: "Nossa Senhora das Dores", description: "Padroeira de Portugal" },
    
    { day: 4, month: 10, name: "São Francisco de Assis", description: "Fundador da Ordem Franciscana" },
    { day: 13, month: 10, name: "Nossa Senhora de Fátima", description: "Última aparição de Fátima", celebration: "Peregrinação a Fátima" },
    
    { day: 1, month: 11, name: "Todos os Santos", description: "Solenidade de Todos os Santos" },
    { day: 2, month: 11, name: "Fiéis Defuntos", description: "Dia de Finados", celebration: "Visita aos cemitérios" },
    { day: 11, month: 11, name: "São Martinho", description: "Bispo de Tours", celebration: "Magusto, castanhas e vinho novo" },
    
    { day: 8, month: 12, name: "Imaculada Conceição", description: "Padroeira de Portugal" },
    { day: 13, month: 12, name: "Santa Luzia", description: "Virgem e Mártir, protetora da visão" },
    { day: 25, month: 12, name: "Natal", description: "Nascimento de Jesus Cristo" },
  ];

  // Receitas tradicionais por mês/estação
  private readonly RECIPES: Recipe[] = [
    {
      month: 1,
      season: "Inverno",
      name: "Caldo Verde",
      description: "Sopa tradicional portuguesa com couve galega",
      ingredients: ["Batatas", "Couve galega", "Chouriço", "Azeite", "Alho", "Sal"],
      region: "Minho",
    },
    {
      month: 2,
      season: "Inverno",
      name: "Feijoada à Portuguesa",
      description: "Prato tradicional de feijão com carnes",
      ingredients: ["Feijão vermelho", "Carnes de porco", "Chouriço", "Morcela", "Arroz"],
      region: "Nacional",
    },
    {
      month: 3,
      season: "Primavera",
      name: "Açorda Alentejana",
      description: "Prato típico alentejano com pão",
      ingredients: ["Pão alentejano", "Alho", "Coentros", "Ovos", "Azeite"],
      region: "Alentejo",
    },
    {
      month: 4,
      season: "Primavera",
      name: "Borrego Assado",
      description: "Borrego assado no forno, tradição pascal",
      ingredients: ["Borrego", "Alho", "Vinho branco", "Banha", "Batatas"],
      region: "Beira Interior",
    },
    {
      month: 5,
      season: "Primavera",
      name: "Sardinhas Assadas",
      description: "Sardinhas grelhadas na brasa",
      ingredients: ["Sardinhas frescas", "Sal grosso", "Pimento", "Pão"],
      region: "Litoral",
    },
    {
      month: 6,
      season: "Verão",
      name: "Canja de Galinha",
      description: "Sopa leve de galinha com arroz",
      ingredients: ["Galinha", "Arroz", "Cenoura", "Hortelã", "Limão"],
      region: "Nacional",
    },
    {
      month: 7,
      season: "Verão",
      name: "Gaspacho Alentejano",
      description: "Sopa fria de tomate",
      ingredients: ["Tomate", "Pepino", "Pimento", "Alho", "Pão", "Azeite", "Vinagre"],
      region: "Alentejo",
    },
    {
      month: 8,
      season: "Verão",
      name: "Arroz de Marisco",
      description: "Arroz caldoso com mariscos frescos",
      ingredients: ["Arroz", "Amêijoas", "Camarão", "Lagosta", "Tomate", "Coentros"],
      region: "Litoral",
    },
    {
      month: 9,
      season: "Outono",
      name: "Polvo à Lagareiro",
      description: "Polvo assado com batatas a murro",
      ingredients: ["Polvo", "Batatas", "Alho", "Azeite", "Coentros"],
      region: "Nacional",
    },
    {
      month: 10,
      season: "Outono",
      name: "Castanhas Assadas",
      description: "Castanhas assadas na brasa",
      ingredients: ["Castanhas", "Sal grosso"],
      region: "Trás-os-Montes",
    },
    {
      month: 11,
      season: "Outono",
      name: "Carne de Porco à Alentejana",
      description: "Carne de porco com amêijoas",
      ingredients: ["Carne de porco", "Amêijoas", "Batatas", "Alho", "Coentros", "Vinho branco"],
      region: "Alentejo",
    },
    {
      month: 12,
      season: "Inverno",
      name: "Bacalhau Cozido",
      description: "Bacalhau cozido com batatas e couves",
      ingredients: ["Bacalhau", "Batatas", "Couves", "Ovos", "Grão", "Azeite"],
      region: "Nacional",
    },
  ];

  // Festas, feiras e romarias
  private readonly FOLK_TRADITIONS: FolkTradition[] = [
    {
      name: "Festas de Santo António",
      date: "06-13",
      month: 6,
      location: "Lisboa",
      region: "Lisboa",
      type: "festa",
      description: "Marchas populares, sardinhas assadas e bailaricos nos bairros típicos de Lisboa",
    },
    {
      name: "Festas de São João",
      date: "06-23",
      month: 6,
      location: "Porto",
      region: "Porto",
      type: "festa",
      description: "Martelinhos, cascatas, sardinhas e saltos sobre fogueiras no Porto",
    },
    {
      name: "Festa de São Pedro",
      date: "06-29",
      month: 6,
      location: "Sintra",
      region: "Lisboa",
      type: "festa",
      description: "Procissões e festas populares em honra de São Pedro",
    },
    {
      name: "Peregrinação de Fátima",
      date: "05-13",
      month: 5,
      location: "Fátima",
      region: "Santarém",
      type: "romaria",
      description: "Grande peregrinação ao Santuário de Fátima",
    },
    {
      name: "Romaria de Nossa Senhora da Agonia",
      month: 8,
      location: "Viana do Castelo",
      region: "Minho",
      type: "romaria",
      description: "Uma das maiores romarias de Portugal com procissões, gigantones e mordomia",
    },
    {
      name: "Feira de São Mateus",
      month: 9,
      location: "Viseu",
      region: "Beira Alta",
      type: "feira",
      description: "Uma das feiras mais antigas de Portugal, com mais de 600 anos",
    },
    {
      name: "Feira da Ladra",
      month: 1,
      location: "Lisboa",
      region: "Lisboa",
      type: "feira",
      description: "Mercado de antiguidades e velharias, terças e sábados no Campo de Santa Clara (evento permanente)",
    },
    {
      name: "Magusto de São Martinho",
      date: "11-11",
      month: 11,
      location: "Nacional",
      region: "Nacional",
      type: "tradição",
      description: "Assar castanhas e provar o vinho novo por todo o país",
    },
    {
      name: "Queima das Fitas",
      month: 5,
      location: "Coimbra",
      region: "Coimbra",
      type: "festa",
      description: "Celebração académica dos finalistas universitários",
    },
    {
      name: "Carnaval",
      month: 2,
      location: "Torres Vedras / Loulé",
      region: "Nacional",
      type: "festa",
      description: "Desfiles carnavalescos e festas populares",
    },
  ];

  // Superstições e crenças populares
  private readonly SUPERSTITIONS: Superstition[] = [
    {
      category: "lua",
      text: "Lua cheia é boa para plantar o que cresce acima da terra, lua nova para o que cresce abaixo.",
    },
    {
      category: "lua",
      text: "Não se deve cortar o cabelo em lua minguante, senão cai todo.",
    },
    {
      category: "tempo",
      text: "Céu vermelho ao anoitecer, bom tempo há de aparecer. Céu vermelho pela manhã, chuva vem sem tardar.",
    },
    {
      category: "tempo",
      text: "Andorinhas voam baixo, chuva ou trovoada.",
    },
    {
      category: "saúde",
      text: "Chá de tília acalma os nervos e ajuda a dormir.",
    },
    {
      category: "saúde",
      text: "Alho cru em jejum afasta constipações e problemas de coração.",
    },
    {
      category: "agricultura",
      text: "Semear feijão com a lua crescente dá vagens cheias.",
    },
    {
      category: "sorte",
      text: "Encontrar um trevo de quatro folhas dá sorte.",
    },
    {
      category: "sorte",
      text: "Vassoura atrás da porta afasta as visitas indesejadas.",
    },
  ];

  /**
   * Get proverbs for a specific month
   */
  getProverbsForMonth(month: number): string[] {
    const monthData = this.MONTHLY_PROVERBS.find((m) => m.month === month);
    return monthData?.proverbs || [];
  }

  /**
   * Get current month's proverbs
   */
  getCurrentMonthProverbs(): string[] {
    const currentMonth = new Date().getMonth() + 1;
    return this.getProverbsForMonth(currentMonth);
  }

  /**
   * Get saint for a specific day
   */
  getSaintOfDay(day: number, month: number): Saint | null {
    return this.SAINTS.find((s) => s.day === day && s.month === month) || null;
  }

  /**
   * Get today's saint
   */
  getTodaysSaint(): Saint | null {
    const today = new Date();
    return this.getSaintOfDay(today.getDate(), today.getMonth() + 1);
  }

  /**
   * Get all saints for a month
   */
  getSaintsForMonth(month: number): Saint[] {
    return this.SAINTS.filter((s) => s.month === month);
  }

  /**
   * Get recipe for a specific month
   */
  getRecipeForMonth(month: number): Recipe | null {
    return this.RECIPES.find((r) => r.month === month) || null;
  }

  /**
   * Get current month's recipe
   */
  getCurrentMonthRecipe(): Recipe | null {
    const currentMonth = new Date().getMonth() + 1;
    return this.getRecipeForMonth(currentMonth);
  }

  /**
   * Get folk traditions for a month
   */
  getTraditionsForMonth(month: number): FolkTradition[] {
    return this.FOLK_TRADITIONS.filter((t) => t.month === month);
  }

  /**
   * Get upcoming traditions (next 30 days)
   */
  getUpcomingTraditions(): FolkTradition[] {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    return this.FOLK_TRADITIONS.filter(
      (t) => t.month === currentMonth || t.month === nextMonth
    );
  }

  /**
   * Get superstitions by category
   */
  getSuperstitions(category?: string): Superstition[] {
    if (category) {
      return this.SUPERSTITIONS.filter((s) => s.category === category);
    }
    return this.SUPERSTITIONS;
  }

  /**
   * Get random proverb from current month
   */
  getRandomCurrentProverb(): string {
    const proverbs = this.getCurrentMonthProverbs();
    return proverbs[Math.floor(Math.random() * proverbs.length)] || "";
  }

  /**
   * Get daily wisdom (santo, provérbio, receita)
   */
  getDailyWisdom() {
    return {
      saint: this.getTodaysSaint(),
      proverb: this.getRandomCurrentProverb(),
      recipe: this.getCurrentMonthRecipe(),
      traditions: this.getUpcomingTraditions(),
    };
  }
}

export const wisdomService = new WisdomService();
