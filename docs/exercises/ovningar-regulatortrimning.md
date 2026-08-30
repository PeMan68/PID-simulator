# Övningsuppgifter: Regulatortrimning i praktiken
*Anpassad för nuvarande PID-simulator (webbapp) — inga färdiga scenariofiler, du ställer in
processen och trimmar regulatorn själv utifrån realistiska driftfall.*

> **⚠️ Viktigt meddelande**: Denna övningssamling har delvis genererats med AI-assistans och
> kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din
> tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid
> tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

De här övningarna skiljer sig från appens guidade lärstigar: det finns inga checkpoints med
rätt/fel-svar och ingen quiz. Du får en realistisk process, en medvetet dåligt trimmad
regulator och ett mål — sen är det din uppgift att själv hitta en bra inställning genom att
testa, mäta och justera. Precis som i verkligheten finns det inget facit i appen; bara ett
mål att uppnå och din egen bedömning av om resultatet är bra nog.

**Förkunskaper:** Du bör ha gått igenom lärstigarna *Grundläggande reglering*, *PI- och
PID-reglering* samt *Processens begränsningar* i appen (eller motsvarande kunskap om P/I/D
och processparametrarna K, T, L).

**Mål:** Utveckla en systematisk känsla för regulatortrimning — inte genom att memorera en
formel, utan genom att se hur olika processer kräver olika avvägningar.

**Om scenarier:** De sex övningarna nedan bygger inte på färdiga scenariofiler i appens
scenariolista (i skrivande stund) — du ställer in Process- och Regulator-grupperna manuellt
enligt tabellerna nedan. Det är avsiktligt: att själv skriva in K, T och L och se vad det gör
med processen är en del av övningen. Om scenariofiler för denna progression byggs in i appen
senare kan de ersätta det manuella uppstartssteget, men instruktionerna nedan fungerar lika
bra ändå.

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

**Appen har ingen "spara flera kurvor"-funktion.** Till skillnad från den gamla
Python-appen kan du inte lägga flera körningar ovanpå varandra för visuell jämförelse — du
ser bara den senaste körningen i grafen. **Din anteckningstabell är därför din enda
dokumentation.** Skriv upp resultat för varje test innan du kör nästa, annars försvinner det
när du klickar Återställ.

**Rekommenderat arbetsflöde för varje test:**
1. **Återställ system** (nollställer processvärde och integrator — annars bär du med dig
   föregående tests tillstånd in i det nya testet)
2. Ställ in Kp/Ti/Td enligt din plan
3. **Kör** tillräckligt länge (minst 3–5 gånger processens T, se varje övnings anvisning)
4. Läs av grafen (crosshair) och statusraden — anteckna i din tabell
5. Justera och upprepa

---

## Övning 1: Värmeplatta — P-reglering

**Bakgrund:** En liten värmeplatta med snabb, enkel dynamik. Bra process att börja med
eftersom effekten av Kp syns tydligt utan att andra effekter (dötid, integrering) stör bilden.

**Ställ in processen:**
| Processtyp | K | T | L | SP |
|---|---|---|---|---|
| Självreglerande | 1.2 | 12 | 0 | 65 |

**Startinställning (medvetet för svag):** Läge **P**, Kp = **0.3**

**Mål:** Hitta ett Kp som ger snabb stabilisering (inom ca 40 steg) utan synlig svängning.
Ett kvarstående fel är förväntat med bara P-reglering — det är inte målet att eliminera det
här, bara att hitta en bra balans mellan snabbhet och stabilitet.

**Anteckningstabell:**

| Test | Kp | Stab.tid (steg) | Kvarstående fel | Svänger? | Anteckningar |
|---|---|---|---|---|---|
| 1 | 0.3 (start) | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Reflektion:**
- Vilket Kp gav bäst balans mellan snabbhet och stabilitet?
- Hur stort blev det kvarstående felet vid ditt bästa Kp — och varför försvinner det inte
  oavsett hur högt du sätter Kp?

