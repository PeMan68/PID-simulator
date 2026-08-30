# Övningsuppgifter: Regulatortrimning i praktiken

> **⚠️ Viktigt meddelande**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

I de här övningarna får du en realistisk process, en dåligt trimmad regulator och ett mål. Din uppgift är att själv hitta en regulatorinställning som når målet genom att testa, mäta och justera.

**Förkunskaper:** Du bör känna till P-, I- och D-delens roll i en PID-regulator samt processparametrarna K, T och L.

**Mål:** Utveckla en systematisk känsla för regulatortrimning genom att öva på flera olika, realistiska processer.

Du ställer in Process- och Regulator-grupperna manuellt enligt tabellerna nedan — det finns inga färdiga scenarier att ladda för dessa övningar.

---

## Verktyg i appen — snabbreferens

| Vad | Fält/knapp |
|---|---|
| Processtyp, K, T, L, Normalvärde, Utflöde | Process-gruppen |
| Läge (OnOff/P/PI/PID/Manuell), Kp, Ti, Td, Anti-windup, U min/U max | Regulator-gruppen |
| Börvärde | SP (Styrning-gruppen) |
| Kontinuerligt brus / pulsstörning | Brus std, Puls mag, Puls steg + knappen **Trigga puls** |
| Kör simuleringen | **Stega 1** (ett steg), **Kör 10 steg** (upprepa för längre körningar) |
| Nollställ grafen utan att ändra parametrar | **Rensa graf** |
| Nollställ hela simuleringen (processvärde, integrator, tid) | **Återställ system** |
| Läs av K/T/L eller exakta punkter i en kurva | **Mät K/T/L**, eller håll musen över grafen för crosshair-tooltip |

Grafen visar bara den senaste körningen. Skriv upp resultatet för varje test i din anteckningstabell innan du kör nästa — annars försvinner det när du klickar Återställ.

**Arbetsflöde för varje test:** Återställ system → ställ in Kp/Ti/Td → kör tillräckligt länge (se varje övnings anvisning) → läs av grafen (crosshair) och statusraden → anteckna → justera → upprepa.

---

## Övning 1: Värmeplatta — P-reglering

**Bakgrund:** En liten värmeplatta med snabb, enkel dynamik. Bra process att börja med eftersom effekten av Kp syns tydligt.

**Ställ in processen:**

| Processtyp | K | T | L | SP |
|---|---|---|---|---|
| Självreglerande | 1.2 | 12 | 0 | 65 |

**Startinställning:** Läge **P**, Kp = **0.3**

**Mål:** Hitta ett Kp som ger ett kvarstående fel under 20 (PV över 45) inom 40 steg, utan att utsignalen ligger fast vid taket (100 %) mer än några enstaka steg.

**Anteckningstabell:**

| Test | Kp | PV vid steg 40 | Kvarstående fel | Steg vid taket (100 %) | Anteckningar |
|---|---|---|---|---|---|
| 1 | 0.3 (start) | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Reflektion:**
- Hur ändras det kvarstående felet när du ökar Kp?
- Varför försvinner det kvarstående felet aldrig helt, oavsett hur högt du sätter Kp?
- Vad händer med utsignalen när Kp blir stort?

---

## Övning 2: Flödesregulator — PI-reglering

**Bakgrund:** Flödesreglering i en processledning, med lite dötid från givare och aktuator. Du testar både trimning och hur regulatorn svarar på ett börvärdessteg.

**Ställ in processen:**

| Processtyp | K | T | L | SP (start) |
|---|---|---|---|---|
| Självreglerande | 1.0 | 8 | 1 | 40 |

**Startinställning:** Läge **PI**, Kp = **0.2**, Ti = **50**

**Mål:** Låt processen stabiliseras vid SP=40. Ändra sedan SP till **70** och kör vidare. Sikta på att PV når och stannar inom ±5 % av 70 inom **60 steg** efter SP-ändringen, med en översläng under **10 %**.

**Anteckningstabell:**

| Test | Kp | Ti | Tid till 70±5 % (steg) | Översläng (%) | Anteckningar |
|---|---|---|---|---|---|
| 1 | 0.2 / 50 (start) | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Reflektion:**
- Vilken kombination av Kp och Ti gav snabbast respons utan att överskrida 10 % översläng?
- Vad hände när du sänkte Ti för mycket?

---

## Övning 3: Värmeväxlare med dötid — PID-reglering

**Bakgrund:** En värmeväxlare med lång rörledning ger betydande dötid mellan att styrsignalen ändras och att effekten syns i mätvärdet.

**Ställ in processen:**

| Processtyp | K | T | L | SP |
|---|---|---|---|---|
| Självreglerande | 1.0 | 20 | 8 | 55 |

**Startinställning:** Läge **PID**, Kp = **3.0**, Ti = **5**, Td = **0.5**

**Mål:** Startinställningen ger en kraftig översläng (över 10 %) och gör att utsignalen ligger fast vid taket under en stor del av körningen. Sikta på en översläng under 5 % och insvängning inom 100 steg, med högst enstaka steg vid taket.

**Anteckningstabell:**

| Test | Kp | Ti | Td | Översläng (%) | Steg vid taket | Insvängningstid (steg) | Anteckningar |
|---|---|---|---|---|---|---|---|
| 1 | 3.0 / 5 / 0.5 (start) | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |

