/**
 * Klantbeoordelingen.
 *
 * Voeg alleen echte beoordelingen toe, met toestemming van de klant.
 * Zolang deze lijst leeg is, wordt de sectie met klantervaringen niet getoond.
 */
export interface Testimonial {
  quote: string;
  name: string;
  context?: string; // bijv. 'Particuliere klant, Paramaribo' of bedrijfsnaam
}

export const testimonials: Testimonial[] = [];
