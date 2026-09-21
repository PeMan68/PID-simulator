// UX-004 — Omstrukturering av huvudyta och progressiv exponering.
//
// Ren statisk källkodskontroll (ingen webbläsare/DOM tillgänglig här, samma
// mönster som tests/ux-002-application-profile.test.mjs). Verifierar:
// (1) de tre nya grupperna (Processinställning/Regulatorkonfiguration/
// Processpåverkan) ersätter de fyra gamla (Process/Regulator/Styrning/
// Störningar), inklusive fältomflyttningarna (U min/U max in i
// Regulatorkonfiguration, SP/Manuell u in i Processpåverkan);
// (2) "Avancerat"-disklosyren per grupp (Processinställning/
// Regulatorkonfiguration) och dess härledningslogik (deriveAdvancedOpen);
// (3) Justering 4 — Auto/Manuell-togglen ersätter Manuell som mode-alternativ;
// (4) Justering 5 — Visa PB flyttat till grafen, inte längre i
// Regulatorkonfiguration; (5) forceAdvancedOpen på pi-windup-demo.json.
//
// Körs: node tests/ux-004-huvudyta.test.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, "..", "apps", "app");

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

const html = readFileSync(path.join(APP_DIR, "index.html"), "utf8");
const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");

// ── 1. index.html: de tre nya grupperna finns, de fyra gamla är borta ──
{
  check("1a. groupProcessinstallning finns med etiketten \"Processinställning\"", /id="groupProcessinstallning">[\s\S]{0,250}Processinställning/.test(html));
  check("1b. groupRegulatorkonfiguration finns med etiketten \"Regulatorkonfiguration\"", /id="groupRegulatorkonfiguration">[\s\S]{0,250}Regulatorkonfiguration/.test(html));
  check("1c. groupProcesspaverkan finns med etiketten \"Processpåverkan\"", /id="groupProcesspaverkan">[\s\S]{0,250}Processpåverkan/.test(html));
  check("1d. Gamla \"groupProcess\" (exakt, inte -installning) finns inte kvar", !/id="groupProcess"[^i]/.test(html));
  check("1e. Gamla \"groupRegulator\" (exakt, inte -konfiguration) finns inte kvar", !/id="groupRegulator"[^k]/.test(html));
  check("1f. Gamla \"groupStyrning\"/\"groupStorningar\" finns inte kvar", !html.includes('id="groupStyrning"') && !html.includes('id="groupStorningar"'));
}

// ── 2. index.html: fältomflyttningar ──
{
  check("2a. U min ligger i Regulatorkonfiguration (inte Processpåverkan)", /id="groupRegulatorkonfiguration">[\s\S]{0,3000}<label for="umin"/.test(html));
  check("2b. U max ligger i Regulatorkonfiguration", /id="groupRegulatorkonfiguration">[\s\S]{0,3000}<label for="umax"/.test(html));
  check("2c. SP ligger i Processpåverkan (inte Regulatorkonfiguration)", /id="groupProcesspaverkan">[\s\S]{0,300}<label for="sp"/.test(html));
  check("2d. Manuell u ligger i Processpåverkan", /id="groupProcesspaverkan">[\s\S]{0,700}<label for="manualOutput"/.test(html));
  check("2e. Last mag/Trigga last ligger i Processpåverkan", /id="groupProcesspaverkan">[\s\S]{0,3000}<label for="auxMag"/.test(html) && /id="groupProcesspaverkan">[\s\S]{0,3000}<button id="triggerAux">/.test(html));
}

