/* Miljökonfiguration — DEV (aktiv fil).
 *
 * Denna fil avgör vilken profil appen kör i: development eller production.
 * Skillnaden mellan DEV och PROD styrs ENDAST av innehållet i denna fil och
 * av vilken katalogfil den pekar på (`catalogFile`) — aldrig av URL-parametrar,
 * tangentbord eller dolda knappar. Se docs/development/ENVIRONMENTS.md.
 *
 * Laddas som separat <script src="./env.js"></script> FÖRE sim-core.js och
 * app.js i index.html (samma mönster som sim-core.js), så att ENV_CONFIG
 * finns tillgängligt innan resten av appen initieras. Ingen fetch, ingen
 * asynkron kapplöpning.
 *
 * PROD-varianten av denna fil är apps/app/env.prod.js. Den kopieras ALDRIG
 * hit automatiskt — att byta profil är ett medvetet, versionshanterat steg
 * (se scripts/build-preview.mjs), inte en runtime-växel.
 */
(function (global) {
  const ENV_CONFIG = {
    environment: "development",
    showTestMode: true,
    showScore: true,
    showExperimentalContent: true,
    catalogFile: "catalog.json"
  };
  global.ENV_CONFIG = ENV_CONFIG;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ENV_CONFIG;
  }
})(typeof window !== "undefined" ? window : globalThis);
