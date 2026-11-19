/* Routing Middleware (19-11, Is Agentic): vraagt een AI-agent met
   "Accept: text/markdown" om een pagina, dan krijgt hij de Markdown-versie
   die build.mjs naast elke pagina zet. Voor alle andere bezoekers doet
   dit niets (return zonder antwoord = Vercel gaat gewoon door). Logica en
   tests: agent/markdown.mjs en agent/markdown.test.mjs. */
import { markdownAntwoord } from './agent/markdown.mjs';

export const config = {
  matcher: ['/((?!api/|.*\\..*).*)'],
};

export default async function middleware(request) {
  try {
    const antwoord = await markdownAntwoord(request);
    if (antwoord) return antwoord;
  } catch (e) {
    console.error('[middleware] markdown', e && e.message);
  }
  return undefined;
}
