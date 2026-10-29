export interface Feature {
  icon: string;
  title: string;
  text: string;
}

/** Kernwaarden (Over ons). */
export const coreValues: Feature[] = [
  {
    icon: 'award',
    title: 'Kwaliteit en betrouwbaarheid',
    text: 'Wij streven naar zorgvuldig uitgevoerde werkzaamheden en betrouwbare technische oplossingen.',
  },
  {
    icon: 'shield-check',
    title: 'Veiligheid en professionaliteit',
    text: 'Wij besteden aandacht aan veilige werkmethoden en de toepasselijke voorschriften.',
  },
  {
    icon: 'handshake',
    title: 'Klantgerichte dienstverlening',
    text: 'Wij luisteren naar de wensen van klanten en communiceren duidelijk over werkzaamheden en planning.',
  },
];

/** Waarom kiezen voor ETI N.V.? */
export const whyEti: Feature[] = [
  {
    icon: 'clipboard-check',
    title: 'Betrouwbaarheid en kwaliteit',
    text: 'Wij streven naar kwalitatief uitgevoerde werkzaamheden en betrouwbare oplossingen die aansluiten op de behoeften van onze klanten.',
  },
  {
    icon: 'message-square-text',
    title: 'Heldere communicatie',
    text: 'Wij zorgen voor duidelijke afspraken en houden klanten op de hoogte van de voortgang en de praktische uitvoering van hun project.',
  },
  {
    icon: 'hard-hat',
    title: 'Vakbekwame technische professionals',
    text: 'Wij richten ons op praktische oplossingen, zorgvuldig werk en aandacht voor veiligheid en detail.',
  },
];

/** Werkwijze: van aanvraag tot oplevering. */
export const processSteps: Feature[] = [
  {
    icon: 'send',
    title: 'Aanvraag',
    text: 'U vertelt ons via het offerteformulier, telefonisch of per e-mail wat u nodig heeft.',
  },
  {
    icon: 'message-square-text',
    title: 'Overleg en advies',
    text: 'Wij nemen contact met u op, stellen aanvullende vragen en bespreken de mogelijkheden.',
  },
  {
    icon: 'clipboard-check',
    title: 'Offerte en planning',
    text: 'U ontvangt een duidelijke offerte en wij maken heldere afspraken over de planning.',
  },
  {
    icon: 'wrench',
    title: 'Uitvoering',
    text: 'Wij voeren de werkzaamheden zorgvuldig uit en houden u op de hoogte van de voortgang.',
  },
];
