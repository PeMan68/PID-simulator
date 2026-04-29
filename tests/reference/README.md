# reference tests

Tester i denna mapp verifierar att ny sim-core beter sig enligt definierade referensscenarion.

## Mal
- Skydda mot regressionsfel i regulator- och processlogik.
- Ge transparent toleranshantering mellan implementationer.

## Struktur (plan)
- scenarios/: indatafiler
- expected/: referensutdata
- core/: testkod

## Nuvarande filer
- smoke-all-scenarios.mjs: snabb smoke-test over alla scenarios
- baselines.v1.json: deterministiska referensvarden
- regression-check.mjs: strict regression mot baseline (seed + fasta steg)
