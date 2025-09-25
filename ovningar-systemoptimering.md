# Övningsuppgifter: Systemoptimering och Parameterjämförelser
*PID-simulator v1.7.0 - Avancerade övningar med historikanalys*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Denna övningssamling fokuserar på systematisk optimering av regulatorparametrar och fördjupad förståelse för hur olika systemegenskaper påverkar regulatorprestanda. Historikfunktionerna gör det möjligt att spara och namnge simuleringar för detaljerad jämförelse.

**Förkunskaper:** Grundläggande PID-förståelse.

**Mål:** Utveckla systematisk approach för regulatordesign och optimering.

## Innehållsförteckning

**Del 1: Parameterkänslighetsanalys**
- 1.1 Kp-parameterns påverkan och statiskt reglerfel
- 1.2 Ti-parameterns roll - Elimination av statiskt reglerfel  
- 1.3 Td-parameterns optimering
- 1.4 Integratoruppvridning (Windup) - Förståelse och hantering

**Del 2: Praktisk regulatorinställning**
- 2.1 Stegvis parameteroptimering
- 2.2 Robusthetsanalys
- 2.3 Alternativa inställningsstrategier

**Del 3: Verkliga designstrategier**
- 3.1 Ziegler-Nichols-metoden
- 3.2 Lambda-inställning

**Del 4: Specialfall och avancerade tekniker**
- 4.1 Integrerande processer
- 4.2 Multivariabel påverkan

**Masterövning: Komplett regulatordesign**
- 5 Systematisk PID-inställning från grunden

**Avslutande reflektion**
- Framtida tillämpning

---

**Viktigt om dokumentation och spårning:**

**Historikfunktionen i programmet:**
- **"Spara"**: Sparar endast kurvorna för visuell jämförelse (max 5 kurvor)
- **Begränsning**: Äldsta kurva raderas automatiskt när utrymmet tar slut
- **Användning**: För kortvariga jämförelser mellan några tester

**Manuella parameteranteckningar (KRITISKT):**
- **Du måste anteckna** alla regulatorinställningar utanför programmet
- **Anteckningsbok/dokument**: Skapa tabell för systematisk dokumentation
- **Varje test**: Notera Kp, Ti, Td + observerade resultat
- **Endast så** kan du återvända till framgångsrika inställningar

**Rekommenderat arbetsflöde:**
1. **Återställ** (nollställer processen till normalvärde för konsistenta resultat)
2. Ställ in parametrar (ex: Kp=1.5, Ti=OFF, Td=OFF)
3. **Anteckna inställningar** i din tabell INNAN test
4. Kör simulering och observera beteende
5. Om **"Autopaus"** är aktiverat kan det hända att simuleringen stannar för tidigt. Avmarkera "Autopaus" och fortsätt simuleringen med "Kör"
6. **Anteckna resultat** (stabiliseringstid, översläng, etc.)
7. Vid intressanta resultat: "Spara" för kortvarig jämförelse
8. **Behåll alltid** dina handskrivna anteckningar som huvuddokumentation

---

## Del 1: Parameterkänslighetsanalys

### Övning 1.1: Kp-parameterns påverkan och statiskt reglerfel
**Syfte:** Systematiskt utforska proportionalförstärkningens effekter och demonstrera statiskt reglerfel.

> **💡 Teori**: P-regulatorer (endast Kp, Ti=OFF) kan ALDRIG eliminera statiskt reglerfel helt. Felet minskar med högre Kp men försvinner aldrig utan integral-del (Ti).

#### Steg 1: Baslinje-system
1. **Process**: Självreglerande, K=1.3, T=15s, Dötid=0s
2. **Börvärde**: 60, **Mätområde**: 0-100
3. **Rensa historik**

#### Steg 2: Skapa anteckningstabell (i separat dokument)

**Anteckningsmall för Kp-variation och statiskt reglerfel:**

*Process: K=1.3, T=15s, Dötid=0s, Börvärde=60, Endast P-reglering (Ti=OFF, Td=OFF)*

| Test | Kp  | Stab.tid(s) | Översläng(%) | Slutvärde PV | Statiskt fel | Fel i % | Oscillerar? | Anteckningar |
|------|-----|-------------|--------------|--------------|--------------|---------|-------------|--------------|
| 1    |1.0  |             |              |              |              |         |             |              |
| 2    |3.0  |             |              |              |              |         |             |              |
| 3    |6.0  |             |              |              |              |         |             |              |
| 4    |9.0  |             |              |              |              |         |             |              |
| 5    |12.0 |             |              |              |              |         |             |              |

#### Steg 3: Kp-testsekvens (fyll i tabellen)
> **⚠️ Viktigt**: Klicka **"Återställ"** före VARJE test för att nollställa processens tillstånd.

För **varje** test:
1. **Återställ** (nollställer processen)
2. **Ställ in** Kp-värde (Ti=OFF, Td=OFF)
3. **Kör** simulering ~150s (längre för att se statiskt fel)
4. **Mät och anteckna** i din tabell:
   - Stabiliseringstid till ±5% av börvärde
   - Översläng i % över börvärde  
   - Slutligt processvärde (när kurvan blivit horisontell)
   - Statiskt fel = Börvärde - Slutligt processvärde
   - Fel i % = (Statiskt fel / Börvärde) × 100%
   - Ja/Nej för oscillationer

