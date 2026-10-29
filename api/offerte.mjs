// Vercel-functie voor het offerteformulier (POST /api/offerte).
// Gebruikt dezelfde verwerking als de Node-server; zie server/offerte.mjs.
import { createQuoteHandler, mailConfigFromEnv, wantsJsonResponse, redirectFor, MSG } from '../server/offerte.mjs';

const MAX_BODY_CHARS = 20_000;

const handleQuote = createQuoteHandler({
  mail: mailConfigFromEnv(),
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY || undefined,
});

export default async function handler(req, res) {
  const json = wantsJsonResponse(req.headers['content-type'] || '', req.headers.accept || '');
  const send = (status, payload) => {
    if (json) return res.status(status).json(payload);
    res.setHeader('Location', redirectFor(payload));
    return res.status(303).end();
  };

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Methode niet toegestaan.' });
  }

  let body;
  try {
    body = req.body; // Vercel parseert JSON en formuliergegevens automatisch
  } catch {
    return send(400, { ok: false, message: MSG.generic });
  }
  if (typeof body === 'string' || !body || typeof body !== 'object') return send(400, { ok: false, message: MSG.generic });
  if (JSON.stringify(body).length > MAX_BODY_CHARS) return send(413, { ok: false, message: MSG.tooLarge });

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'onbekend';

  const { status, payload } = await handleQuote(body, ip);
  return send(status, payload);
}
