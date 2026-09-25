# Slutövning: Sammansatta reglersystem — en ångpanneanläggning
*Dokumentversion 1.0. Kräver PID Simulator 1.7.0 eller högre. Bygger vidare på samtliga fyra reglerstrategiers övningsdokument.*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Ett **sammansatt reglersystem** är inte en femte reglerstrategi — det är vad man kallar en anläggning där FLERA reglerkretsar (av de typer du redan känner till) samverkar, var och en för sitt eget delproblem. Källan till det här dokumentet, kursmaterialet *"Sammansatta reglersystem"* (kapitel 7), använder en **ångpanneanläggning** som sitt genomgående exempel — enligt materialet självt eftersom en pannanläggning "i stort sett innehåller alla tänkbara former av reglerkretsar", vilket gör den pedagogiskt värdefull just för det här avslutande kapitlet.

Det här dokumentet gör samma sak: det tar EN anläggning och ber dig placera rätt reglerstrategi på rätt delproblem, med dina EGNA, redan uppmätta resultat från de fyra tidigare övningsdokumenten som facit. Simulatorn har inga ångpannespecifika processer — varje deluppgift återanvänder istället en av de generiska scenarier du redan känner igen, som en **analogi**: samma reglertekniska struktur (samma sorts K/T-dynamik, samma sorts snabb/långsam relation), fast med en annan fysisk tolkning. Var uppmärksam på VAR analogin håller och var den inte gör det — det är en del av övningen, inte en brist i den.

**Förkunskaper:** `ovningar-reglerstrategier.md`, `ovningar-parameterstyrning.md`, `ovningar-framkoppling.md`, `ovningar-kvotreglering.md` och `ovningar-kaskadreglering.md` — samtliga genomförda, med dina uppmätta värden till hands. Den här övningen skapar inte ny mätdata från grunden, den SÄTTER SAMMAN vad du redan vet.

**Mål:** Kunna se en verklig, sammansatt anläggning och dela upp den i delproblem som var och en matchar EN av de fyra reglerstrategierna, motivera varje val med egna, tidigare uppmätta resultat, och förstå att en verklig anläggning sällan använder bara en strategi i taget.

## Anläggningen

En ångpanna producerar ånga genom att elda olja under en domtank (bild 7.10–7.11 i kursmaterialet, om du har tillgång till det). Tre delproblem, i tur och ordning:

1. **Domnivån** måste hållas inom snäva gränser — för lite vatten riskerar att skada pannan, för mycket försämrar ångkvaliteten. Matarvattnet regleras via en ventil, men flödet i matarvattenledningen kan variera snabbt (pumptryck, andra förbrukare i samma ledning) INNAN det hinner synas som en nivåförändring i domen.
2. **Förbränningen** (olja + luft) måste hålla ett visst förhållande för att bli fullständig och effektiv. Oljeflödet styrs i sin tur av hur mycket ånga som tas ut ur systemet (ångtaget) — ju mer ånga som förbrukas, desto mer olja måste eldas. Luftflödet måste följa oljeflödet i en konstant kvot, annars blir förbränningen ofullständig (för lite luft) eller onödigt ineffektiv (för mycket luft).
3. **Ångtaget** kan ändras snabbt och kraftigt (en stor förbrukare kopplas in eller ur). En sådan ändring är en KÄND, mätbar störning — den mäts direkt med en flödesgivare på ångledningen, innan den hunnit påverka vare sig domnivån eller förbränningen.

---

## Uppgift 1: Domnivån — varför kaskad?

**Bakgrund:** En snabb minskning av ångtaget kan, till synes paradoxalt, göra att domnivån TILLFÄLLIGT STIGER även om domen egentligen håller på att tömmas — trycksänkningen får kvarvarande vatten att koka häftigare och bilda fler ångbubblor ("swelling"). En regulator som bara ser nivån kan då göra fel: den tror nivån är för hög och stänger matarventilen, precis när den egentligen borde öppna den. En känslig länk (flödet i matarvattenledningen) reagerar däremot omedelbart på verkliga störningar i tillförseln, långt innan de hinner synas i den stora, tröga domnivån.

Det här är samma bakomliggande skäl som beskrivs för värmeväxlarens temperatur/flöde-kaskad i `ovningar-kaskadreglering.md` — en stor tidskonstant (domen/temperaturen) skyddas av en snabb, mätbar mellanvariabel (matarvattenflödet/värmemediets flöde).

**Uppgift:**
1. Hämta dina resultat från `ovningar-kaskadreglering.md` Uppgift 1 (störst avvikelse med och utan kaskad).
2. Föreslå: bör domnivån regleras med kaskad (nivå→flöde, analogt med temperatur→flöde i värmeväxlarexemplet), eller räcker en enkelslinge-nivåregulator? Motivera med dina uppmätta siffror.
3. **Reflektion:** Domnivån är ofta en INTEGRERANDE process (nivån ackumuleras, den söker inte tillbaka mot ett normalläge av sig själv, till skillnad från simulatorns självreglerande temperaturexempel). Skulle "swelling"-effekten (nivån rör sig först åt FEL håll innan den rör sig rätt) göra kaskadens fördel STÖRRE eller MINDRE än i värmeväxlarexemplet? Motivera resonemanget, du behöver inte simulera det.

---

## Uppgift 2: Förbränningen — varför kvot?

