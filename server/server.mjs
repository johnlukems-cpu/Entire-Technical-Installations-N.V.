import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createApp, mailConfigFromEnv } from './app.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));

const distDir = join(root, 'dist');
if (!existsSync(distDir)) {
  console.error('Map dist/ ontbreekt. Voer eerst "npm run build" uit.');
  process.exit(1);
}

const mail = mailConfigFromEnv();
if (!mail) {
  console.warn(
    '⚠ Geen (volledige) mailconfiguratie gevonden. Het offerteformulier geeft bezoekers een foutmelding totdat SMTP_HOST, MAIL_FROM en MAIL_TO zijn ingesteld.',
  );
}

const app = createApp({
  distDir,
  mail,
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY || undefined,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
});

function parseTrustProxy(v) {
  if (!v || v === 'false') return false;
  if (v === 'true') return true;
  return /^\d+$/.test(v) ? Number(v) : v;
}

const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => console.log(`ETI-website draait op http://localhost:${port}`));