#### Steg 4: Analys från dina anteckningar
Använd din ifyllda tabell för att bestämma:
- **Optimal Kp**: Snabbast utan oscillation
- **Säkerhetsmarginaler**: Avstånd till instabilitetsgräns
- **Statiskt fel-trend**: Hur påverkar Kp det kvarvarande felet?

#### Steg 5: Börvärdestest med optimal Kp-kandidat
Nu när du identifierat en optimal Kp från steg 4, testa olika börvärden:

Skapa ny tabell:

*Process: K=1.3, T=15s, Kp=X.X (din optimala från steg 4), Ti=OFF, Td=OFF*

| Test | Börvärde | Slutvärde PV | Statiskt fel | Fel i % | Anteckningar |
|------|----------|--------------|--------------|---------|--------------|
| 1    | 30       |              |              |         |              |
| 2    | 50       |              |              |         |              |
| 3    | 70       |              |              |         |              |
| 4    | 90       |              |              |         |              |

**Testprocedur** (med din optimala Kp):
1. För varje börvärde: **Återställ** → Ställ in börvärde → **Kör** → Mät slutvärde
2. Beräkna och anteckna statiskt fel

#### Steg 6: Slutlig jämförelse och börvärdesdemonstration
Nu ska du demonstrera både Kp-effekter och börvärdes-påverkan:

**Del A - Kp-jämförelse:**
1. **Rensa historik**
2. **Test 1**: Lågt Kp (t.ex. Kp=1.0, börvärde=60) → **Spara** ("Lågt Kp - stort fel")
3. **Test 2**: Optimalt Kp (från din analys, börvärde=60) → **Spara** ("Optimalt Kp")
4. **Test 3**: Högt Kp (t.ex. Kp=12.0, börvärde=60) → **Spara** ("Högt Kp - litet fel")

**Del B - Börvärdestest med optimal Kp:**
1. **Rensa historik**  
2. **Använd dynamiska inställningar** för att demonstrera börvärdes-påverkan:
   - Starta med börvärde=30, kör tills stabilt
   - **Dynamiska inställningar**: Ändra börvärde till 60 → **Aktivera ändringar**  
   - **Observera**: Hur det statiska felet förändras proportionellt
   - **Dynamiska inställningar**: Ändra börvärde till 90 → **Aktivera ändringar**
3. **Spara** ("Börvärdes-påverkan")

**Reflektion 1.1:**
- Hur förändrades det statiska felet när Kp ökade? Blev det någonsin noll?
- Är det statiska felet proportionellt mot börvärdet? (Jämför % fel i dina tabeller)
- Vilken kompromiss såg du mellan snabb respons och stort Kp-värde?
- Vilken Kp-kandidat skulle du välja för verklig tillämpning?
- Varför kan inte P-regulatorn eliminera statiskt reglerfel helt?

---

### Övning 1.2: Ti-parameterns roll - Elimination av statiskt reglerfel
**Syfte:** Förstå integreringstidens påverkan på systemdynamik.

#### Steg 1: Anteckningsmall för Ti-variation
Skapa ny tabell i ditt dokument:

*Process: K=1.3, T=15s, Dötid=0s, Börvärde=60*  
*Regulator: Kp=x.x (från övning 1.1), Td=OFF*

| Test | Ti(s) | Tid till fel=0 | Oscillationer | Stabilitet | Anteckningar |
|------|-------|----------------|---------------|------------|--------------|
| 1    | 100   |                |               |            |              |
| 2    | 40    |                |               |            |              |
| 3    | 20    |                |               |            |              |
| 4    | 10    |                |               |            |              |
| 5    | 5     |                |               |            |              |

#### Steg 2: Ti-testsekvens (PI-reglering)
**Förberedelser**: Använd optimal Kp från övning 1.1, Td=OFF

> **⚠️ Viktigt**: Klicka **"Återställ"** före varje Ti-test för att säkerställa att integratorn startar från nolltillstånd.

För varje test:
1. **Återställ** (nollställer integratorn)
2. **Ställ in** Ti-värde
3. **Kör** simulering 150s (längre tid för I-effekt)
4. **Mät och anteckna**:
   - Tid tills stationärt fel = 0
   - Oscillationsbeteende (ingen/mild/stark)
   - Övergripande stabilitet (1-5 skala)
5. **Spara** endast intressanta kurvor för jämförelse

#### Steg 3: Analys och kandidatval
Från din anteckningstabell, identifiera:
- **Snabbaste Ti**: Snabbast fel-eliminering utan oscillation
- **Säkraste Ti**: Stabil men acceptabel hastighet  
- **Balanserad Ti**: Bästa kompromissen

#### Steg 4: Slutlig Ti-jämförelse (visuell)
Med dina 3 bästa kandidater från anteckningarna:

1. **Rensa historik**
2. **Återställ** → **Snabbaste**: Ställ in enligt resultat → Kör → **Spara** (märk: "Snabb Ti")
3. **Återställ** → **Säkraste**: Ställ in enligt resultat → Kör → **Spara** (märk: "Säker Ti")
4. **Återställ** → **Balanserad**: Ställ in enligt resultat → Kör → **Spara** (märk: "Balanserad Ti")
5. **Jämför** visuellt hur snabbt steady-state fel elimineras

**Reflektion 1.2:**
- Kunde PI-regulatorn eliminera det statiska felet helt (jämfört med P-regulatorn)?
- Hur påverkade Ti-värdet systemets stabilitet och responssnabbhet?
- Vilken kompromiss såg du mellan snabb elimination av statiskt fel och systemstabilitet?
- När skulle du välja en längre Ti (t.ex. Ti>20s) i praktiken?

