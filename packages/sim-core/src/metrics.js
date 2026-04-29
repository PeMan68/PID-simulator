export function calculatePerformance(history) {
  const t = history.t;
  const y = history.y;
  const sp = history.sp;

  if (!t.length || y.length !== t.length || sp.length !== t.length) {
    return {
      overshoot: null,
      overshootPct: null,
      riseTime90: null,
      settlingTime5: null,
      iae: 0,
      ise: 0,
      steadyStateError: null
    };
  }

  const finalSp = sp[sp.length - 1];
  const absSp = Math.abs(finalSp) > 1e-9 ? Math.abs(finalSp) : 1;

  let maxY = -Infinity;
  let riseTime90 = null;
  let iae = 0;
  let ise = 0;

  for (let i = 0; i < y.length; i += 1) {
    if (y[i] > maxY) maxY = y[i];

    if (riseTime90 === null && y[i] >= 0.9 * finalSp) {
      riseTime90 = t[i];
    }

    const e = sp[i] - y[i];
    const dt = i === 0 ? 0 : t[i] - t[i - 1];
    iae += Math.abs(e) * dt;
    ise += e * e * dt;
  }

  const overshoot = maxY - finalSp;
  const overshootPct = (100 * overshoot) / absSp;

  let settlingTime5 = null;
  for (let i = 0; i < y.length; i += 1) {
    let settled = true;
    for (let j = i; j < y.length; j += 1) {
      if (Math.abs(y[j] - finalSp) > 0.05 * absSp) {
        settled = false;
        break;
      }
    }
    if (settled) {
      settlingTime5 = t[i];
      break;
    }
  }

  return {
    overshoot,
    overshootPct,
    riseTime90,
    settlingTime5,
    iae,
    ise,
    steadyStateError: y[y.length - 1] - finalSp
  };
}
