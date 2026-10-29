// Tests voor de Vercel-functie api/offerte.mjs, met een nagebootst Vercel req/res-object
// en aflevering via een lokale SMTP-testserver.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

const received = [];
let smtp, handler;

const valid = {
  naam: 'Vercel Test',
  email: 'klant@voorbeeld.com',
  telefoon: '+597 765 4321',
  dienst: 'airconditioning-en-koeling',
  locatie: 'Wanica',
  omschrijving: 'Graag onderhoud aan twee airconditioningunits.',
  contactmethode: 'email',
  privacy: 'ja',
  website: '',
  _t: String(Date.now() - 10_000),
};

function call({ method = 'POST', body = valid, json = true, ip = '10.0.0.1' } = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      body,
      headers: json
        ? { 'content-type': 'application/json', accept: 'application/json', 'x-forwarded-for': ip }
        : { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': ip },
      socket: {},
    };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) {
        this.headers[k.toLowerCase()] = v;
      },
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(p) {
        resolve({ status: this.statusCode, body: p, headers: this.headers });
      },
      end() {
        resolve({ status: this.statusCode, body: null, headers: this.headers });
      },
    };
    handler(req, res);
  });
}

before(async () => {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onData(stream, _s, cb) {
      let raw = '';
      stream.on('data', (c) => (raw += c));
      stream.on('end', () => {
        received.push(raw);
        cb();
      });
    },
  });
  await new Promise((r) => smtp.listen(0, '127.0.0.1', r));
  Object.assign(process.env, {
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.server.address().port),
    SMTP_IGNORE_TLS: 'true',
    MAIL_FROM: 'Website <web@eti.test>',
    MAIL_TO: 'offerte@eti.test',
  });
  handler = (await import('../api/offerte.mjs')).default;
});

after(() => new Promise((r) => smtp.close(r)));

test('Vercel: geldige aanvraag wordt afgeleverd', async () => {
  const r = await call();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  const mail = await simpleParser(received.at(-1));
  assert.match(mail.subject, /Airconditioning en koeling/);
  assert.equal(mail.replyTo.value[0].address, 'klant@voorbeeld.com');
});

test('Vercel: ongeldige invoer geeft 422 met meldingen', async () => {
  const r = await call({ body: { ...valid, telefoon: '12' }, ip: '10.0.0.2' });
  assert.equal(r.status, 422);
  assert.ok(r.body.errors.telefoon);
});

test('Vercel: GET is niet toegestaan', async () => {
  const r = await call({ method: 'GET' });
  assert.equal(r.status, 405);
});

test('Vercel: zonder JavaScript volgt een doorverwijzing', async () => {
  const r = await call({ json: false, ip: '10.0.0.3' });
  assert.equal(r.status, 303);
  assert.equal(r.headers.location, '/offerte-verzonden/');
});

test('Vercel: te grote aanvraag wordt geweigerd', async () => {
  const r = await call({ body: { ...valid, omschrijving: 'x'.repeat(30_000) }, ip: '10.0.0.4' });
  assert.equal(r.status, 413);
});

test('Vercel: honeypot ingevuld geeft geen succes', async () => {
  const r = await call({ body: { ...valid, website: 'spam' }, ip: '10.0.0.5' });
  assert.equal(r.status, 400);
  assert.equal(r.body.ok, false);
});