---

### Övning 1.3: Td-parameterns optimering
**Syfte:** Förstå derivatadelens bidrag och begränsningar.

#### Steg 1: Anteckningsmall för Td-variation
Skapa ny tabell i ditt dokument:

*Process: K=1.3, T=15s, Dötid=0s, Börvärde=60*  
*Regulator: Kp=x.x, Ti=xs (optimal från tidigare övningar)*

| Test | Td(s) | Översläng(%) | Stab.tid(s) | Oscillationer | Brus-känslig? | Anteckningar |
|------|-------|--------------|-------------|---------------|---------------|--------------|
| 0    | 0     |              |             |               | Nej (baslinje)|              |
| 1    | 0.2   |              |             |               |               |              |
| 2    | 0.5   |              |             |               |               |              |
| 3    | 1.0   |              |             |               |               |              |
| 4    | 2.0   |              |             |               |               |              |

#### Steg 2: Td-testsekvens (PID-reglering)
**Förberedelser**: Använd optimal Kp och Ti från tidigare övningar

> **⚠️ Viktigt**: Klicka **"Återställ"** före varje Td-test för konsistenta startförhållanden.

För varje test:
1. **Återställ** (nollställer systemet)
2. **Ställ in** Td-värde (börja med Td=0 som baslinje)
3. **Kör** simulering 80s utan brus
4. **Anteckna** översläng, stabiliseringstid, oscillationsbeteende
5. **Aktivera brus** (amplitud 1.0), observera utsignal-variation
6. **Anteckna** bruskänslighet (Ja/Nej/Måttlig)

#### Steg 3: Analys och kandidatval
Från din anteckningstabell, identifiera:
- **Utan D-del**: Baslinje-prestanda (Td=0)
- **Optimal Td**: Bästa balansen snabbhet/bruskänslighet
- **Överdriven Td**: Där bruskänslighet blir problematisk

#### Steg 4: Slutlig Td-jämförelse (visuell)
Med dina 3 bästa kandidater från anteckningarna:

1. **Rensa historik**
2. **Återställ** → **Utan D-del**: Ställ in Td=0 → Kör → **Spara** (märk: "Utan D-del")
3. **Återställ** → **Optimal Td**: Ställ in enligt anteckningar → Kör → **Spara** (märk: "Optimal D-del")
4. **Med brus**: Aktivera brus (amplitud 1.0) → Upprepa båda testerna med **Återställ** före varje
5. **Jämför** effekten av D-delen med och utan brus

**Reflektion 1.3:**
- Bekräftar den visuella jämförelsen dina antecknade mätningar?
- Vilken Td ger bästa balansen mellan snabbhet och bruskänslighet?
- När skulle du välja att helt undvika D-delen?

---

### Övning 1.4: Integratoruppvridning (Windup) - Förståelse och hantering
**Syfte:** Demonstrera integratoruppvridning vid begränsade styrsignaler och förstå anti-windup-funktionen.

> **💡 Teori**: När styrsignalen når max/min-gränser fortsätter integratorn att "bygga upp" sitt bidrag eftersom felet kvarstår. Detta kallas "windup" och leder till långsam återhämtning när börvärdet ändras.

#### Steg 1: System för windup-demonstration
1. **Process**: Självreglerande, K=1.5, T=20s, Dötid=0s
2. **Börvärde**: 80, **Mätområde**: 0-100
3. **Utsignal**: **Min=0, Max=50** (begränsa styrsignalen!)
4. **Anti-windup**: **AVMARKERAD** (för att visa problemet)
5. **Rensa historik**

#### Steg 2: Anteckningsmall för windup-studier

*Process: K=1.5, T=20s, Börvärde=80, Utsignal: 0-50, Anti-windup=OFF*

**Scenario 1: Börvärdessteg med windup**

| Test | Kp | Ti(s) | Steg 1→2 | Stigtid(s) | Tid till mättnad | Recovery-tid(s) | Anteckningar |
|------|-------|------|---------|-----------|-----------------|-----------------| -------------|
| 1    | 3.0   | 8    | 80→90   |           |                 |                 |              |
| 2    | 3.0   | 8    | 90→70   |           |                 |                 |              |

**Scenario 2: Anti-windup-effekt**

| Test | Anti-windup | Börvärdessteg | Recovery-tid(s) | Förbättring | Anteckningar |
|------|-------------|---------------|-----------------|-------------|--------------|
| 3    | OFF         | 80→90→70      |                 | Baseline    |              |
| 4    | ON          | 80→90→70      |                 |             |              |

#### Steg 3: Demonstration av windup-problemet
**Test 1: Första börvärdessteget (80→90)**
1. **Återställ** 
2. **Inställningar**: Kp=3.0, Ti=8s, Td=OFF, Anti-windup=OFF
3. **Börvärde**: 80
4. **Kör** ~100s tills systemet stabiliseras
5. **Byt börvärde** till 90 (under körning via dynamiska inställningar)
6. **Aktivera ändringar** och fortsätt köra
7. **Observera**: Styrsignalen når max (50) och stannar där
8. **Mät**: Tid tills processvärdet når 90 (stigtid)
9. **Anteckna**: När styrsignalen blev mättad

