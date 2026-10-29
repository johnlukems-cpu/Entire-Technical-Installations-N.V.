// Webserver voor de ETI-website: serveert de statische build (dist/) en verwerkt
// offerteaanvragen via POST /api/offerte.
// (Op Vercel wordt deze server niet gebruikt; zie api/offerte.mjs en vercel.json.)
import express from 'express';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createQuoteHandler, wantsJsonResponse, redirectFor, MSG } from './offerte.mjs';

export { mailConfigFromEnv } from './offerte.mjs';

/** SHA-256-hashes van eventuele inline scripts in de build, voor een strikte Content-Security-Policy. */
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

/**
 * @param {{ distDir: string, mail?: any, transporter?: any, minFillMs?: number,
 *           rateLimit?: { windowMs: number, max: number }, turnstileSecret?: string,
 *           trustProxy?: string | boolean | number, logger?: Console }} opts
 */
export function createApp(opts) {
  const { distDir, turnstileSecret, trustProxy = false } = opts;
  const handleQuote = createQuoteHandler(opts);
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  const scriptHashes = inlineScriptHashes(distDir);
  const turnstile = turnstileSecret ? ' https://challenges.cloudflare.com' : '';
  const csp = [
    "default-src 'self'",
    `script-src 'self'${scriptHashes.length ? ' ' + scriptHashes.join(' ') : ''}${turnstile}`,
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
    const { status, payload } = await handleQuote(req.body, req.ip);
    if (wantsJsonResponse(req.get('content-type'), req.get('accept'))) return res.status(status).json(payload);
    return res.redirect(303, redirectFor(payload));
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