---

## Övning 2: Flödesregulator — PI-reglering

**Bakgrund:** Flödesreglering i en processledning — snabbare process än värmeplattan, med
lite dötid från givare/aktuator. Här ska du både trimma regulatorn och testa hur den svarar
på ett börvärdessteg, som i verklig drift när produktionsmålet ändras.

**Ställ in processen:**
| Processtyp | K | T | L | SP (start) |
|---|---|---|---|---|
| Självreglerande | 1.0 | 8 | 1 | 40 |

**Startinställning (medvetet för trög):** Läge **PI**, Kp = **0.2**, Ti = **50**

**Mål:** Låt processen stabiliseras vid SP=40 först. Ändra sedan SP till **70** och kör
vidare. Sikta på att PV når och stannar inom ±5 % av 70 inom **60 steg** efter
SP-ändringen, med en översläng under **10 %**.

**Anteckningstabell:**

| Test | Kp | Ti | Tid till 70±5% (steg) | Översläng (%) | Anteckningar |
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

**Bakgrund:** En värmeväxlare med lång rörledning ger betydande dötid mellan att
styrsignalen ändras och att effekten syns i mätvärdet. Startinställningen nedan är
medvetet för aggressiv — kör den först som den är för att se problemet innan du fixar det.

**Ställ in processen:**
| Processtyp | K | T | L | SP |
|---|---|---|---|---|
| Självreglerande | 1.0 | 20 | 8 | 55 |

**Startinställning (medvetet för aggressiv — svänger):** Läge **PID**, Kp = **3.0**,
Ti = **5**, Td = **0.5**

**Mål:** Dämpa svängningen helt (ingen synlig oscillation efter insvängning), men utan att
göra regulatorn onödigt långsam — sikta på insvängning inom **150 steg**.

**Anteckningstabell:**

| Test | Kp | Ti | Td | Svänger? | Stab.tid (steg) | Anteckningar |
|---|---|---|---|---|---|---|
| 1 | 3.0 / 5 / 0.5 (start) | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

**Reflektion:**
- Vilken parameter behövde du ändra mest för att få bort svängningen — Kp, Ti eller Td?
- Hur märks dötidens inverkan jämfört med värmeplattan i Övning 1 (som hade L=0)?

---

## Övning 4: Tanknivå — integrerande process

**Bakgrund:** Nivåreglering i en tank saknar en naturlig jämviktspunkt: utan reglering
fortsätter nivån att stiga eller sjunka. Det gör processen mer känslig för aggressiv
inställning än de självreglerande processerna i tidigare övningar.

**Ställ in processen:**
| Processtyp | K | Utflöde | SP |
|---|---|---|---|
| Integrerande | 0.6 | 1.2 | 50 |

**Startinställning (medvetet nära instabil):** Läge **PI**, Kp = **2.5**, Ti = **5**

**Mål:** Hitta en inställning där nivån stabiliseras vid SP utan tilltagande svängning.
Kom ihåg att en integrerande process kräver försiktigare parametrar än en självreglerande —
en inställning som fungerade fint i Övning 2 kan vara alldeles för aggressiv här.

**Anteckningstabell:**

| Test | Kp | Ti | Stabil? | Stab.tid (steg) | Anteckningar |
|---|---|---|---|---|---|
| 1 | 2.5 / 5 (start) | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Reflektion:**
- Vad hände när du körde starttinställningen obehandlad? Växande eller konstant svängning?
- Varför krävde den här processen lägre Kp/högre Ti än den självreglerande processen i
  Övning 2, trots liknande K-värde?

---

## Övning 5: Reaktor med ventilbegränsning

**Bakgrund:** En kemisk reaktor där styrventilen fysiskt inte klarar mer än 75 % öppning —
en realistisk säkerhets- eller kapacitetsbegränsning. Startinställningen är medvetet för
svag den här gången.