**Test 2: Återhämtning - demonstrera windup-effekten**
1. **Fortsätt samma simulering** (eller återskapa scenariot)
2. **När PV ≈ 90**: Byt börvärde till 70 (stor minskning)
3. **Aktivera ändringar**
4. **Observera**: Långsam initial respons trots stort fel
5. **Mät**: Tid från börvärdesbyte tills PV börjar sjunka märkbart
6. **Anteckna**: "Recovery-tid" (visar windup-effekten)

#### Steg 4: Anti-windup-demonstrationen
**Test 3: Referenstest utan anti-windup**
1. **Återställ** och starta om hela sekvensen (80→90→70)
2. **Anti-windup**: OFF
3. **Dokumentera** hela förloppet, särskilt recovery-tiden vid 90→70

**Test 4: Med anti-windup aktiverad**
1. **Återställ**
2. **Anti-windup**: **MARKERAD** (aktivera funktionen)
3. **Upprepa** samma sekvens (80→90→70)
4. **Jämför** recovery-tiden med Test 3

#### Steg 5: Visuell jämförelse
1. **Rensa historik**
2. **Test A**: Återskapa "windup-problemet" (Anti-windup OFF) → **Spara** ("Windup problem")
3. **Test B**: Återskapa "anti-windup-lösningen" (Anti-windup ON) → **Spara** ("Anti-windup")
4. **Jämför** båda kurvorna, fokusera på recovery-fasen

#### Steg 6: Extremfall - Kraftig windup
För tydligare demonstration:
1. **Ändra till**: Ti=4s (snabbare integrator), Utsignal Max=30 (hårdare begränsning)
2. **Upprepa** börvärdessteget 80→95→60
3. **Observera** ännu kraftigare windup-effekter

**Reflektion 1.4:**
- Vad hände med recovery-tiden när anti-windup aktiverades?
- Varför blev responsen långsam vid börvärdesminskningar med windup?
- Hur påverkade Ti-värdet (4s vs 8s) windup-problemets storlek?
- I vilka verkliga situationer kan windup bli särskilt problematiskt?
- När är det kritiskt att använda anti-windup i praktiken?

---

## Del 2: Praktisk regulatorinställning

### Övning 2.1: Stegvis parameteroptimering
**Syfte:** Lära sig systematisk metod för manuell regulatorinställning enligt industriell praxis.

#### Grundprocess för alla steg
1. **Process**: K=1.0, T=30s, Dötid=2s
2. **Börvärde**: 60
3. **Rensa historik**

#### Steg 1: P-optimering med systematisk anteckning

**Skapa anteckningstabell:**

*Process: K=1.0, T=30s, Dötid=2s, Börvärde=60*

**P-OPTIMERING:**

| Test | Kp  | Stab.tid(s) | Översläng(%) | Oscillation | Status | Anteckningar |
|------|-----|-------------|--------------|-------------|--------|--------------|
| 1    | 0.5 |             |              |             |        |              |
| 2    | 1.0 |             |              |             |        |              |
| 3    | 1.5 |             |              |             |        |              |
| 4    | 2.0 |             |              |             |        |              |
| 5    | 2.5 |             |              |             |        |              |

**OPTIMAL P:** Kp = _____ (säkerhetsmarginal: _____%)

**Metodisk P-testning:**
1. **Återställ** (före varje test för konsistenta startförhållanden)
2. **För varje Kp**: Ställ in värde (Ti=OFF, Td=OFF)
3. **Kör test**: Börvärde-steg, observera respons
4. **Anteckna**: Alla mätningar i tabellen
5. **Hitta gräns**: När oscillationer börjar
6. **Välj säkert**: 20-30% under oscillationsgräns

#### Steg 2: I-delen optimering med anteckning

**Utöka din tabell:**

**PI-OPTIMERING (med optimal Kp från ovan):**

| Test | Ti(s) | Tid till fel=0 | Oscillation | Stabilitet | Anteckningar |
|------|-------|----------------|-------------|------------|--------------|
| 1    | 50    |                |             |            |              |
| 2    | 30    |                |             |            |              |
| 3    | 20    |                |             |            |              |
| 4    | 15    |                |             |            |              |
| 5    | 12    |                |             |            |              |
| 6    | 10    |                |             |            |              |

**OPTIMAL PI:** Kp=_____, Ti=_____s

**Metodisk Ti-testning:**
1. **Börja högt**: Ti=50s (låg I-effekt)
2. **Återställ** (före varje Ti-test för nollställd integrator)
3. **För varje Ti**: Testa setpoint-ändring
4. **Anteckna**: Tid till noll fel, oscillationsbeteende
5. **Hitta balans**: Snabb fel-eliminering utan instabilitet

#### Steg 3: D-delen fintrimmning med anteckning

**Komplettera tabellen:**

**PID-OPTIMERING (med optimal Kp, Ti från ovan):**

| Test | Td(s) | Översläng(%) | Stab.tid(s) | Brus-känslig | Anteckningar |
|------|-------|--------------|-------------|--------------|--------------|
| 0    | 0     |              |             | Nej          | PI-baslinje  |
| 1    | 0.5   |              |             |              |              |
| 2    | 1.0   |              |             |              |              |
| 3    | 1.5   |              |             |              |              |
| 4    | 2.0   |              |             |              |              |

**FINAL PID:** Kp=_____, Ti=_____s, Td=_____s

**Metodisk Td-testning:**
1. **Återställ** → **Baslinje**: Testa utan D-del först
2. **Återställ** → **För varje Td**: Mät förbättring i snabbhet
3. **Brustest**: Kontrollera bruskänslighet (med **Återställ** före varje test)
4. **Anteckna**: Balansen snabbhet vs bruskänslighet