**Reflektion:**
- Vilken parameter behövde du ändra mest för att få bort den kraftiga överslängen — Kp, Ti eller Td?
- Hur märks dötidens inverkan jämfört med värmeplattan i Övning 1 (som hade L=0)?

---

## Övning 4: Tanknivå — integrerande process

**Bakgrund:** Nivåreglering i en tank saknar en naturlig jämviktspunkt: utan reglering fortsätter nivån att stiga eller sjunka.

**Ställ in processen:**

| Processtyp | K | Utflöde | SP |
|---|---|---|---|
| Integrerande | 0.6 | 1.2 | 50 |

**Startinställning:** Läge **PI**, Kp = **5**, Ti = **2**

**Mål:** Startinställningen gör att nivån svänger kontinuerligt och aldrig lugnar ner sig. Hitta en inställning där nivån stabiliseras vid SP utan svängning, inom 150 steg.

**Anteckningstabell:**

| Test | Kp | Ti | Svänger fortfarande? | Insvängningstid (steg) | Anteckningar |
|---|---|---|---|---|---|
| 1 | 5 / 2 (start) | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Reflektion:**
- Hur ser svängningen ut i grafen med startinställningen — dämpas den eller fortsätter den?
- Varför krävde den här processen mycket lägre Kp/högre Ti än flödesregulatorn i Övning 2, trots liknande K-värde?

---

## Övning 5: Reaktor med ventilbegränsning

**Bakgrund:** En kemisk reaktor där styrventilen fysiskt inte klarar mer än 75 % öppning — en realistisk kapacitetsbegränsning.

**Ställ in processen:**

| Processtyp | K | T | L | U min | U max | SP |
|---|---|---|---|---|---|---|
| Självreglerande | 1.3 | 25 | 6 | 0 | **75** | 70 |

**Startinställning:** Läge **PID**, Kp = **0.3**, Ti = **40**, Td = **0**

**Mål:** Startinställningen är för svag — den når inte SP inom rimlig tid. Sikta på insvängning inom 150 steg, med litet eller inget kvarstående fel, utan att u ligger vid taket (75 %) mer än enstaka steg.

**Anteckningstabell:**

| Test | Kp | Ti | Td | Insvängningstid (steg) | Max u (%) | Anteckningar |
|---|---|---|---|---|---|---|
| 1 | 0.3 / 40 / 0 (start) | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

**Reflektion:**
- Blev du någonsin begränsad av U max=75 % under dina tester? Vad hände med regulatorn då?
- Är Anti-windup viktigt i den här övningen? Testa med den avmarkerad om du är osäker.

---

## Mästarövning: Temperaturlinje i processindustrin

**Bakgrund:** Du ska ställa in en temperaturregulator för en process med lång tidskonstant, betydande dötid och en säkerhetsgräns på styrventilen mot överhettning. Ingen regulator är förinställd.

**Ställ in processen:**

| Processtyp | K | T | L | U min | U max | SP |
|---|---|---|---|---|---|---|
| Självreglerande | 1.0 | 40 | 6 | 0 | **85** | 65 |

**Startinställning:** Läge **Manuell**, Manuell u = **0**

**Uppdraget har tre faser:**

**Fas 1 — Grundinställning.** Byt till Läge P, sedan PI, sedan PID (som i Övning 1–3) och hitta en stabil PID-inställning som når SP=65 inom 350 steg, med kvarstående fel nära noll, utan att u någonsin behöver överstiga 85 %.

**Fas 2 — Börvärdessteg.** Med din inställning från Fas 1: ändra SP från 65 till 75 under körning. Mät stigtid och översläng, och håll koll på att u fortfarande stannar under 85 %.

**Fas 3 — Störningstålighet.** Återställ till stabilt läge vid SP=65. Klicka **Trigga puls** (Puls mag=12, Puls steg=5) och mät återhämtningstiden.

**Anteckningstabell:**

| Fas | Kp | Ti | Td | Resultat | Anteckningar |
|---|---|---|---|---|---|
| 1 — Grundinställning | | | | | |
| 2 — SP-steg 65→75 | | | | Stigtid: ___ Översläng: ___% | |
| 3 — Pulsstörning | | | | Återhämtningstid: ___ | |

**Slutlig motivering (fritext):** Skriv ner din slutgiltiga Kp, Ti och Td, och motivera kort vilka kompromisser du gjorde mellan snabbhet, översläng och säkerhetsmarginal mot 85 %-gränsen.

_______________________________________________________________________

---

## Sammanfattande principer

Oavsett vilken process du trimmar, håll fast vid samma ordning:

1. **Börja med P.** Öka Kp tills systemet blir instabilt eller för aggressivt, backa sedan 30–50 %.
2. **Lägg till I** för att eliminera kvarstående fel. Börja med ett högt Ti och sänk gradvis tills fel-eliminationen känns tillräckligt snabb, utan att systemet börjar svänga.
3. **Lägg till D försiktigt**, bara om du behöver snabbare respons eller mindre översläng. Td bör normalt vara betydligt mindre än Ti.
4. **Ju svårare process** (större dötid relativt tidskonstant, integrerande karaktär, begränsad utsignal), **desto försiktigare inställning.**

En inställning som fungerar perfekt på en process kan vara helt fel på en annan — det är poängen med att öva på flera olika, realistiska processer.
