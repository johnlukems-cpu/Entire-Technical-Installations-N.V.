/**
 * Projecten.
 *
 * Voeg hier uitsluitend ECHTE, gerealiseerde projecten toe. Zolang de lijst leeg
 * is, toont de projectenpagina per dienst een duidelijk herkenbare plaatshouder.
 *
 * Voorbeeld:
 * {
 *   slug: 'kantoor-elektra-paramaribo',
 *   title: 'Nieuwe elektrische installatie kantoorpand',
 *   service: 'elektrische-installaties',
 *   location: 'Paramaribo',
 *   year: '2026',
 *   summary: 'Korte omschrijving van het project.',
 *   body: ['Alinea 1', 'Alinea 2'],
 *   image: '/images/projecten/kantoor-elektra.webp', // plaats foto in public/images/projecten/
 *   imageAlt: 'Omschrijving van de foto',
 * }
 */
export interface Project {
  slug: string;
  title: string;
  service: string; // slug uit services.ts
  location?: string;
  year?: string;
  summary: string;
  body: string[];
  image?: string;
  imageAlt?: string;
}

export const projects: Project[] = [];