#### Steg 4: Slutlig metodjämförelse (visuell)
Med dina dokumenterade resultat från steg 1-3:

1. **Rensa historik**
2. **Återställ** → **Endast P**: Ställ in optimal P från anteckningar → Kör → **Spara** (märk: "Optimal P")
3. **Återställ** → **PI-design**: Ställ in optimal PI från anteckningar → Kör → **Spara** (märk: "Optimal PI")
4. **Återställ** → **PID-design**: Ställ in final PID från anteckningar → Kör → **Spara** (märk: "Final PID")
5. **Jämför** progressionen P → PI → PID visuellt

**Reflektion 2.1:**
- Bekräftar den visuella jämförelsen din stegvisa progression?
- Vilken nytta gav varje steg (I-delen, D-delen) enligt kurvjämförelsen?
- Hur hjälpte den systematiska anteckningsmetoden din optimering?

---

### Övning 2.2: Robusthetsanalys
**Syfte:** Testa regulatorns prestanda under olika driftförhållanden.

#### Grundinställning
1. **Samma process**: K=1.3, T=15s, Dötid=0s
2. **Din optimala PID** från övning 2.1
3. **Rensa historik**

#### Steg 1: Setpoint-responstest
1. **Återställ** → **Stor ändring**: Börvärde 30→80 → **Spara** (märk: "Stor SP-ändring")
2. **Återställ** → **Liten ändring**: Börvärde 60→65 → **Spara** (märk: "Liten SP-ändring")
3. **Återställ** → **Negativ ändring**: Börvärde 70→40 → **Spara** (märk: "Negativ SP-ändring")

#### Steg 2: Störningshantering
1. **Återställ** → **Pulsstörning**: Aktivera pulse (amplitud=15, vid t=30s) → **Spara**
2. **Återställ** → **Kontinuerligt brus**: Aktivera noise (amplitud=1.0) → **Spara**
3. **Återställ** → **Kombination**: Pulse + Noise samtidigt → **Spara**

#### Steg 3: Prestanda-utvärdering
Dokumentera för varje test:
- **Stabiliseringstid** (95% av slutvärde)
- **Översläng** (% över slutvärde)
- **Steady-state fel** 
- **Brusskänslighet** (variation i utsignal)

**Reflektion 2.2:**
- Vilka kompromisser ser du mellan olika prestandamått?
- Hur skulle du prioritera mellan snabbhet och stabilitet?
- När skulle du överväga att justera regulatorn?

---

### Övning 2.3: Alternativa inställningsstrategier
**Syfte:** Jämföra olika approaches för regulatordesign.

#### Grundprocess
1. **Process**: K=0.8, T=25s, Dötid=5s (mer utmanande)
2. **Rensa historik**

#### Steg 1: Utveckla tre strategier (anteckna först)

**Anteckningsmall för strategijämförelse:**

*Process: K=0.8, T=25s, Dötid=5s*

| Strategi    | Kp  | Ti  | Td  | Filosofi  | Förväntad prestanda |
|-------------|-----|-----|-----|-----------|---------------------|
| Konservativ |     |     |     | Säkerhet  | Stabil, långsam     |
| Balanserad  |     |     |     | Kompromiss| Rimlig balans       |
| Aggressiv   |     |     |     | Snabbhet  | Snabb, riskabel     |

**Utveckla strategier:**
- **Konservativ**: Kp=1.0, Ti=35s, Td=0.5s (stora marginaler)
- **Balanserad**: Använd övning 2.1-metodik, anteckna resultat
- **Aggressiv**: Kp=2.8, Ti=10s, Td=2.5s (nära stabilitetsgräns)

#### Steg 2: Slutlig strategijämförelse (visuell)

**Direktjämförelse i samma diagram:**
1. **Rensa historik**
2. **Återställ** → **Konservativ**: Ställ in enligt tabell → Börvärde 40→70 → **Spara** (märk: "Konservativ")
3. **Återställ** → **Balanserad**: Ställ in enligt tabell → Samma test → **Spara** (märk: "Balanserad")  
4. **Återställ** → **Aggressiv**: Ställ in enligt tabell → Samma test → **Spara** (märk: "Aggressiv")

**Robusthetstest:**
5. **Rensa historik** 
6. **Återställ** → Upprepa alla tre med **störningspuls** (amplitud=10, t=50s)
7. **Spara** med namn: "Kons+störning", "Bal+störning", "Aggr+störning"

#### Steg 3: Strategianalys från visuell jämförelse
- **Snabbast setpoint-respons**: _______________
- **Bäst störningshantering**: _______________  
- **Mest stabil över tid**: _______________
- **Bäst för denna process**: _______________

**Reflektion 2.3:**
- Vilken strategi presterade bäst i den direkta jämförelsen?
- När skulle du välja konservativ vs aggressiv enligt resultaten?
- Hur bekräftade/motsade visuella resultaten dina förväntningar?

---

## Del 3: Verkliga designstrategier

### Övning 3.1: Ziegler-Nichols-metoden
**Syfte:** Testa klassisk inställningsmetod och jämföra med manuell optimering.

#### Steg 1: Hitta kritisk förstärkning med anteckning
**Process**: K=1.0, T=25s, Dötid=2s

**Kritisk punkt-anteckning:**

