/* GAM-003B/GAM-003C — Nivå-UI (DOM-rendering, DEV-only).
 *
 * Tunn presentationslogik ovanpå gamification-xp-engine.js/gamification-store.js
 * (båda DOM-fria och testade separat i Node). Den här filen känner INGET till
 * XP-regler eller persistensformat — den bara ritar upp given `levelInfo`
 * (se gamification-xp-engine.js:s levelForDisplay) mot den statiska
 * skal-markup som redan finns i index.html (#gamLevelPanel m.fl., "hidden"
 * som standard).
 *
 * Visar ALDRIG ett XP-tal eller en "X av Y XP"-text — bara nivånummer,
 * nivånamn och en grafisk andel (0..1). Se docs/development/GAMIFICATION-XP-PROTOTYPE.md.
 *
 * GAM-003C — komprimerad panel: bara badge/nivånummer/nivånamn/bar syns
 * permanent. Förklaringstexten och "Återställ progression" ligger i
 * `#gamLevelInfo`, som `render()` ALDRIG rör — bara `toggleInfo()` (kopplad
 * till klick på panelen) visar/döljer den. index.html:s CSS har fått en
 * `[hidden]`-täckande regel för `#gamLevelInfo`/`#gamLevelToast` — utan den
 * slog elementens egna `display`-deklarationer igenom `hidden`-attributet
 * (samma buggmönster som redan fanns för `.gam-level-panel`), vilket gjorde
 * att förklaringen och återställningsknappen syntes permanent innan
 * GAM-003C. Ingen "HÖGSTA NIVÅ"-text längre — nivå 8 visas bara som en helt
 * fylld bar.
 *
 * Laddas ENDAST i DEV (se app.js) — rör aldrig appens huvudfärger, grafens
 * signalfärger eller knapp-/regulatorfärgkodningen. Den enda visuella
 * kopplingen är CSS-variabeln --gam-accent, satt lokalt på #gamLevelPanel.
 */
(function () {
  if (typeof window === "undefined") return;

  // Nivåtillhörande accentfärger (GAM-003B, ACCENTFÄRGER). Påverkar ENDAST
  // badge/nivåmätare/kant/animation inom #gamLevelPanel — se CSS-scopet i
  // index.html. Namn/nummer förblir alltid huvudsignalen; färgen är ett
  // diskret tillägg (WCAG: kontrast kontrollerad mot --panel/--panel-strong).
  const TIER_ACCENTS = [
    "#64748b", // 1 Reglernovis — blågrå
    "#3b6ea5", // 2 Looplärling — blå
    "#2f8f9d", // 3 Signalspanare — blå/turkos
    "#21a3a3", // 4 Processutforskare — turkos
    "#2fa39a", // 5 Loopvävare — turkos
    "#7c5cbf", // 6 Regleradept — violett
    "#b5652d", // 7 Processmästare — koppar
    "#c9a227", // 8 Reglerlegend — guld
  ];

  // Enkel reglertekniks-glyf: en återkopplingsloop (pil som sluter en cirkel)
  // — samma symbol oavsett nivå, bara färgen (stroke) ändras per nivå.
  const LOOP_ICON_SVG =
    '<path class="gam-badge-icon" d="M 15 8 A 8 8 0 1 1 8.2 12.4 M 8.2 12.4 L 6.5 9.2 M 8.2 12.4 L 11.6 11.4" />';

  function badgeSvg() {
    // Sexkantig (hexagon) märkbricka — teknisk/fantasyinspirerad "shield"-känsla.
    return (
      '<svg viewBox="0 0 24 26" aria-hidden="true">' +
      '<polygon class="gam-badge-hex" points="12,1 22,7 22,19 12,25 2,19 2,7" />' +
      LOOP_ICON_SVG +
      "</svg>"
    );
  }

  function prefersReducedMotion() {
    try {
      return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      return false;
    }
  }

  let els = null;
  function findElements() {
    const panel = document.getElementById("gamLevelPanel");
    if (!panel) return null;
    return {
      panel,
      summary: document.getElementById("gamLevelSummary"),
      badge: document.getElementById("gamBadge"),
      barTrack: document.getElementById("gamLevelBarTrack"),
      barFill: document.getElementById("gamLevelBarFill"),
      levelNumber: document.getElementById("gamLevelNumber"),
      levelName: document.getElementById("gamLevelName"),
      info: document.getElementById("gamLevelInfo"),
      toast: document.getElementById("gamLevelToast"),
      resetBtn: document.getElementById("gamResetProgress"),
    };
  }

  function toggleInfo(force) {
    if (!els) return;
    const willShow = typeof force === "boolean" ? force : els.info.hidden;
    els.info.hidden = !willShow;
    els.summary.setAttribute("aria-expanded", willShow ? "true" : "false");
  }

  function render(levelInfo) {
    if (!els) return;
    els.panel.hidden = false;
    els.panel.style.setProperty("--gam-accent", TIER_ACCENTS[levelInfo.levelIndex] || TIER_ACCENTS[0]);
    els.badge.innerHTML = badgeSvg() + '<span class="gam-badge-number">' + (levelInfo.levelIndex + 1) + "</span>";
    els.levelNumber.textContent = String(levelInfo.levelIndex + 1);
    els.levelName.textContent = levelInfo.levelName;
    const pct = Math.round(levelInfo.ratio * 100);
    els.barFill.style.width = pct + "%";
    els.barTrack.setAttribute("aria-valuenow", String(pct));
    // GAM-003C: ingen "HÖGSTA NIVÅ"-text längre — nivå 8 indikeras enbart
    // genom att baren är helt fylld (ratio === 1 hanteras redan av
    // levelForDisplay/levelInfo, pct blir 100 utan särskild kod här).
  }

  function showLevelUp(levelInfo) {
    if (!els) return;
    const reduced = prefersReducedMotion();
    els.badge.classList.remove("gam-levelup-pulse");
    if (!reduced) {
      // Tvinga reflow så samma animationsklass kan triggas igen vid snabbt
      // efterföljande nivåbyten.
      void els.badge.offsetWidth;
      els.badge.classList.add("gam-levelup-pulse");
    }
    els.toast.textContent = "Ny nivå — " + levelInfo.levelName;
    els.toast.hidden = false;
    els.toast.classList.remove("gam-toast-animated");
    if (reduced) {
      window.setTimeout(() => { els.toast.hidden = true; }, 2500);
    } else {
      void els.toast.offsetWidth;
      els.toast.classList.add("gam-toast-animated");
      const onEnd = () => { els.toast.hidden = true; els.toast.classList.remove("gam-toast-animated"); els.toast.removeEventListener("animationend", onEnd); };
      els.toast.addEventListener("animationend", onEnd);
    }
  }

  function init(handlers) {
    els = findElements();
    if (!els) {
      console.warn("gamification-ui: #gamLevelPanel saknas i DOM — nivåytan startar inte.");
      return false;
    }
    els.summary.addEventListener("click", () => toggleInfo());
    els.resetBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Återställ progression?\n\nDetta tar bort din nivå och all registrerad XP-progression i PID Simulator (DEV-prototyp). Detta går inte att ångra. Andra appinställningar (t.ex. sidopanelernas storlek) påverkas inte."
      );
      if (confirmed && handlers && typeof handlers.onReset === "function") handlers.onReset();
    });
    return true;
  }

  window.GamificationUI = {
    TIER_ACCENTS,
    init,
    render,
    showLevelUp,
    toggleInfo,
    prefersReducedMotion,
  };
})();
