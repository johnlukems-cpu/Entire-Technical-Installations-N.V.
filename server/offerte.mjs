// Verwerking van offerteaanvragen, los van de webserver. Wordt gebruikt door de
// Node/Express-server (server/app.mjs) én door de Vercel-functie (api/offerte.mjs).
import nodemailer from 'nodemailer';
import { validateQuote, labelFor, SERVICE_OPTIONS, CONTACT_OPTIONS } from '../shared/validation.mjs';

export const MSG = {
  generic:
    'Uw aanvraag kon niet worden verzonden. Probeer het later opnieuw of neem telefonisch of per e-mail contact met ons op.',
  invalid: 'Niet alle velden zijn correct ingevuld. Controleer de gemarkeerde velden.',
  tooFast: 'Uw aanvraag werd te snel verzonden. Wacht een paar seconden en probeer het opnieuw.',
  rateLimit: 'U heeft te veel aanvragen achter elkaar verstuurd. Probeer het over enkele minuten opnieuw.',
  captcha: 'De beveiligingscontrole is niet gelukt. Probeer het opnieuw.',
  tooLarge: 'Uw aanvraag is te groot. Maak de omschrijving korter en probeer het opnieuw.',
  unavailable:
    'Het offerteformulier is op dit moment niet beschikbaar. Uw aanvraag is níet verzonden. Neem telefonisch of per e-mail contact met ons op.',
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').slice(0, 120);

/** Leest de mailconfiguratie uit omgevingsvariabelen. Geeft null terug als die onvolledig is. */
export function mailConfigFromEnv(env = process.env) {
  if (!env.SMTP_HOST || !env.MAIL_TO || !env.MAIL_FROM) return null;
  return {
    transport: {
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      ...(env.SMTP_IGNORE_TLS === 'true' ? { ignoreTLS: true } : {}),
    },
    from: env.MAIL_FROM,
    to: env.MAIL_TO,
  };
}

/** Eenvoudige rate limiter in het geheugen (per IP-adres). */
function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, windowMs).unref();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return true;
    }
    entry.count++;
    return entry.count <= max;
  };
}

function buildEmail(data) {
  const dienst = labelFor(SERVICE_OPTIONS, data.dienst);
  const methode = labelFor(CONTACT_OPTIONS, data.contactmethode);
  const rows = [
    ['Naam', data.naam],
    ['Bedrijfsnaam', data.bedrijf || '–'],
    ['E-mailadres', data.email],
    ['Telefoonnummer', data.telefoon],
    ['Gewenste dienst', dienst],
    ['Locatie van het project', data.locatie],
    ['Gewenste contactmethode', methode],
  ];
  const text =
    'Nieuwe offerteaanvraag via de website\n\n' +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nOmschrijving:\n${data.omschrijving}\n`;
  const html = `<h2 style="font-family:Arial,sans-serif;color:#082d68">Nieuwe offerteaanvraag via de website</h2>
<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
${rows.map(([k, v]) => `<tr><th align="left" style="background:#f4f7fc">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('\n')}
</table>
<h3 style="font-family:Arial,sans-serif;color:#082d68">Omschrijving</h3>
<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(data.omschrijving)}</p>`;
  return {
    subject: oneLine(`Offerteaanvraag: ${dienst} – ${data.naam}`),
    text,
    html,
  };
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip || '' }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json();
    return body.success === true;
  } catch {
    return false;
  }
}

/**
 * Maakt een functie die één offerteaanvraag verwerkt.
 * Geeft `{ status, payload }` terug; `payload.ok === true` alleen na bevestigde aflevering.
 *
 * @param {{ mail?: ReturnType<typeof mailConfigFromEnv>, transporter?: any, minFillMs?: number,
 *           rateLimit?: { windowMs: number, max: number }, turnstileSecret?: string, logger?: Console }} opts
 */
export function createQuoteHandler(opts = {}) {
  const {
    mail = null,
    minFillMs = 3000,
    rateLimit = { windowMs: 10 * 60 * 1000, max: 5 },
    turnstileSecret,
    logger = console,
  } = opts;
  const transporter = opts.transporter ?? (mail ? nodemailer.createTransport(mail.transport) : null);
  const allow = rateLimiter(rateLimit);

  return async function handleQuote(rawBody, ip) {
    const body = rawBody && typeof rawBody === 'object' ? rawBody : {};

    if (!allow(ip || 'onbekend')) return { status: 429, payload: { ok: false, message: MSG.rateLimit } };

    // Honeypot: dit veld is onzichtbaar en wordt alleen door bots ingevuld.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      logger.warn('[offerte] geweigerd: honeypot ingevuld');
      return { status: 400, payload: { ok: false, message: MSG.generic } };
    }
    const t = Number(body._t);
    if (body._t && Number.isFinite(t) && Date.now() - t < minFillMs) {
      return { status: 400, payload: { ok: false, message: MSG.tooFast } };
    }

    const { ok, errors, data } = validateQuote(body);
    if (!ok) return { status: 422, payload: { ok: false, message: MSG.invalid, errors } };

    if (turnstileSecret) {
      const passed = await verifyTurnstile(turnstileSecret, body['cf-turnstile-response'], ip);
      if (!passed) return { status: 400, payload: { ok: false, message: MSG.captcha } };
    }

    if (!transporter || !mail) {
      logger.error('[offerte] geen mailconfiguratie (SMTP_HOST, MAIL_FROM, MAIL_TO) – aanvraag NIET afgeleverd');
      return { status: 503, payload: { ok: false, message: MSG.unavailable } };
    }

    try {
      const email = buildEmail(data);
      const info = await transporter.sendMail({
        from: mail.from,
        to: mail.to,
        replyTo: { name: oneLine(data.naam), address: data.email },
        ...email,
      });
      const accepted = Array.isArray(info?.accepted) ? info.accepted : [];
      if (accepted.length === 0) throw new Error('Mailserver heeft geen ontvanger geaccepteerd');
      logger.info(`[offerte] afgeleverd (${info.messageId ?? 'zonder id'})`);
      return { status: 200, payload: { ok: true } };
    } catch (err) {
      logger.error('[offerte] verzenden mislukt:', err?.message ?? err);
      return { status: 502, payload: { ok: false, message: MSG.generic } };
    }
  };
}

/** Bepaalt of de client JSON verwacht (fetch) of een gewone formulierpost doet (zonder JavaScript). */
export const wantsJsonResponse = (contentType = '', accept = '') =>
  contentType.includes('application/json') || accept.includes('application/json');

export const redirectFor = (payload) => (payload.ok ? '/offerte-verzonden/' : '/offerte-mislukt/');
