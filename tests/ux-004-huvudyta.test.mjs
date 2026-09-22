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
  // UX-004 Implementering, punkt 4 (PO-test 2026-09-22) — flyttad hit FRÅN
  // Processinställningens Avancerat-sektion, se avsnitt 3c/3m nedan.
  check("2f. Lastförstärkning (auxGain) ligger nu i Processpåverkans grundnivå, tillsammans med Last mag/Trigga last", /id="groupProcesspaverkan">[\s\S]{0,3000}<label for="auxGain"/.test(html));
}

// ── 3. index.html + app.js: "Avancerat"-disklosyr per grupp ──
{
  check("3a. advancedToggleProcess/advancedFieldsProcess finns i Processinställning", html.includes('id="advancedToggleProcess"') && html.includes('id="advancedFieldsProcess"'));
  check("3b. advancedToggleRegulator/advancedFieldsRegulator finns i Regulatorkonfiguration", html.includes('id="advancedToggleRegulator"') && html.includes('id="advancedFieldsRegulator"'));
  check("3c. Lastförstärkning (auxGain) ligger INTE längre i advancedFieldsProcess (flyttad till Processpåverkan, punkt 4)", !/id="advancedFieldsProcess"[\s\S]{0,300}<label for="auxGain"/.test(html));
  check("3d. Olinjär ventilkarakteristik ligger i advancedFieldsProcess", /id="advancedFieldsProcess"[\s\S]{0,2000}nonlinearGainEnabled/.test(html));
  check("3e. Kff ligger i advancedFieldsRegulator", /id="advancedFieldsRegulator"[\s\S]{0,300}<label for="kff"/.test(html));
  check("3f. Parameterstyrning ligger i advancedFieldsRegulator", /id="advancedFieldsRegulator"[\s\S]{0,2000}gainScheduleEnabled/.test(html));
  check("3g. Bumpless/Anti-windup ligger i advancedFieldsRegulator (PO-beslut, inte längre grundnivå)", /id="advancedFieldsRegulator"[\s\S]{0,3800}<label for="bumpless"/.test(html) && /id="advancedFieldsRegulator"[\s\S]{0,4000}<label for="antiWindup"/.test(html));
  check("3h. .advanced-fields[hidden]-CSS finns (döljer sektionen som grupp)", /\.advanced-fields\[hidden\]\s*\{\s*display:\s*none;\s*\}/.test(html));
  check("3i. Avancerat-sektionerna startar dolda (hidden-attribut i markupen)", /id="advancedFieldsProcess" hidden/.test(html) && /id="advancedFieldsRegulator" hidden/.test(html));

  check("3j. deriveAdvancedOpen()-funktionen är definierad", /function deriveAdvancedOpen\(scenario, group\)/.test(appJs));
  check("3k. Tillämpning=\"avancerat\" (Justering 1) tvingar Avancerat öppet oavsett scenario", /if \(fields\.applicationProfile\.value === "avancerat"\) return true;/.test(appJs));
  check("3l. forceAdvancedOpen på scenariot tvingar gruppen öppen", /scenario\?\.forceAdvancedOpen\?\.includes\(group\)/.test(appJs));
  check(
    "3m. Process-gruppen öppnas ENDAST av aktivt nonlinearGain (auxGain borttaget ur villkoret, punkt 4 — fältet ligger inte längre i sektionen)",
    /if \(group === "process"\) \{[\s\S]{0,700}return !!\(scenario\.process\.nonlinearGain\?\.enabled\);/.test(appJs)
  );
  check("3n. Regulator-gruppen öppnas av aktivt gainSchedule ELLER kff", /gainSchedule\?\.enabled[\s\S]{0,60}controller\.kff/.test(appJs));
  check("3o. setAdvancedOpen()/toggleAdvanced()/applyAdvancedState() är definierade", /function setAdvancedOpen\(group, open\)/.test(appJs) && /function toggleAdvanced\(group\)/.test(appJs) && /function applyAdvancedState\(\)/.test(appJs));
  check("3p. applyAdvancedState() anropas från applyApplicationProfile() (räknas om vid varje Tillämpnings-/scenariobyte)", /applyAdvancedState\(\); \/\/ UX-004/.test(appJs));
  // UX-004 Implementering, punkt 1 (PO-test 2026-09-22) — "(N dolda)"-
  // räknaren (från den ursprungliga analysens layoutförslag) togs bort helt
  // efter PO:s manuella granskning: bara "Avancerat", inget antal.
  check("3q. Ingen \"(N dolda)\"-räknare kvar — varken i markupen eller i JS", !/advancedCount/.test(appJs) && !/advanced-count/.test(html) && !/\d+ dolda/.test(html));
  check("3r. Avancerat-etiketten är exakt \"Avancerat\", ingen efterföljande <span>/räknare", /<button class="group-toggle">▸<\/button> Avancerat<\/div>/.test(html));
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

// ── 7. UX-004 Implementering (PO-uppdrag 2026-09-22) — Tillämpning sparas ──
{
  check("7a. APPLICATION_PROFILE_STORAGE_KEY är definierad", /const APPLICATION_PROFILE_STORAGE_KEY = "pidSimApplicationProfile";/.test(appJs));
  check("7b. #applicationProfile-lyssnaren sparar värdet vid manuellt val", /getElementById\("applicationProfile"\)\.addEventListener\("change", \(\) => \{[\s\S]{0,300}localStorage\.setItem\(APPLICATION_PROFILE_STORAGE_KEY, fields\.applicationProfile\.value\);/.test(appJs));
  check("7c. initUI() beräknar startvärdet EFTER startscenariots härledning, inte tvärtom", /loadScenarioByName\("basic-step-self-regulating\.json"\);[\s\S]{0,1500}localStorage\.getItem\(APPLICATION_PROFILE_STORAGE_KEY\)/.test(appJs));
  check("7d. Ett sparat värde valideras mot APPLICATION_PROFILES innan det används (skyddar mot ogiltigt/korrupt värde)", /const initialProfile = \(savedProfile && APPLICATION_PROFILES\[savedProfile\]\) \? savedProfile : "temperatur";/.test(appJs));
  check("7e. Saknas ett giltigt sparat värde (första besöket) blir starten \"temperatur\", INTE \"avancerat\" — annars tvingas Avancerat-sektionerna öppna vid en helt ny sidladdning (Justering 1), tvärtemot uppdragets \"Initialt öppet läge\"-krav", /: "temperatur";/.test(appJs));
}

// ── 8. UX-004 Implementering — infrastruktur för lärstigsstyrd synlighet ──
{
  check("8a. ADDON_TO_ADVANCED_GROUP-mappningen finns (framkoppling/parameterstyrning → regulator, ventilkarakteristik → process)", /const ADDON_TO_ADVANCED_GROUP = \{ framkoppling: "regulator", parameterstyrning: "regulator", ventilkarakteristik: "process" \};/.test(appJs));
  check("8b. applyPathVisibilityOverride() är definierad", /function applyPathVisibilityOverride\(\)/.test(appJs));
  check("8c. Gated på currentPath OCH currentPathStep >= 0 (läcker inte till ett senare, orelaterat manuellt scenarioval)", /if \(!currentPath \|\| currentPathStep < 0\) return;/.test(appJs));
  check("8d. hide-listan tvingar addon-hidden PÅ (döljer trots att Tillämpning annars skulle tillåtit det)", /\(override\.hide \|\| \[\]\)\.forEach\(addon => \{\s*\n\s*document\.querySelectorAll\('\[data-addon="' \+ addon \+ '"\]'\)\.forEach\(el => el\.classList\.add\("addon-hidden"\)\);/.test(appJs));
  check("8e. show-listan tvingar addon-hidden AV och öppnar addonens Avancerat-grupp", /\(override\.show \|\| \[\]\)\.forEach\(addon => \{\s*\n\s*document\.querySelectorAll\('\[data-addon="' \+ addon \+ '"\]'\)\.forEach\(el => el\.classList\.remove\("addon-hidden"\)\);\s*\n\s*const group = ADDON_TO_ADVANCED_GROUP\[addon\];\s*\n\s*if \(group\) setAdvancedOpen\(group, true\);/.test(appJs));
  check("8f. Anropas sist i applyApplicationProfile() (mest specifika lagret, efter applyAdvancedState())", /applyAdvancedState\(\); \/\/ UX-004[^\n]*\n\s*applyPathVisibilityOverride\(\);/.test(appJs));
  check(
    "8f2. Anropas ÄVEN sist i loadScenarioByName(), efter dess EGET (andra) updateControllerUIState()-anrop — annars återställer det anropets interna updateKffVisibility() en aktiv hide-override av Kff (upptäckt vid webbläsarverifiering)",
    /function loadScenarioByName\(name\) \{[\s\S]{0,900}updateControllerUIState\(\);[\s\S]{0,600}applyPathVisibilityOverride\(\);/.test(appJs)
  );

  const paramLearningPath = JSON.parse(readFileSync(path.join(APP_DIR, "content", "exercises", "parameterstyrning-ventilkarakteristik.v1.json"), "utf8"));
  check("8g. parameterstyrning-ventilkarakteristik.v1 visar Parameterstyrning och döljer Kff/Framkoppling", Array.isArray(paramLearningPath.visibilityOverride?.show) && paramLearningPath.visibilityOverride.show.includes("parameterstyrning") && Array.isArray(paramLearningPath.visibilityOverride?.hide) && paramLearningPath.visibilityOverride.hide.includes("framkoppling"));

  const ffLearningPath = JSON.parse(readFileSync(path.join(APP_DIR, "content", "exercises", "framkoppling.v1.json"), "utf8"));
  check("8h. framkoppling.v1 visar Kff/Framkoppling och döljer Parameterstyrning", Array.isArray(ffLearningPath.visibilityOverride?.show) && ffLearningPath.visibilityOverride.show.includes("framkoppling") && Array.isArray(ffLearningPath.visibilityOverride?.hide) && ffLearningPath.visibilityOverride.hide.includes("parameterstyrning"));
}

// ── 9. UX-004 Implementering efter PO-test (2026-09-22) — punkt 2/3 ──
{
  check(
    "9a. Tillämpning=\"avancerat\" är en KOMPLETT sandlåda — applyPathVisibilityOverride() returnerar tidigt, ingen aktiv lärstigsfiltrering kvarstår (PO-fynd: filter satt kvar trots Avancerat)",
    /function applyPathVisibilityOverride\(\) \{\s*\n\s*if \(!currentPath \|\| currentPathStep < 0\) return;[\s\S]{0,700}if \(fields\.applicationProfile\.value === "avancerat"\) return;/.test(appJs)
  );
  check(
    "9b. Manuellt scenarioval (#load-knappen) nollställer currentPathStep — en aktiv lärstigs visibilityOverride läcker annars kvar på ett orelaterat, manuellt valt scenario (PO-fynd, t.ex. växling till 'Fri utforskning')",
    /getElementById\("load"\)\.addEventListener\("click", \(\) => \{\s*\n[\s\S]{0,700}currentPathStep = -1;[\s\S]{0,200}loadScenarioByName\(scenarioSelect\.value\);/.test(appJs)
  );
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