// ── 3. index.html + app.js: "Avancerat"-disklosyr per grupp ──
{
  check("3a. advancedToggleProcess/advancedFieldsProcess finns i Processinställning", html.includes('id="advancedToggleProcess"') && html.includes('id="advancedFieldsProcess"'));
  check("3b. advancedToggleRegulator/advancedFieldsRegulator finns i Regulatorkonfiguration", html.includes('id="advancedToggleRegulator"') && html.includes('id="advancedFieldsRegulator"'));
  check("3c. Lastförstärkning (auxGain) ligger i advancedFieldsProcess", /id="advancedFieldsProcess"[\s\S]{0,300}<label for="auxGain"/.test(html));
  check("3d. Olinjär ventilkarakteristik ligger i advancedFieldsProcess", /id="advancedFieldsProcess"[\s\S]{0,2000}nonlinearGainEnabled/.test(html));
  check("3e. Kff ligger i advancedFieldsRegulator", /id="advancedFieldsRegulator"[\s\S]{0,300}<label for="kff"/.test(html));
  check("3f. Parameterstyrning ligger i advancedFieldsRegulator", /id="advancedFieldsRegulator"[\s\S]{0,2000}gainScheduleEnabled/.test(html));
  check("3g. Bumpless/Anti-windup ligger i advancedFieldsRegulator (PO-beslut, inte längre grundnivå)", /id="advancedFieldsRegulator"[\s\S]{0,3800}<label for="bumpless"/.test(html) && /id="advancedFieldsRegulator"[\s\S]{0,4000}<label for="antiWindup"/.test(html));
  check("3h. .advanced-fields[hidden]-CSS finns (döljer sektionen som grupp)", /\.advanced-fields\[hidden\]\s*\{\s*display:\s*none;\s*\}/.test(html));
  check("3i. Avancerat-sektionerna startar dolda (hidden-attribut i markupen)", /id="advancedFieldsProcess" hidden/.test(html) && /id="advancedFieldsRegulator" hidden/.test(html));

  check("3j. deriveAdvancedOpen()-funktionen är definierad", /function deriveAdvancedOpen\(scenario, group\)/.test(appJs));
  check("3k. Tillämpning=\"avancerat\" (Justering 1) tvingar Avancerat öppet oavsett scenario", /if \(fields\.applicationProfile\.value === "avancerat"\) return true;/.test(appJs));
  check("3l. forceAdvancedOpen på scenariot tvingar gruppen öppen", /scenario\?\.forceAdvancedOpen\?\.includes\(group\)/.test(appJs));
  check("3m. Process-gruppen öppnas av aktivt nonlinearGain ELLER auxGain", /nonlinearGain\?\.enabled[\s\S]{0,60}auxGain/.test(appJs));
  check("3n. Regulator-gruppen öppnas av aktivt gainSchedule ELLER kff", /gainSchedule\?\.enabled[\s\S]{0,60}controller\.kff/.test(appJs));
  check("3o. setAdvancedOpen()/toggleAdvanced()/applyAdvancedState() är definierade", /function setAdvancedOpen\(group, open\)/.test(appJs) && /function toggleAdvanced\(group\)/.test(appJs) && /function applyAdvancedState\(\)/.test(appJs));
  check("3p. applyAdvancedState() anropas från applyApplicationProfile() (räknas om vid varje Tillämpnings-/scenariobyte)", /applyAdvancedState\(\); \/\/ UX-004/.test(appJs));
  check("3q. initUI() räknar antal dolda fält per Avancerat-sektion (statiskt, en gång)", /advancedCount/.test(appJs) && /querySelectorAll\("\.field"\)\.length/.test(appJs));
}

