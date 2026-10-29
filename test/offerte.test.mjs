// Integratietests voor het offerteformulier: echte HTTP-verzoeken naar de server en
// aflevering via een lokale SMTP-testserver.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.mjs';
import { validateQuote } from '../shared/validation.mjs';

const quiet = { info() {}, warn() {}, error() {} };
const received = [];
let smtp, smtpPort, baseOk, baseNoMail, baseBrokenMail, servers = [];

const valid = {
  naam: 'Test Persoon',
  bedrijf: '',
  email: 'test@voorbeeld.com',
  telefoon: '+597 123 4567',
  dienst: 'alarminstallaties-en-beveiliging',
  locatie: 'Paramaribo',
  omschrijving: 'Ik wil graag een inbraakalarm laten installeren in mijn woning.',
  contactmethode: 'telefoon',
  privacy: 'ja',
  website: '',
  _t: String(Date.now() - 10_000),
};

const listen = (app) =>
  new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      servers.push(s);
      resolve(`http://127.0.0.1:${s.address().port}`);
    });
  });

before(async () => {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onData(stream, session, cb) {
      let raw = '';
      stream.on('data', (c) => (raw += c));
      stream.on('end', () => {
        received.push({ raw, to: session.envelope.rcptTo.map((r) => r.address) });
        cb();
      });
    },
  });
  await new Promise((r) => smtp.listen(0, '127.0.0.1', r));
  smtpPort = smtp.server.address().port;

  const dist = mkdtempSync(join(tmpdir(), 'eti-dist-'));
  writeFileSync(join(dist, '404.html'), '<p>404</p><script>console.log(1)</script>');
  const mail = {
    transport: { host: '127.0.0.1', port: smtpPort, secure: false, ignoreTLS: true },
    from: 'Website <website@eti.test>',
    to: 'offertes@eti.test',
  };
  baseOk = await listen(createApp({ distDir: dist, mail, logger: quiet, rateLimit: { windowMs: 60_000, max: 100 } }));
  baseNoMail = await listen(createApp({ distDir: dist, mail: null, logger: quiet }));
  baseBrokenMail = await listen(
    createApp({
      distDir: dist,
      mail: { ...mail, transport: { host: '127.0.0.1', port: 1, secure: false, connectionTimeout: 2000 } },
      logger: quiet,
    }),
  );
});

after(async () => {
  for (const s of servers) s.close();
  await new Promise((r) => smtp.close(r));
});

const post = (base, body, json = true) =>
  fetch(`${base}/api/offerte`, {
    method: 'POST',
    redirect: 'manual',
    headers: json
      ? { 'Content-Type': 'application/json', Accept: 'application/json' }
      : { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: json ? JSON.stringify(body) : new URLSearchParams(body),
  });

test('validatie: geldige invoer wordt geaccepteerd', () => {
  assert.equal(validateQuote(valid).ok, true);
});

test('validatie: lege invoer geeft Nederlandstalige meldingen voor alle verplichte velden', () => {
  const { ok, errors } = validateQuote({});
  assert.equal(ok, false);
  for (const f of ['naam', 'email', 'telefoon', 'dienst', 'locatie', 'omschrijving', 'contactmethode', 'privacy'])
    assert.ok(errors[f], `melding voor ${f}`);
  assert.equal(errors.naam, 'Vul uw naam in.');
  assert.equal(errors.bedrijf, undefined, 'bedrijfsnaam is optioneel');
});

test('validatie: ongeldig e-mailadres, telefoon en dienst', () => {
  const { errors } = validateQuote({ ...valid, email: 'geen-email', telefoon: 'abc', dienst: 'hack' });
  assert.match(errors.email, /geldig e-mailadres/);
  assert.match(errors.telefoon, /geldig telefoonnummer/);
  assert.match(errors.dienst, /geldige dienst/);
});

test('geldige aanvraag wordt daadwerkelijk per e-mail afgeleverd', async () => {
  const before = received.length;
  const res = await post(baseOk, valid);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(received.length, before + 1);
  const msg = received.at(-1);
  assert.deepEqual(msg.to, ['offertes@eti.test']);
  const parsed = await simpleParser(msg.raw);
  assert.match(parsed.subject, /Alarminstallaties en beveiligingssystemen/);
  assert.equal(parsed.replyTo.value[0].address, 'test@voorbeeld.com');
  assert.match(parsed.text, /Locatie van het project: Paramaribo/);
});

test('HTML in invoer wordt ge-escaped in de e-mail', async () => {
  await post(baseOk, { ...valid, omschrijving: '<script>alert(1)</script> graag een offerte' });
  const parsed = await simpleParser(received.at(-1).raw);
  assert.ok(!parsed.html.includes('<script>alert(1)</script>'));
  assert.ok(parsed.html.includes('&lt;script&gt;'));
});

test('ongeldige invoer: 422 met foutmeldingen, geen e-mail', async () => {
  const before = received.length;
  const res = await post(baseOk, { ...valid, email: 'fout' });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.errors.email);
  assert.equal(received.length, before);
});

test('honeypot ingevuld: geweigerd, geen e-mail', async () => {
  const before = received.length;
  const res = await post(baseOk, { ...valid, website: 'http://spam.example' });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).ok, false);
  assert.equal(received.length, before);
});

test('te snel verzonden formulier wordt geweigerd', async () => {
  const res = await post(baseOk, { ...valid, _t: String(Date.now()) });
  assert.equal(res.status, 400);
});

test('zonder mailconfiguratie: 503 en GEEN succesmelding', async () => {
  const res = await post(baseNoMail, valid);
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.match(body.message, /níet verzonden/);
});

test('mailserver onbereikbaar: foutmelding, geen succes', async () => {
  const res = await post(baseBrokenMail, valid);
  assert.equal(res.status, 502);
  assert.equal((await res.json()).ok, false);
});

test('zonder JavaScript: doorverwijzing naar bevestiging of foutpagina', async () => {
  const ok = await post(baseOk, valid, false);
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/offerte-verzonden/');
  const fail = await post(baseNoMail, valid, false);
  assert.equal(fail.status, 303);
  assert.equal(fail.headers.get('location'), '/offerte-mislukt/');
});

test('rate limiting na te veel aanvragen', async () => {
  const dist = mkdtempSync(join(tmpdir(), 'eti-dist-'));
  const base = await listen(createApp({ distDir: dist, mail: null, logger: quiet, rateLimit: { windowMs: 60_000, max: 2 } }));
  await post(base, valid);
  await post(base, valid);
  const res = await post(base, valid);
  assert.equal(res.status, 429);
});

test('beveiligingsheaders en CSP met hashes van inline scripts', async () => {
  const res = await fetch(`${baseOk}/bestaat-niet/`);
  assert.equal(res.status, 404);
  const csp = res.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self' 'sha256-/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('ongeldige JSON geeft nette foutmelding', async () => {
  const res = await fetch(`${baseOk}/api/offerte`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{kapot',
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).ok, false);
});