**ZIEGLER-NICHOLS BESTÄMNING:**

| Kp-test | Oscillation? | Amplitud | Period(s) | Anteckningar |
|---------|--------------|----------|-----------|--------------|
| 2.0     |              |          |           |              |
| 3.0     |              |          |           |              |
| 4.0     |              |          |           |              |
| 5.0     |              |          |           |              |

Kp_crit = _____ (där konstanta oscillationer börjar)

T_crit = _____ s (oscillationsperiod)

**Kritisk punkt-testning:**

1. **Återställ** → **Endast P-reglering**, börja Kp=2.0
2. **Återställ** → **Öka gradvis** och anteckna oscillationsbeteende
3. **Identifiera Kp_crit**: Konstanta oscillationer utan dämpning
4. **Mät T_crit**: Tid för en hel oscillation

#### Steg 2: Beräkna och anteckna ZN-parametrar

**Beräkning från dina mätvärden:**

- **P-reglering**: Kp = 0.5 × _____ = _____
- **PI-reglering**: Kp = 0.45 × _____ = _____, Ti = _____/1.2 = _____s
- **PID-reglering**: Kp = 0.6 × _____ = _____, Ti = _____/2 = _____s, Td = _____/8 = _____s

**Anteckna också din manuella optimering från övning 2.1:**

- **Manuell PID**: Kp = _____, Ti = _____s, Td = _____s

#### Steg 3: Metodjämförelse (visuell)

1. **Rensa historik**
2. **Återställ** → **ZN P**: Ställ in enligt beräkning → Kör → **Spara** (märk: "ZN P-metod")
3. **Återställ** → **ZN PI**: Ställ in enligt beräkning → Kör → **Spara** (märk: "ZN PI-metod")
4. **Återställ** → **ZN PID**: Ställ in enligt beräkning → Kör → **Spara** (märk: "ZN PID-metod")
5. **Återställ** → **Manuell**: Ställ in enligt övning 2.1 → Kör → **Spara** (märk: "Manuell metod")

**Reflektion 3.1:**

- Hur presterar Ziegler-Nichols jämfört med din manuella inställning?
- Vilka fördelar och nackdelar har standardmetoder?
- När skulle du använda ZN vs manuell optimering?

---

### Övning 3.2: Lambda-inställning

**Syfte:** Utforska modern inställningsmetodik baserad på önskad sluten-slinga-tidskonstant.

#### Steg 1: Lambda-beräkningar och anteckning

**Process**: K=1.0, T=20s, Dötid=0s

**LAMBDA-METOD BERÄKNINGAR:**

Process: K=1.0, T=20s, Dötid=0s

Formel: Kp = T/(K×(λ+dötid)), Ti = T, Td = 0

| Design      | λ(s) | Kp-beräkning      | Kp   | Ti | Td | Filosofi   |
|-------------|------|-------------------|------|----|----|------------|
| Konservativ | 40   | 20/(1×(40+0)) =   |      | 20 | 0  | Säkerhet   |
| Balanserad  | 20   | 20/(1×(20+0)) =   |      | 20 | 0  | Kompromiss |
| Aggressiv   | 10   | 20/(1×(10+0)) =   |      | 20 | 0  | Snabbhet   |

**Beräkna parametrar**: Fyll i Kp-kolumnen med dina beräkningar

#### Steg 2: Lambda-testning med anteckning
För varje design:
1. **Återställ** (nollställer processen)
2. **Ställ in** enligt beräknad tabell
3. **Kör** simulering och mät prestanda
4. **Anteckna** resultat:

**LAMBDA-TESTRESULTAT:**

| Design      | Stab.tid(s) | Översläng(%) | Stabilitet | Anteckningar |
|-------------|-------------|--------------|------------|--------------|
| Konservativ |             |              |            |              |
| Balanserad  |             |              |            |              |
| Aggressiv   |             |              |            |              |

#### Steg 3: Lambda-jämförelse (visuell)
Med dina beräknade och testade parametrar:

1. **Rensa historik**
2. **Återställ** → **Konservativ**: Ställ in λ=40s resultat → Kör → **Spara** (märk: "Lambda konservativ")
3. **Återställ** → **Balanserad**: Ställ in λ=20s resultat → Kör → **Spara** (märk: "Lambda balanserad")  
4. **Återställ** → **Aggressiv**: Ställ in λ=10s resultat → Kör → **Spara** (märk: "Lambda aggressiv")

#### Steg 4: Lambda med dötid (utökad analys)
**Uppdatera beräkningar** med dötid=5s:
- **Konservativ**: Kp = 20/(1×(40+5)) = _____
- **Balanserad**: Kp = 20/(1×(20+5)) = _____  
- **Aggressiv**: Kp = 20/(1×(10+5)) = _____

**Anteckna** hur dötid påverkar designfilosofin

**Reflektion 3.2:**
- Vilken lambda ger bäst kompromiss för din applikation?
- Hur påverkar dötid lambda-metodens prestanda?
- När är lambda-metoden överlägsen traditionella metoder?

---

## Del 4: Specialfall och avancerade tekniker

### Övning 4.1: Integrerande processer
**Syfte:** Hantera processer utan naturlig stabilitet.

#### Steg 1: Anteckningsmall för integrerande processer
**Process**: Integrerande, K=0.8, T=15s, Utflöde=1.5

**INTEGRERANDE PROCESS-TESTNING:**

