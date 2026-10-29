export type IconName =
  | 'zap'
  | 'snowflake'
  | 'droplet'
  | 'flame'
  | 'bell-ring'
  | 'wrench';

export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  icon: IconName;
  /** Kleuraccent, afgeleid van het symbool in het ETI-logo. */
  accent: 'yellow' | 'blue' | 'red' | 'navy';
  /** Symbool in het logo waar deze dienst bij hoort. */
  logoSymbol: string;
  summary: string;
  description: string;
  tasks: string[];
  seoTitle: string;
  seoDescription: string;
  /** Extra toelichting voor de detailpagina. */
  details: { heading: string; text: string }[];
}

export const services: Service[] = [
  {
    slug: 'elektrische-installaties',
    title: 'Elektrische installaties',
    shortTitle: 'Elektra',
    icon: 'zap',
    accent: 'yellow',
    logoSymbol: 'bliksemschicht',
    summary:
      'Nieuwe installaties, bekabeling, verdeelkasten, uitbreidingen en onderhoud voor woningen en bedrijfspanden.',
    description:
      'Wij verzorgen professionele elektrische installaties voor woningen en bedrijfspanden. Van nieuwe bekabeling en verdeelkasten tot uitbreidingen, aanpassingen en onderhoud. Veiligheid, kwaliteit en een betrouwbare werking staan centraal.',
    tasks: [
      'Nieuwe elektrische installaties.',
      'Bekabeling en verdeelkasten.',
      'Uitbreiding en modernisering van installaties.',
      'Storingen opsporen en verhelpen.',
      'Onderhoud van elektrische systemen.',
    ],
    seoTitle: 'Elektrische installaties in Suriname',
    seoDescription:
      'Elektrische installaties in Suriname voor woningen en bedrijven: nieuwe bekabeling, verdeelkasten, uitbreidingen, storingen en onderhoud door ETI N.V.',
    details: [
      {
        heading: 'Voor nieuwbouw, renovatie en uitbreiding',
        text: 'Of het nu gaat om een nieuwe woning, een kantoor dat wordt verbouwd of een bedrijfspand dat meer capaciteit nodig heeft: wij bekijken samen met u wat de installatie moet kunnen en stemmen de uitvoering daarop af.',
      },
      {
        heading: 'Storingen gericht opsporen',
        text: 'Valt de stroom regelmatig uit of werkt een groep niet zoals verwacht? Wij zoeken de oorzaak op een gestructureerde manier en bespreken met u de mogelijke oplossingen.',
      },
    ],
  },
  {
    slug: 'airconditioning-en-koeling',
    title: 'Airconditioning en koeling',
    shortTitle: 'Airco & koeling',
    icon: 'snowflake',
    accent: 'blue',
    logoSymbol: 'sneeuwvlok',
    summary:
      'Installatie, onderhoud, reiniging en reparatie van airconditioning- en koelsystemen voor een comfortabel binnenklimaat.',
    description:
      'Wij bieden betrouwbare oplossingen voor airconditioning en koeling. Onze diensten zijn gericht op een comfortabel binnenklimaat en een goede werking van klimaatsystemen in woningen, kantoren en bedrijfspanden.',
    tasks: [
      'Installatie van airconditioningsystemen.',
      'Onderhoud en reiniging.',
      'Reparatie en storingsdiagnose.',
      'Advies over geschikte koelsystemen.',
      'Vervanging en uitbreiding van bestaande systemen.',
    ],
    seoTitle: 'Airconditioning installeren in Suriname',
    seoDescription:
      'Airconditioning laten installeren, onderhouden of repareren in Suriname? ETI N.V. adviseert en verzorgt koelsystemen voor woningen, kantoren en bedrijfspanden.',
    details: [
      {
        heading: 'Het juiste systeem voor uw ruimte',
        text: 'De keuze voor een airconditioningsysteem hangt af van de grootte van de ruimte, het gebruik en uw wensen. Wij denken met u mee over een passende oplossing.',
      },
      {
        heading: 'Regelmatig onderhoud',
        text: 'Een goed onderhouden systeem koelt beter en gaat langer mee. Wij reinigen en controleren uw installatie en signaleren tijdig onderdelen die aandacht nodig hebben.',
      },
    ],
  },
  {
    slug: 'waterinstallaties-en-sanitair',
    title: 'Waterinstallaties en sanitair',
    shortTitle: 'Water & sanitair',
    icon: 'droplet',
    accent: 'blue',
    logoSymbol: 'waterdruppel',
    summary:
      'Waterleidingen, sanitaire voorzieningen, aansluitingen en het opsporen en herstellen van lekkages.',
    description:
      'Wij verzorgen waterleidingen, sanitaire aansluitingen en andere watertechnische installaties voor woningen en bedrijven. Daarbij richten wij ons op een betrouwbare watervoorziening en een zorgvuldige uitvoering.',
    tasks: [
      'Aanleggen en aanpassen van waterleidingen.',
      'Installatie van sanitaire voorzieningen.',
      'Aansluiten van watertechnische apparatuur.',
      'Opsporen en herstellen van lekkages.',
      'Onderhoud en reparatie.',
    ],
    seoTitle: 'Loodgieterswerk en waterinstallaties in Suriname',
    seoDescription:
      'Loodgieterswerk in Suriname: waterleidingen aanleggen, sanitair installeren en lekkages opsporen en herstellen door ETI N.V.',
    details: [
      {
        heading: 'Van nieuwe leidingen tot sanitair',
        text: 'Wij leggen waterleidingen aan of passen bestaande leidingen aan, bijvoorbeeld bij een verbouwing van keuken of badkamer, en sluiten sanitaire voorzieningen zorgvuldig aan.',
      },
      {
        heading: 'Lekkages aanpakken',
        text: 'Een lekkage kan veel schade veroorzaken. Wij helpen de bron op te sporen en zorgen voor een duurzaam herstel.',
      },
    ],
  },
  {
    slug: 'gas-en-verwarmingsinstallaties',
    title: 'Gas- en verwarmingsinstallaties',
    shortTitle: 'Gas & verwarming',
    icon: 'flame',
    accent: 'red',
    logoSymbol: 'vlam',
    summary:
      'Gasleidingen, aansluiting van gastoestellen en installatie en onderhoud van verwarmingssystemen.',
    description:
      'Wij verzorgen gas- en verwarmingsinstallaties met aandacht voor veiligheid, correcte aansluiting en betrouwbare werking. Alle werkzaamheden moeten voldoen aan de toepasselijke veiligheidsvoorschriften.',
    tasks: [
      'Aanleggen van gasleidingen.',
      'Aansluiten van gastoestellen.',
      'Installatie en onderhoud van verwarmingssystemen.',
      'Controle en opsporing van storingen.',
      'Reparatie en aanpassing van bestaande installaties.',
    ],
    seoTitle: 'Gasinstallaties in Suriname',
    seoDescription:
      'Gasinstallaties in Suriname: gasleidingen aanleggen, gastoestellen aansluiten en verwarmingssystemen installeren en onderhouden door ETI N.V.',
    details: [
      {
        heading: 'Veiligheid voorop',
        text: 'Bij gasinstallaties is een correcte aansluiting essentieel. Wij werken zorgvuldig en volgens de toepasselijke veiligheidsvoorschriften.',
      },
      {
        heading: 'Controle en onderhoud',
        text: 'Wij controleren bestaande installaties, sporen storingen op en voeren reparaties of aanpassingen uit waar dat nodig is.',
      },
    ],
  },
  {
    slug: 'alarminstallaties-en-beveiliging',
    title: 'Alarminstallaties en beveiligingssystemen',
    shortTitle: 'Alarm & beveiliging',
    icon: 'bell-ring',
    accent: 'red',
    logoSymbol: 'alarmbel',
    summary:
      'Advies, installatie, configuratie, testen en onderhoud van inbraakalarmsystemen voor particulieren en bedrijven.',
    description:
      'Wij helpen particulieren en bedrijven hun eigendommen beter te beveiligen met professionele alarminstallaties. Van advies en installatie tot configuratie, testen en onderhoud: wij bieden beveiligingsoplossingen die aansluiten op de situatie en wensen van de klant.',
    tasks: [
      'Installatie van inbraakalarmsystemen.',
      'Plaatsing van sensoren en detectoren.',
      'Configuratie en testen van alarmsystemen.',
      'Onderhoud en reparatie.',
      'Uitbreiding en modernisering van bestaande alarmsystemen.',
    ],
    seoTitle: 'Alarminstallaties en beveiligingssystemen in Suriname',
    seoDescription:
      'Alarminstallaties in Suriname: ETI N.V. adviseert, installeert, configureert en onderhoudt inbraakalarmsystemen voor woningen en bedrijven.',
    details: [
      {
        heading: 'Afgestemd op uw situatie',
        text: 'Elke woning en elk bedrijfspand is anders. Wij bekijken samen met u waar sensoren en detectoren het meest effectief zijn en welk systeem bij uw wensen past.',
      },
      {
        heading: 'Getest en goed ingesteld',
        text: 'Na de installatie configureren en testen wij het alarmsysteem en leggen wij uit hoe u het bedient. Ook voor onderhoud, reparatie en uitbreiding kunt u bij ons terecht.',
      },
    ],
  },
  {
    slug: 'technisch-onderhoud-en-storingsservice',
    title: 'Technisch onderhoud en storingsservice',
    shortTitle: 'Onderhoud & storingen',
    icon: 'wrench',
    accent: 'navy',
    logoSymbol: 'alle symbolen',
    summary:
      'Preventief onderhoud, inspecties, storingsdiagnose en reparaties om technische installaties betrouwbaar te houden.',
    description:
      'Goed onderhoud helpt storingen voorkomen en verlengt de levensduur van technische installaties. Wij ondersteunen klanten bij het controleren, onderhouden en oplossen van technische problemen.',
    tasks: [
      'Preventief onderhoud.',
      'Technische storingsdiagnose.',
      'Inspectie van installaties.',
      'Reparaties en vervanging van onderdelen.',
      'Aanpassingen en verbeteringen.',
    ],
    seoTitle: 'Technisch onderhoud in Suriname',
    seoDescription:
      'Technisch onderhoud en storingsservice in Suriname: preventief onderhoud, inspecties, storingsdiagnose en reparaties door ETI N.V.',
    details: [
      {
        heading: 'Voorkomen is beter dan verhelpen',
        text: 'Met preventief onderhoud worden slijtage en kleine gebreken vaak op tijd ontdekt. Zo beperkt u de kans op onverwachte storingen.',
      },
      {
        heading: 'Eén aanspreekpunt',
        text: 'Omdat wij werken aan elektrische, klimaat-, water-, gas- en alarminstallaties, kunt u voor onderhoud aan verschillende technische systemen bij één partij terecht.',
      },
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
