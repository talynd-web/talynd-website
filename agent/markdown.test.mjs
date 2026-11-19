// Draaien: node --test agent/markdown.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { wilMarkdown, markdownPad, markdownAntwoord } from './markdown.mjs';

const BESTANDEN = {
  '/index.md': '# Meer winst zonder extra personeel.\n\nTekst.',
  '/over-ons.md': '# Over ons\n\nTekst.',
  '/404.md': '# Pagina niet gevonden\n\nZie [llms.txt](/llms.txt).',
};
const nepFetch = (gezien = []) => async (url, init) => {
  gezien.push({ url: String(url), init });
  const pad = new URL(url).pathname;
  if (BESTANDEN[pad]) return new Response(BESTANDEN[pad], { status: 200, headers: { 'content-type': 'text/markdown; charset=utf-8' } });
  // Een HTML-pagina met status 200 op het .md-adres (zou niet mogen gebeuren) telt nooit als Markdown.
  if (pad === '/html-schil.md') return new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response('nee', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
};
const verzoek = (pad, accept, extra = {}) => new Request('https://talynd.com' + pad, { headers: { accept, ...extra }, method: extra.method || 'GET' });

test('wilMarkdown: alleen als Markdown minstens zo zwaar weegt als HTML', () => {
  assert.equal(wilMarkdown('text/markdown'), true);
  assert.equal(wilMarkdown('text/markdown, text/plain;q=0.8'), true);
  assert.equal(wilMarkdown('text/markdown;q=0.9, text/html;q=0.8'), true);
  assert.equal(wilMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), false);
  assert.equal(wilMarkdown('text/html, text/markdown;q=0.5'), false);
  assert.equal(wilMarkdown('text/markdown;q=0'), false);
  assert.equal(wilMarkdown(''), false);
  assert.equal(wilMarkdown(null), false);
});

test('markdownPad: homepage en pagina met of zonder slash', () => {
  assert.equal(markdownPad('/'), '/index.md');
  assert.equal(markdownPad('/over-ons'), '/over-ons.md');
  assert.equal(markdownPad('/over-ons/'), '/over-ons.md');
});

test('homepage in Markdown: 200, text/markdown en Vary: Accept', async () => {
  const r = await markdownAntwoord(verzoek('/', 'text/markdown'), nepFetch());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(r.headers.get('vary'), 'Accept');
  assert.match(await r.text(), /^# Meer winst zonder extra personeel/);
});

test('gewone bezoeker (text/html): niets doen, HTML blijft', async () => {
  const gezien = [];
  assert.equal(await markdownAntwoord(verzoek('/', 'text/html,*/*;q=0.8'), nepFetch(gezien)), null);
  assert.equal(gezien.length, 0);
});

test('onbekend pad: status 404 met Markdown-uitleg en link naar llms.txt', async () => {
  const r = await markdownAntwoord(verzoek('/__ora-404-probe-xyz', 'text/markdown'), nepFetch());
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('content-type'), 'text/markdown; charset=utf-8');
  const tekst = await r.text();
  assert.ok(tekst.length >= 20);
  assert.match(tekst, /llms\.txt/);
});

test('HTML op het .md-adres wordt nooit als Markdown doorgegeven: dan de 404-tekst', async () => {
  const r = await markdownAntwoord(verzoek('/html-schil', 'text/markdown'), nepFetch());
  assert.equal(r.status, 404);
  assert.match(await r.text(), /Pagina niet gevonden/);
});

test('cookie en bypass gaan mee, zodat het ook op een afgeschermde preview werkt', async () => {
  const gezien = [];
  await markdownAntwoord(verzoek('/over-ons', 'text/markdown', { cookie: '_vercel_jwt=abc', 'x-vercel-protection-bypass': 'geheim' }), nepFetch(gezien));
  assert.equal(gezien[0].url, 'https://talynd.com/over-ons.md');
  assert.equal(gezien[0].init.headers.cookie, '_vercel_jwt=abc');
  assert.equal(gezien[0].init.headers['x-vercel-protection-bypass'], 'geheim');
});

test('api, bestanden en POST blijven ongemoeid', async () => {
  assert.equal(await markdownAntwoord(verzoek('/api/lead', 'text/markdown'), nepFetch()), null);
  assert.equal(await markdownAntwoord(verzoek('/llms.txt', 'text/markdown'), nepFetch()), null);
  assert.equal(await markdownAntwoord(verzoek('/', 'text/markdown', { method: 'POST' }), nepFetch()), null);
});

test('HEAD: zelfde kopregels, geen inhoud', async () => {
  const r = await markdownAntwoord(verzoek('/', 'text/markdown', { method: 'HEAD' }), nepFetch());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('vary'), 'Accept');
  assert.equal(await r.text(), '');
});

test('bestand niet bereikbaar (bv. 401): terugvallen op HTML', async () => {
  const dicht = async () => new Response('', { status: 401 });
  assert.equal(await markdownAntwoord(verzoek('/', 'text/markdown'), dicht), null);
});
