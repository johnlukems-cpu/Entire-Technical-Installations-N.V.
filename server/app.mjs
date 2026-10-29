// Webserver voor de ETI-website: serveert de statische build (dist/) en verwerkt
// offerteaanvragen via POST /api/offerte.
import express from 'express';
import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateQuote, labelFor, SERVICE_OPTIONS, CONTACT_OPTIONS } from '../shared/validation.mjs';

const MSG = {
  generic:
    'Uw aanvraag kon niet worden verzonden. Probeer het later opnieuw of neem telefonisch of per e-mail contact met ons op.',
  invalid: 'Niet alle velden zijn correct ingevuld. Controleer de gemarkeerde velden.',
  tooFast: 'Uw aanvraag werd te snel verzonden. Wacht een paar seconden en probeer het opnieuw.',
  rateLimit: 'U heeft te veel aanvragen achter elkaar verstuurd. Probeer het over enkele minuten opnieuw.',
  captcha: 'De beveiligingscontrole is niet gelukt. Probeer het opnieuw.',
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

/** SHA-256-hashes van inline scripts in de build, voor een strikte Content-Security-Policy. */
function inlineScriptHashes(dir) {
  const hashes = new Set();
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        const html = readFileSync(p, 'utf8');
        for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
          if (/type="application\/ld\+json"/.test(m[1])) continue;
          hashes.add(`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`);
        }
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return [...hashes];
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
 * @param {{ distDir: string, mail?: ReturnType<typeof mailConfigFromEnv>, transporter?: any,
 *           minFillMs?: number, rateLimit?: { windowMs: number, max: number },
 *           turnstileSecret?: string, trustProxy?: string | boolean, logger?: Console }} opts
 */
export function createApp(opts) {
  const {
    distDir,
    mail = null,
    minFillMs = 3000,
    rateLimit = { windowMs: 10 * 60 * 1000, max: 5 },
    turnstileSecret,
    trustProxy = false,
    logger = console,
  } = opts;
  const transporter = opts.transporter ?? (mail ? nodemailer.createTransport(mail.transport) : null);
  const allow = rateLimiter(rateLimit);
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  const scriptHashes = inlineScriptHashes(distDir);
  const turnstile = turnstileSecret ? ' https://challenges.cloudflare.com' : '';
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(' ')}${turnstile}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src${turnstile || " 'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  const parsers = [express.json({ limit: '20kb' }), express.urlencoded({ extended: false, limit: '20kb' })];

  app.post('/api/offerte', ...parsers, async (req, res) => {
    const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');
    const reply = (status, payload) => {
      if (wantsJson) return res.status(status).json(payload);
      return res.redirect(303, payload.ok ? '/offerte-verzonden/' : '/offerte-mislukt/');
    };
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (!allow(req.ip || 'onbekend')) return reply(429, { ok: false, message: MSG.rateLimit });

    // Honeypot: dit veld is onzichtbaar en wordt alleen door bots ingevuld.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      logger.warn('[offerte] geweigerd: honeypot ingevuld');
      return reply(400, { ok: false, message: MSG.generic });
    }
    const t = Number(body._t);
    if (body._t && Number.isFinite(t) && Date.now() - t < minFillMs) {
      return reply(400, { ok: false, message: MSG.tooFast });
    }

    const { ok, errors, data } = validateQuote(body);
    if (!ok) return reply(422, { ok: false, message: MSG.invalid, errors });

    if (turnstileSecret) {
      const passed = await verifyTurnstile(turnstileSecret, body['cf-turnstile-response'], req.ip);
      if (!passed) return reply(400, { ok: false, message: MSG.captcha });
    }

    if (!transporter || !mail) {
      logger.error('[offerte] geen mailconfiguratie (SMTP_HOST, MAIL_FROM, MAIL_TO) – aanvraag NIET afgeleverd');
      return reply(503, { ok: false, message: MSG.unavailable });
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
      return reply(200, { ok: true });
    } catch (err) {
      logger.error('[offerte] verzenden mislukt:', err?.message ?? err);
      return reply(502, { ok: false, message: MSG.generic });
    }
  });

  app.all('/api/{*rest}', (_req, res) => res.status(404).json({ ok: false, message: 'Niet gevonden.' }));

  app.use(
    express.static(distDir, {
      extensions: ['html'],
      setHeaders(res, path) {
        if (/[\\/]_astro[\\/]/.test(path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else if (/\.(png|webp|jpg|svg|ico|woff2?)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=604800');
        else res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      },
    }),
  );

  const notFound = join(distDir, '404.html');
  app.use((_req, res) => {
    res.status(404);
    if (existsSync(notFound)) res.sendFile(notFound);
    else res.type('text').send('Pagina niet gevonden');
  });

  // Fouten in verzoeken (bijv. ongeldige JSON of te grote body)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (req.path.startsWith('/api/')) return res.status(status).json({ ok: false, message: MSG.generic });
    res.status(status).type('text').send('Er is een fout opgetreden.');
  });

  return app;
}
