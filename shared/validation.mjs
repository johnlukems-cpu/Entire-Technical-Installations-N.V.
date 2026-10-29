// Gedeelde validatie voor het offerteformulier (gebruikt in de browser én op de server).

export const SERVICE_OPTIONS = [
  { value: 'elektrische-installaties', label: 'Elektrische installaties' },
  { value: 'airconditioning-en-koeling', label: 'Airconditioning en koeling' },
  { value: 'waterinstallaties-en-sanitair', label: 'Waterinstallaties en sanitair' },
  { value: 'gas-en-verwarmingsinstallaties', label: 'Gas- en verwarmingsinstallaties' },
  { value: 'alarminstallaties-en-beveiliging', label: 'Alarminstallaties en beveiligingssystemen' },
  { value: 'technisch-onderhoud-en-storingsservice', label: 'Technisch onderhoud en storingsservice' },
  { value: 'meerdere-of-onbekend', label: 'Meerdere diensten / weet ik nog niet' },
];

export const CONTACT_OPTIONS = [
  { value: 'telefoon', label: 'Telefonisch' },
  { value: 'email', label: 'Per e-mail' },
  { value: 'whatsapp', label: 'Via WhatsApp' },
];

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[+()\d\s.-]{7,25}$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Valideert de formuliergegevens.
 * @param {Record<string, unknown>} input
 * @returns {{ ok: boolean, errors: Record<string, string>, data: Record<string, string> }}
 */
export function validateQuote(input) {
  const data = {
    naam: str(input.naam),
    bedrijf: str(input.bedrijf),
    email: str(input.email),
    telefoon: str(input.telefoon),
    dienst: str(input.dienst),
    locatie: str(input.locatie),
    omschrijving: str(input.omschrijving),
    contactmethode: str(input.contactmethode),
    privacy: str(input.privacy),
  };
  const errors = {};

  if (!data.naam) errors.naam = 'Vul uw naam in.';
  else if (data.naam.length < 2) errors.naam = 'Uw naam moet minimaal 2 tekens bevatten.';
  else if (data.naam.length > 100) errors.naam = 'Uw naam mag maximaal 100 tekens bevatten.';

  if (data.bedrijf.length > 150) errors.bedrijf = 'De bedrijfsnaam mag maximaal 150 tekens bevatten.';

  if (!data.email) errors.email = 'Vul uw e-mailadres in.';
  else if (data.email.length > 200 || !EMAIL_RE.test(data.email))
    errors.email = 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.com.';

  const digits = data.telefoon.replace(/\D/g, '');
  if (!data.telefoon) errors.telefoon = 'Vul uw telefoonnummer in.';
  else if (!PHONE_RE.test(data.telefoon) || digits.length < 7 || digits.length > 15)
    errors.telefoon = 'Vul een geldig telefoonnummer in, bijvoorbeeld +597 123 4567.';

  if (!data.dienst) errors.dienst = 'Kies de gewenste dienst.';
  else if (!SERVICE_OPTIONS.some((o) => o.value === data.dienst)) errors.dienst = 'Kies een geldige dienst uit de lijst.';

  if (!data.locatie) errors.locatie = 'Vul de locatie van het project in.';
  else if (data.locatie.length < 2) errors.locatie = 'De locatie moet minimaal 2 tekens bevatten.';
  else if (data.locatie.length > 150) errors.locatie = 'De locatie mag maximaal 150 tekens bevatten.';

  if (!data.omschrijving) errors.omschrijving = 'Omschrijf kort uw aanvraag.';
  else if (data.omschrijving.length < 10) errors.omschrijving = 'Geef een iets uitgebreidere omschrijving (minimaal 10 tekens).';
  else if (data.omschrijving.length > 3000) errors.omschrijving = 'De omschrijving mag maximaal 3000 tekens bevatten.';

  if (!data.contactmethode) errors.contactmethode = 'Kies hoe wij contact met u mogen opnemen.';
  else if (!CONTACT_OPTIONS.some((o) => o.value === data.contactmethode))
    errors.contactmethode = 'Kies een geldige contactmethode.';

  if (!['ja', 'on', 'true'].includes(data.privacy))
    errors.privacy = 'Geef toestemming voor het verwerken van uw gegevens om de aanvraag te kunnen versturen.';

  return { ok: Object.keys(errors).length === 0, errors, data };
}

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label ?? value;
