# PID Simulator — kort introduktion

*Läs detta innan du öppnar appen — sedan tar appens egen guide vid.*

## Vad är detta?

PID Simulator är ett webbaserat verktyg för att öva reglerteknik — i första hand hur en
PID-regulator beter sig, inte de fysiska mät- och styrdonen i en verklig anläggning.
Den ersätter inte laborationerna, men låter dig köra fler och snabbare experiment än vad
en fysisk labbmiljö medger, och visa reglertekniska fenomen (windup, dötid, störningar,
instabilitet …) som annars är svåra att demonstrera på riktigt.

Reglerloopen appen fokuserar på:

```
process → mätdon → regulator → styrdon → process
```

Öppna appen här: **https://peman68.github.io/PID-simulator/**
(fungerar i valfri webbläsare, inget att installera)

## Vad kan appen göra idag?

- Simulera både självreglerande processer (t.ex. temperatur) och integrerande processer
  (t.ex. tanknivå), med processförstärkning, tidskonstant och dötid som du själv ställer in
- Regulatorlägen: Manuell, On/Off, P, PI och PID — fritt justerbara parametrar
- Färdiga scenarier som startpunkt, eller egna fria inställningar
- Störningar: mätbrus och pulsstörningar, för att testa robusthet
- "Mät K/T/L" — läs av processparametrar direkt i grafen
- Hjälptexter (`?`-knappar) för varje parameter och regulatorläge
- Statusrad som visar SP, PV, reglerfel och utsignal, samt P-, I- och D-bidragen separat
- Guidade lärstigar (se nedan) med reflektionsfrågor

## Börja här: "Kom igång med PID Simulator"

Appen har en inbyggd guide som går igenom gränssnittet steg för steg — panelerna, hur du
laddar ett scenario, kör/stegar en simulering, ändrar parametrar och hittar hjälp. Välj den
längst upp i lärstigslistan i vänster sidebar och klicka "Ladda lärstig". Den tar 5–10
minuter och kräver inga förkunskaper.

## Lärstigarna — i ordning

Efter "Kom igång" bygger lärstigarna på varandra, från grunderna till mer avancerade
fenomen:

1. **Kom igång med PID Simulator** — genomgång av gränssnittet
2. **Öppen slinga, On/Off och P-reglering** — från ingen reglering alls till P-reglering
3. **Proportionalband och regulatorförstärkning** — PB, Kp, och P vs PI
4. **PI- och PID-reglering** — kontrollerad jämförelse mellan PI och PID
5. **Processens begränsningar** — vad K, T och L betyder, och varför SP inte alltid nås
6. **Windup och anti-windup** — vad som händer när utsignalen mättas länge
7. **Störningar och robusthet** — hur P/I/D hanterar brus och pulsstörningar olika

Varje lärstig körs i **Guidat läge** — fri utforskning i din egen takt, med
reflektionsfrågor längs vägen, ingen poängräkning.

## Övningsblad vid sidan av

Utöver lärstigarna i appen finns fristående övningsdokument i `docs/exercises/` som du
löser med hjälp av simulatorn men som inte är inbyggda i appen (t.ex.
[ovningar-reglerstrategier.md](ovningar-reglerstrategier.md)). De pekar ut vilka
process-/regulatorvärden du ska ställa in själv i appen — inget extra att installera.

---
**Version:** matchar PID Simulator v1.5.3.