| Regulator  | Kp  | Ti  | Td  | Stabilitet | Hastighet | Anteckningar        |
|------------|-----|-----|-----|------------|-----------|---------------------|
| P          | 1.2 | OFF | OFF |            |           | Förväntat: instabil |
| PI         | 1.0 | 10  | OFF |            |           |                     |
| PI (säker) | 0.8 | 15  | OFF |            |           |                     |
| PID        | 1.0 | 10  | 1.5 |            |           |                     |
| PID (säker)| 0.8 | 15  | 1.0 |            |           |                     |

> **⚠️ Integrerande processer**: Känsligare för överinställning. Förvänta instabilitet med P-reglering.

#### Steg 2: Systematisk testning av regulatorstrategier
För varje regulator i tabellen:
1. **Återställ** (viktigt för integrerande processer)
2. **Ställ in** parametrar enligt tabell
3. **Kör** simulering och observera stabilitet
4. **Anteckna** i tabellen: Stabil/Instabil/Marginell
5. **Mät hastighet** för stabila alternativ
6. **Obs**: Vid instabilitet, stoppa test för säkerhet

#### Steg 3: Slutlig jämförelse stabila alternativ
Från din tabell, identifiera stabila kandidater och jämför visuellt:

1. **Rensa historik**
2. **Återställ** → **PI-säker**: Ställ in stabil PI från tabell → Kör → **Spara** (märk: "PI säker")
3. **Återställ** → **PID-optimal**: Ställ in bästa PID från tabell → Kör → **Spara** (märk: "PID optimal")
4. **Jämför** prestanda mellan stabila alternativen

**Reflektion 4.1:**
- Varför är inte P-reglering optimal för integrerande processer?
- Hur skiljer sig parameterval från självreglerande processer?
- Vilka verkliga system är integrerande?

---

### Övning 4.2: Multivariabel påverkan  
**Syfte:** Förstå hur systemets komplexitet påverkar regulatordesign.

#### Steg 1: Anteckning för begränsningsanalys
**Process**: Självreglerande, K=1.0, T=20s

**BEGRÄNSNINGSANALYS:**

| Test        | Utsignal-gräns | Kp  | Ti | Td | Max utsignal | Prestanda | Anteckningar |
|-------------|----------------|-----|----|----|--------------|-----------|--------------|
| Standard    | 0-100%         | 1.2 | 10 | 2  |              |           |              |
| Begränsad   | 0-80%          | 1.2 | 10 | 2  |              |           |              |
| Anpassad    | 0-80%          | 0.8 | 15 | 1  |              |           |              |

#### Steg 2: Systematisk testning av begränsningar
För varje test i tabellen:
1. **Återställ** (nollställer integratorn för konsistent start)
2. **Konfigurera** systemet enligt tabell
3. **Stor setpoint-ändring**: 30 → 70
4. **Anteckna** maximal utsignal som uppnås
5. **Bedöm** prestanda (stabiliseringstid, översläng)
6. **Obs**: Anti-windup aktiverad för begränsade tester

#### Steg 3: Begränsningsjämförelse (visuell)
Med dina testade inställningar:

1. **Rensa historik**
2. **Återställ** → **Standard**: 0-100% gräns → Börvärde 30→70 → **Spara** (märk: "Obegränsad")
3. **Återställ** → **Begränsad**: 0-80% gräns, samma regulator → Samma test → **Spara** (märk: "Begränsad, samma PID")
4. **Återställ** → **Anpassad**: 0-80% gräns, mjukare regulator → Samma test → **Spara** (märk: "Begränsad, anpassad PID")
5. **Analysera** hur begränsningar påverkar systemrespons

**Reflektion 4.2:**
- Hur påverkar begränsningar regulatorprestanda?
- Vad är värdet av anti-windup?
- Hur skulle du designa för system med kända begränsningar?

---

## Masterövning: Komplett regulatordesign

### Övning 5: Systematisk PID-inställning från grunden
**Syfte:** Applicera den stegvisa inställningsmetodiken på en okänd process.

#### Scenario: Processlinje för vätsketemperatur
Du är processoperatör och ska ställa in en temperaturregulator för första gången.

**Processegenskaper (okända för dig initialt)**:
- Process: Självreglerande, K=0.7, T=40s, Dötid=6s  
- Normal drift: 65°C ±5°C
- Störningar: Omgivningstemperatur, flödesvariationer
- Säkerhetsgränser: Utsignal max 85% (överhettningsskydd)

#### Fas 1: Processanalys och P-optimering

**Skapa anteckningstabell först:**

*HUVUDANTECKNINGAR - Masterövning*

*Process: K=0.7, T=40s, Dötid=6s*

**P-OPTIMERING:**

| Kp | Stab.tid | Översläng | Oscillation | Status | Anteckningar |
|----|----------|-----------|-------------|--------|--------------|
|0.5 |          |           |             |        |              |
|1.0 |          |           |             |        |              |
|1.5 |          |           |             |        |              |
|2.0 |          |           |             |        |              |
|2.5 |          |           |             |        |              |

**OPTIMAL P:** Kp = _____ (säkerhetsmarginal: ____%)

**Metodisk P-optimering:**
1. **Rensa historik**  
2. **Börja konservativt**: Kp=0.5, Ti=OFF, Td=OFF
3. **För varje Kp-värde**: Testa, mät, anteckna i tabell
4. **Öka gradvis**: 0.5→1.0→1.5→2.0→2.5 (eller tills oscillation)
5. **Identifiera gräns**: Anteckna när oscillationer börjar
6. **Välj säkert värde**: 25-30% under oscillationsgräns
7. **Spara** endast slutresultatet för jämförelse

