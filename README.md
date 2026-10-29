# Website Entire Technical Installations N.V. (ETI N.V.)

Nederlandstalige bedrijfswebsite voor ETI N.V. — *Quality Installations & Reliable Solutions*.

- **Frontend:** [Astro](https://astro.build) (statische HTML, nauwelijks JavaScript), eigen componenten en huisstijl.
- **Backend:** kleine Node/Express-server (`server/`) die de gebouwde site serveert en het offerteformulier
  afhandelt via SMTP (nodemailer).
- **Lettertypen:** Montserrat (koppen) en Inter (tekst), zelf gehost — geen externe verzoeken.

## Snel starten

```bash
npm install
cp .env.example .env      # vul de gegevens in
npm run build             # type-check + productiebuild naar dist/
npm start                 # server op http://localhost:4321
npm test                  # tests van het offerteformulier
```

`npm run dev` start de Astro-ontwikkelserver voor het werken aan de vormgeving. Het formulier
(`/api/offerte`) werkt alleen via `npm start`, omdat de API in de Node-server zit.

## Pagina's

| URL | Inhoud |
| --- | --- |
| `/` | Hero, zes diensten, over ons, waarom ETI, projecten, oproep tot actie |
| `/over-ons/` | Bedrijfsprofiel, betekenis van de logosymbolen, kernwaarden, bedrijfsgegevens |
| `/diensten/` + 6 detailpagina's | Alle diensten met werkzaamheden en offerteknop (dienst vooraf geselecteerd) |
| `/projecten/` | Projectgalerij met categoriefilter (nu plaatshouders) |
| `/waarom-eti/` | Kernpunten, één aanspreekpunt, werkwijze |
| `/contact/` | Offerteformulier en contactgegevens |
| `/privacyverklaring/`, `/algemene-voorwaarden/` | Juridische pagina's (concept / plaatshouder) |

Daarnaast: `sitemap-index.xml`, `robots.txt`, favicon, webmanifest, 404-pagina en
bevestigings-/foutpagina's voor bezoekers zonder JavaScript.

## Inhoud aanpassen

Alle bedrijfsinhoud staat los van de vormgeving in `src/data/`:

| Bestand | Wat |
| --- | --- |
| `site.ts` | Telefoon, WhatsApp, e-mail, adres, openingstijden, sociale media, oprichtingsjaar, KKF-nummer, certificeringen. `null` = "Volgt binnenkort"-plaatshouder. |
| `services.ts` | De zes diensten (teksten, werkzaamheden, SEO-titels). |
| `projects.ts` | Echte projecten. Elk project krijgt automatisch een detailpagina `/projecten/<slug>/`. |
| `testimonials.ts` | Echte klantbeoordelingen. Zolang de lijst leeg is, wordt de sectie verborgen. |
| `content.ts` | Kernwaarden, "Waarom ETI" en werkwijze. |

Hero-foto: zet een foto in `public/images/` en vul `heroImage` in `src/components/Hero.astro` in.

Na elke wijziging: `npm run build` en de server herstarten.

## Offerteformulier

- Validatie in de browser én op de server (`shared/validation.mjs`), met Nederlandstalige meldingen.
- Spambescherming: honeypotveld, minimale invultijd, rate limiting per IP (5 per 10 minuten),
  limiet op berichtgrootte, optioneel Cloudflare Turnstile.
- Een succesmelding verschijnt **alleen** als de mailserver het bericht heeft geaccepteerd.
  Is SMTP niet ingesteld of onbereikbaar, dan krijgt de bezoeker een duidelijke foutmelding
  ("Uw aanvraag is níet verzonden") met het advies telefonisch of per e-mail contact op te nemen.
- De e-mail bevat alle velden; *Antwoorden* gaat direct naar de klant (Reply-To).
- Werkt ook zonder JavaScript (doorverwijzing naar `/offerte-verzonden/` of `/offerte-mislukt/`).

## Beveiliging

Strikte Content-Security-Policy (hashes van inline scripts worden bij het starten automatisch berekend),
`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS achter HTTPS.
Geen API-sleutels of wachtwoorden in de frontend; alle geheimen staan in `.env` op de server.

## Publiceren

Iedere host met Node.js 20+ volstaat (VPS, Render, Railway, Fly.io, enz.):

1. `npm ci && SITE_URL=https://www.uwdomein.sr npm run build`
2. Omgevingsvariabelen instellen (zie `.env.example`).
3. `npm start` (bij voorkeur achter een reverse proxy met HTTPS; zet dan `TRUST_PROXY=1`).
