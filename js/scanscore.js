"use strict";

function updateScanScore(settings, scanScoreElement) {
  let score = 100;
  const contrast = getContrastScore(settings.darkColor, settings.lightColor);

  if (contrast < 80) score -= 25;
  if (settings.logoSize > 0.22) score -= 18;
  if (settings.dotStyle === "dots") score -= 8;
  if (settings.transparent) score -= 5;
  if (settings.frameStyle === "neon") score -= 4;

  if (score >= 85) {
    scanScoreElement.textContent = "Scan Quality: Excellent";
    scanScoreElement.className = "scan-score excellent";
    return;
  }

  if (score >= 65) {
    scanScoreElement.textContent = "Scan Quality: Good - test before printing";
    scanScoreElement.className = "scan-score good";
    return;
  }

  scanScoreElement.textContent = "Scan Quality: Risky - increase contrast or reduce logo";
  scanScoreElement.className = "scan-score risky";
}

function getContrastScore(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);

  const diff =
    Math.abs(a.r - b.r) +
    Math.abs(a.g - b.g) +
    Math.abs(a.b - b.b);

  return diff / 7.65;
}