#### Fas 2: I-delen introduction och optimering

**Utöka din anteckningstabell:**

**PI-OPTIMERING (med optimal Kp från ovan):**

| Ti  | Tid till fel=0 | Oscillation | Stabilitet | Status |
|-----|----------------|-------------|------------|--------|
| 60  |                |             |            |        |
| 40  |                |             |            |        |
| 30  |                |             |            |        |
| 25  |                |             |            |        |
| 20  |                |             |            |        |
| 15  |                |             |            |        |

**OPTIMAL PI:** Kp=_____, Ti=_____ s

**Metodisk Ti-optimering:**
1. **Börja försiktigt**: Ti=60s (låg I-effekt)
2. **För varje Ti**: Testa setpoint-ändring, mät tid till noll fel
3. **Gradvis minskning**: Tills oscillationer eller instabilitet
4. **Balansera**: Snabb fel-eliminering utan försämrad stabilitet
5. **Anteckna** alla resultat, **spara** endast slutresultat

#### Fas 3: D-delen fintrimmning

**Komplettera anteckningstabell:**

**PID-FINTRIMMNING (med optimal Kp, Ti från ovan):**

| Td  | Översläng | Stab.tid | Brus-sens | Utsig-var | Status |
|-----|-----------|----------|-----------|-----------|--------|
| 0.0 |           |          | Låg       |           | Bas    |
| 0.5 |           |          |           |           |        |
| 1.0 |           |          |           |           |        |
| 1.5 |           |          |           |           |        |
| 2.0 |           |          |           |           |        |

**FINAL PID:** Kp=_____, Ti=_____s, Td=_____s

**Justerad Kp efter D:** _____ (om tillämpligt)

**Metodisk Td-optimering:**
1. **Utgå från PI**: Testa utan D-del som baslinje
2. **Försiktigt introduktion**: Börja Td=0.5s
3. **Mät översläng**: Setpoint-steg, registrera förbättring
4. **Brustest**: Aktivera noise, observera utsignal-variation
5. **Balans**: Bästa snabbhet utan överdriven brusamplifiering  
6. **Ev. Kp-ökning**: D-del kan tillåta högre Kp
7. **Anteckna** slutresultat, **spara** för jämförelse

#### Fas 4: Validering och robusthetstest

**Slutgiltig verifiering** (anteckna ALLA resultat):
1. **Återställ** → **Stresstest**: Börvärde 60→80, dokumentera prestanda
2. **Återställ** → **Störningspuls**: Amplitud 12 vid t=40s, mät återhämtningstid  
3. **Återställ** → **Säkerhetsgränser**: Kontrollera max utsignal < 85%
4. **Återställ** → **Brusstabilitet**: Kontinuerligt brus, mät utsignal-variation
5. **Dokumentera** alla mätningar, **spara** endast kritiska resultat

#### Fas 5: Slutlig designjämförelse

Från dina fas 1-4 anteckningar, välj dina **3 bästa designkandidater**:

**Designkandidater från anteckningar:**
1. **Konservativ design**: Säkra marginaler, stabil drift
2. **Balanserad design**: Bästa kompromiss prestanda/säkerhet  
3. **Aggressiv design**: Maximal prestanda inom säkerhetsgränser

**Slutlig visuell jämförelse:**
1. **Rensa historik**
2. **Återställ** → **Konservativ**: Ställ in enligt anteckningar → Börvärde 60→80 → **Spara** (märk: "Konservativ design")
3. **Återställ** → **Balanserad**: Ställ in enligt anteckningar → Samma test → **Spara** (märk: "Balanserad design")  
4. **Återställ** → **Aggressiv**: Ställ in enligt anteckningar → Samma test → **Spara** (märk: "Aggressiv design")
5. **Störningstest**: **Återställ** → Upprepa med pulsstörning för alla tre
6. **Dokumentera** skillnaderna mellan kurvorna

#### Fas 6: Prestandaanalys och slutdokumentation

**Från den visuella jämförelsen, dokumentera**:
- **Stabiliseringstid** för varje design: Kons___s, Bal___s, Aggr___s
- **Översläng** för varje design: Kons__%, Bal__%, Aggr__%
- **Störningsåterhämtning**: Kons___s, Bal___s, Aggr___s
- **Slutval och motivering**: ________________________________

**Design-reflektion**:
1. Vilken design presterade bäst i den visuella jämförelsen?
2. Stämde resultaten med dina förväntningar från anteckningarna?
3. Vilka kompromisser blev tydligast i den direkta jämförelsen?
4. Hur hjälpte den systematiska anteckningsprocessen din designprocess?
5. Vad skulle du göra annorlunda nästa gång?

**Industriell tillämpning**:
- Hur skulle du dokumentera denna process för kolleger?
- Vilka verktyg/metoder skulle förenkla denna process?
- Hur ofta skulle du behöva justera parametrarna?

---

## Avslutande reflektion

### Framtida tillämpning (baserat på din erfarenhet)
- **Standardiserad anteckningsmall**: Vad skulle du förbättra i din dokumentation?
- **Metodisk disciplin**: Hur säkerställa att du aldrig hoppar över anteckningar?
- **Kunskapsöverföring**: Kan kolleger följa din dokumentation för liknande system?

---
**Svårighetsgrad:** Medel-Avancerad
