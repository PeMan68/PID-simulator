# Blockschema — reglerstrategier

FEAT-046. Fristående SVG-filer, inte kopplade till appens rendering (ingen
ändring av teori-/lärstigsschemat) — avsedda för återanvändning i lärstigar,
övningsdokument och presentationer när respektive strategi byggs
(Framkoppling: FEAT-045/STRAT-005; Kvotreglering/Kaskadreglering: ännu inga
uppdrag).

**Stil:** "Alternativ 2" (kursdiagram) — SP/PV/u, mätbar/omätbar störning,
givare och signalnamn utskrivna, inte en minimalistisk variant. Motivering:
samma filer återanvändbara i flera sammanhang minskar framtida arbete när
fler strategier byggs.

## Filer

| Fil | Strategi |
|---|---|
| `01-atrekoppling-pid.svg` | Återkoppling (PID) — referenspunkten |
| `02-framkoppling.svg` | Framkoppling, isolerat |
| `03-pid-plus-framkoppling.svg` | PID + Framkoppling tillsammans |
| `04-kvotreglering.svg` | Kvotreglering |
| `05-kaskadreglering.svg` | Kaskadreglering |

## Konsekvent färgkodning (samma i alla filer)

| Färg | Betyder |
|---|---|
| Orange `#e07a2f` | PID-regulator |
| Grönteal `#16a085` | Beräkningsblock (Framkoppling, Kvotblock) |
| Mörk blågrå `#3a4a58` / `#5b6875` | Process / Ventil |
| Lila `#8e44ad` | Mätbar störning/signal |
| Grå, streckad `#95a5a6` | Omätbar störning |
| Teal, ofylld pill `#2f7a8f` | Givare (mätning) |
| Blå `#1266f1` | PV-signal (matchar appens egen PV-färg i grafen) |

## Status

Prova-uppdrag (PO) — inte visuellt granskat i en riktig webbläsare av CC
(ingen webbläsare tillgänglig i denna miljö). Publicerat som Artifact för
granskning, se leveransmeddelandet. Kan behöva justeras — layout, avstånd
och linjedragning är gjorda utan visuell förhandsgranskning under
konstruktionen.
