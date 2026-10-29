/**
 * Centrale bedrijfsgegevens.
 *
 * Velden met de waarde `null` zijn nog niet aangeleverd. Op de website verschijnt
 * dan automatisch een herkenbare plaatshouder ("Volgt binnenkort"). Vul de echte
 * gegevens hier in; alle pagina's, de footer en de structured data worden dan
 * automatisch bijgewerkt.
 */
export interface SiteInfo {
  name: string;
  shortName: string;
  slogan: string;
  region: string;
  description: string;
  contact: {
    phone: string | null; // bijv. '+597 123 4567'
    whatsapp: string | null; // internationaal formaat zonder +, bijv. '5971234567'
    email: string | null; // bijv. 'info@uwdomein.sr'
    address: string | null; // bijv. 'Straatnaam 1, Paramaribo'
    openingHours: { days: string; hours: string }[] | null;
  };
  social: { label: string; url: string }[];
  company: {
    founded: string | null;
    kkfNumber: string | null; // inschrijvingsnummer Kamer van Koophandel en Fabrieken
    certifications: string[] | null;
  };
}

export const site: SiteInfo = {
  name: 'Entire Technical Installations N.V.',
  shortName: 'ETI N.V.',
  slogan: 'Quality Installations & Reliable Solutions',
  region: 'Suriname',
  description:
    'ETI N.V. verzorgt elektrische installaties, airconditioning, water-, gas- en alarminstallaties en technisch onderhoud voor woningen en bedrijven in Suriname.',
  contact: {
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    openingHours: null,
  },
  // Voeg sociale media toe zodra deze beschikbaar zijn, bijv.
  // { label: 'Facebook', url: 'https://www.facebook.com/...' }
  social: [],
  company: {
    founded: null,
    kkfNumber: null,
    certifications: null,
  },
};

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Over ons', href: '/over-ons/' },
  { label: 'Diensten', href: '/diensten/' },
  { label: 'Projecten', href: '/projecten/' },
  { label: 'Waarom ETI?', href: '/waarom-eti/' },
  { label: 'Contact', href: '/contact/' },
];

export const PLACEHOLDER_TEXT = 'Volgt binnenkort';