**Ställ in processen:**
| Processtyp | K | T | L | U min | U max | SP |
|---|---|---|---|---|---|---|
| Självreglerande | 0.9 | 25 | 6 | 0 | **75** | 70 |

**Startinställning (medvetet för svag):** Läge **PID**, Kp = **0.3**, Ti = **40**, Td = **0**

**Mål:** Minimera insvängningstiden utan kvarstående fel — men utsignalen får aldrig
egentligen behöva gå över 75 % (den kan inte fysiskt göra det; U max sätter en hård gräns).
Håll ett öga på u i statusraden när du ökar Kp.

**Anteckningstabell:**

| Test | Kp | Ti | Td | Stab.tid (steg) | Max u (%) | Anteckningar |
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

**Bakgrund:** Du är nyanställd processoperatör och ska ställa in en temperaturregulator för
första gången. Processen har både lång tidskonstant, betydande dötid och en säkerhetsgräns
på styrventilen mot överhettning. Ingen regulator är förinställd — du börjar helt från
grunden, precis som i övning 1.1 i det ursprungliga kursmaterialet.

**Ställ in processen:**
| Processtyp | K | T | L | U min | U max | SP |
|---|---|---|---|---|---|---|
| Självreglerande | 0.7 | 40 | 6 | 0 | **85** | 65 |

**Startinställning:** Läge **Manuell**, Manuell u = **0** (helt otrimmad)

**Uppdraget har fyra faser:**

**Fas 1 — Grundinställning.** Byt till Läge P, sedan PI, sedan PID (som i övning 1–3) och
hitta en stabil PID-inställning som når SP=65 inom rimlig tid, utan att u någonsin behöver
överstiga 85 %.

**Fas 2 — Börvärdessteg.** Med din inställning från Fas 1: ändra SP från 65 till 75 under
körning. Mät stigtid och översläng.

**Fas 3 — Störningstålighet.** Återställ till stabilt läge vid SP=65. Klicka **Trigga puls**
(Puls mag=12, Puls steg=5) och mät återhämtningstiden.

**Fas 4 — Dokumentation.** Skriv ner din slutgiltiga Kp, Ti och Td, och motivera kort varför
du landade där — vilka kompromisser gjorde du mellan snabbhet, översläng och
säkerhetsmarginal mot 85 %-gränsen?

**Anteckningstabell:**

| Fas | Kp | Ti | Td | Resultat | Anteckningar |
|---|---|---|---|---|---|
| 1 — Grundinställning | | | | | |
| 2 — SP-steg 65→75 | | | | Stigtid: ___ Översläng: ___% | |
| 3 — Pulsstörning | | | | Återhämtningstid: ___ | |

**Slutlig motivering (fritext):**
_______________________________________________________________________

---

## Sammanfattande principer

Oavsett vilken process du trimmar, håll fast vid samma ordning:

1. **Börja med P.** Öka Kp tills systemet nästan blir instabilt, backa sedan 30–50 %.
2. **Lägg till I** för att eliminera kvarstående fel. Börja med ett högt Ti och sänk
   gradvis tills fel-eliminationen känns tillräckligt snabb, utan att systemet börjar svänga.
3. **Lägg till D försiktigt**, bara om du behöver snabbare respons eller mindre översläng.
   Td bör normalt vara betydligt mindre än Ti.
4. **Ju svårare process** (större dötid relativt tidskonstant, integrerande karaktär,
   begränsad utsignal), **desto försiktigare inställning.**

En inställning som fungerar perfekt på en process kan vara helt fel på en annan — det är
poängen med att öva på flera olika, realistiska processer i den här övningssamlingen.

---

**Tips för lärare:** Låt studenter jämföra sina slutgiltiga Kp/Ti/Td-värden och
motiveringar i grupp — det finns sällan bara en rätt lösning, och diskussionen om *varför*
två studenter landade i olika avvägningar är ofta mer lärorik än facit hade varit.