**Bakgrund:** Precis som i kursmaterialets exempel med luft/bränsle vid en gaseldad ugn (bild 7.2) eller katalysatorns lambdareglering i en bilmotor (bild 7.3): oljeflödet är den "vilda" signalen här (det bestäms av hur mycket ånga som behövs, inte av förbränningsregleringen själv), och luftflödet måste hållas i en FAST KVOT mot det — annars blir förbränningen ofullständig eller ineffektiv.

**Uppgift:**
1. Hämta dina resultat från `ovningar-kvotreglering.md` Uppgift 1 och 2 (kvotens stabilitet med/utan kvotreglering, och effekten av hur MYCKET den vilda signalen varierar).
2. Om oljeflödet (ångtaget) i den här anläggningen varierar KRAFTIGT och OFTA (jämför `ovningar-reglerstrategier-kvotreglering.md` Uppgift 1, Fall B) — vad säger det om hur motiverad en automatisk kvotreglering av luft/olja är, jämfört med att en operatör manuellt skulle justera luftspjället?
3. **Reflektion:** Lambdasondens exempel i kursmaterialet blockerar regulatorn helt om katalysatorns temperatur är under 300 °C. Varför skulle en liknande "spärr" (koppla bort kvotregleringen under vissa förhållanden) kunna vara motiverad även för olja/luft-kvoten i en ångpanna? Vilket tillstånd i pannan tror du skulle motivera en sådan spärr?

---

## Uppgift 3: Ångtaget som störning — varför framkoppling, inte (bara) kaskad eller kvot?

**Bakgrund:** Kursmaterialets egen bild av den kombinerade anläggningen (bild 7.9/7.11) visar att en flödesgivare på ångledningen (FT2) mäter ångtaget och adderar en kompensationssignal DIREKT till styrsignalen — INNAN förändringen hunnit synas som vare sig en nivåavvikelse (uppgift 1) eller en obalanserad kvot (uppgift 2). Det är framkoppling, applicerad på en tredje plats i SAMMA anläggning, för ett tredje syfte.

**Uppgift:**
1. Hämta dina resultat från `ovningar-framkoppling.md` Uppgift 1 (PID ensam mot PID + korrekt Kff) och `ovningar-reglerstrategier-framkoppling.md` Uppgift 2 (är framkoppling värt att bygga, givet hur ofta störningen inträffar).
2. Ångtaget i en ångpanna kan ändras flera gånger i timmen (produktionsvariationer) och är dessutom lätt att mäta EXAKT (en enda flödesgivare på en redan välkänd ledning). Jämför med `ovningar-reglerstrategier-framkoppling.md` Uppgift 2:s två fall (ofta/förutsägbart kontra sällan/osäkert) — vilket fall stämmer bäst med ångtaget?
3. **Reflektion:** Skulle man kunna lösa samma problem genom att göra domnivåns kaskad (Uppgift 1) "ännu snabbare" istället för att bygga framkoppling? Vad är skillnaden mellan att en störning fångas SNABBT av en redan befintlig snabb slinga (kaskadens princip) och att en störning kompenseras INNAN den ens uppstått som ett mätbart fel (framkopplingens princip)? Är det samma sak i praktiken, eller en verklig skillnad?

---

## Uppgift 4: Hela anläggningen — rita och motivera

**Syfte:** Sätta ihop uppgift 1–3 till en sammanhållen bild, och aktivt leta upp var den FJÄRDE strategin (Parameterstyrning) skulle passa in — den nämns inte i kursmaterialets ångpanneexempel, men det betyder inte att den saknar en naturlig plats där.

**Uppgift:**
1. Rita (för hand, eller beskriv i löptext) ett blockschema över hela anläggningen: domnivå-kaskaden (Uppgift 1), olja/luft-kvoten (Uppgift 2) och ångtags-framkopplingen (Uppgift 3), på samma sätt som kursmaterialets bild 7.11 gör. Markera var i schemat varje mätning (nivå, flöden, ångtag) sitter och vart varje signal går.
2. **Var passar Parameterstyrning?** En oljebrännares ventil är typiskt olinjär — den släpper igenom olja olika effektivt vid låg kontra hög öppning (jämför `ovningar-parameterstyrning.md` Uppgift 1/2:s ventilkarakteristik). Föreslå VILKEN regulator i ditt blockschema (domnivåns, luftens, eller någon annan) som skulle dra mest nytta av Parameterstyrning, och motivera med dina resultat från `ovningar-parameterstyrning.md` Uppgift 3.
3. Rangordna, med dina EGNA ord och egna uppmätta resultat, de fyra reglerstrategiernas "kostnad" (hur mycket extra som krävs för att bygga och underhålla dem) mot deras "nytta" i just DEN HÄR anläggningen. Är rangordningen densamma som du skulle fått i en helt annan sorts anläggning (t.ex. den vattenreningsanläggning `ovningar-kvotreglering.md` utgår från)?

**Slutreflektion:**
- Kursmaterialets sammanfattning konstaterar att "när flera reglerkretsar samverkar kallar man det för ett sammansatt reglersystem". Efter den här övningen: är de fyra strategierna du lärt dig FRISTÅENDE verktyg du väljer EN av åt gången, eller är det normala i en verklig anläggning att flera av dem samverkar samtidigt, var och en för sitt eget delproblem?
- Vilken av de fyra strategierna hade du, innan den här övningen, uppfattat som "mest avancerad" eller "svårast att motivera"? Har den bedömningen ändrats efter att ha sett den i sitt sammanhang i en verklig anläggning?