// ── 4. Justering 4 — Auto/Manuell-toggle ersätter Manuell som mode-alternativ ──
{
  check("4a. #regulatorType-select finns (onoff/p/pi/pid, INGEN manual-option)", /<select id="regulatorType">\s*<option value="onoff">OnOff<\/option>\s*<option value="p">P<\/option>\s*<option value="pi">PI<\/option>\s*<option value="pid">PID<\/option>\s*<\/select>/.test(html));
  check("4b. #autoManualToggle-checkboxen finns", html.includes('id="autoManualToggle"'));
  check("4c. #mode (5 alternativ inkl. manual) finns kvar, men DOLD — intern sanningskälla", /<select id="mode" hidden>[\s\S]{0,300}<option value="manual">Manuell<\/option>/.test(html));
  check("4d. regulatorType/autoManualToggle registrerade i fields{}", /regulatorType: document\.getElementById\("regulatorType"\)/.test(appJs) && /autoManualToggle: document\.getElementById\("autoManualToggle"\)/.test(appJs));
  check(
    "4e. Manuell-övergången seedar manualOutput OVILLKORLIGT (inte längre gated på Bumpless-kryssrutan)",
    /if \(newMode === "manual" && prevMode !== "manual"\) \{\s*\n\s*const lastU = sim\.getState\(\)\.u;\s*\n\s*fields\.manualOutput\.value = lastU\.toFixed\(2\);/.test(appJs)
  );
  check("4f. Ingen kvarvarande bumplessOn-gating runt just detta seed-steg", !/if \(bumplessOn\) \{\s*\n\s*const lastU = sim\.getState\(\)\.u;/.test(appJs));
  check("4g. #regulatorType har en change-lyssnare som skriver till #mode och triggar dess change-event", /getElementById\("regulatorType"\)\.addEventListener\("change", \(\) => \{[\s\S]{0,300}fields\.mode\.value = fields\.regulatorType\.value;[\s\S]{0,100}fields\.mode\.dispatchEvent\(new Event\("change"\)\);/.test(appJs));
  check("4h. #autoManualToggle har en change-lyssnare som sätter #mode till \"manual\" eller regulatorType.value", /getElementById\("autoManualToggle"\)\.addEventListener\("change", \(\) => \{\s*\n\s*fields\.mode\.value = fields\.autoManualToggle\.checked \? "manual" : fields\.regulatorType\.value;/.test(appJs));
  check(
    "4i. updateControllerUIState() synkar regulatorType/autoManualToggle FRÅN #mode (regulatorType orört vid manual — det ÄR minnet av senaste auto-typ)",
    /if \(!isManual\) fields\.regulatorType\.value = mode;\s*\n\s*fields\.autoManualToggle\.checked = isManual;/.test(appJs)
  );
  check("4j. applyApplicationProfile() filtrerar regulatorType-alternativen med samma regellista minus \"manual\"", /filterSelectOptions\(fields\.regulatorType, profile\.modes\.filter\(m => m !== "manual"\)\)/.test(appJs));
  check("4k. help.json har en \"autoManualToggle\"-post", (() => { try { return !!JSON.parse(readFileSync(path.join(APP_DIR, "content", "help.json"), "utf8")).autoManualToggle; } catch { return false; } })());
}

// ── 5. Justering 5 — Visa PB flyttat till grafen ──
{
  check("5a. #showPB ligger INTE längre i någon .param-group (Processinställning/Regulatorkonfiguration/Processpåverkan)", !/id="group(Processinstallning|Regulatorkonfiguration|Processpaverkan)">[\s\S]*?id="showPB"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(<!--|<div class="param-group")/.test(html) && !/<label for="showPB">/.test(html.split('id="chartControls"')[0] || ""));
  check("5b. #chartControls-raden med Visa PB finns direkt före #chartWrap", /id="chartControls">[\s\S]{0,200}id="showPB"[\s\S]{0,300}id="chartWrap"/.test(html));
  check("5c. showPB fortsatt registrerad i fields{} (samma id, bara ny plats i DOM)", /showPB: document\.getElementById\("showPB"\)/.test(appJs));
}

// ── 6. forceAdvancedOpen — pi-windup-demo.json (Anti-windup är default=true,
// fångas inte av "aktivt värde"-heuristiken, kräver explicit override) ──
{
  const windupScenario = JSON.parse(readFileSync(path.join(APP_DIR, "content", "scenarios", "pi-windup-demo.json"), "utf8"));
  check("6a. pi-windup-demo.json har forceAdvancedOpen: [\"regulator\"]", Array.isArray(windupScenario.forceAdvancedOpen) && windupScenario.forceAdvancedOpen.includes("regulator"));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
