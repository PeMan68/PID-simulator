/* Miljökonfiguration — PROD (mall, ej aktiv).
 *
 * Denna fil laddas INTE av index.html i den här arbetskopian. Den är källan
 * som scripts/build-preview.mjs kopierar till env.js när en lokal
 * produktionsförhandsvisning byggs (dist/prod/env.js), och som samma steg
 * ska köras med när main förbereds för en riktig release.
 *
 * PROD-001B, DEL 1: PO/PM:s beslutade produktionsurval (5 lärstigar) — se
 * catalogFile nedan, som pekar på content/catalog.prod.json.
 */
(function (global) {
  const ENV_CONFIG = {
    environment: "production",
    showTestMode: false,
    showScore: false,
    showExperimentalContent: false,
    showMeasurementFacit: false,
    catalogFile: "catalog.prod.json"
  };
  global.ENV_CONFIG = ENV_CONFIG;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ENV_CONFIG;
  }
})(typeof window !== "undefined" ? window : globalThis);
