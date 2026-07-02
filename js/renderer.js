"use strict";

async function buildFinalCanvas(settings, logoDataUrl) {
  const rawQrCanvas = await buildRawQrCanvas(settings, logoDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = settings.size;
  canvas.height = settings.size;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  const padding = getFramePadding(settings, settings.size);
  const qrSize = settings.size - padding * 2;
  const radius = settings.roundedFrame ? settings.size * 0.075 : 0;
  const innerRadius = settings.roundedFrame && settings.frameStyle !== "none"
    ? Math.max(radius - padding * 0.35, 0)
    : radius;

  drawCanvasBase(ctx, settings, settings.size, radius);
  drawCanvasFrame(ctx, settings, settings.size, radius);

  ctx.save();

  if (settings.roundedFrame) {
    roundedRect(ctx, padding, padding, qrSize, qrSize, innerRadius);
    ctx.clip();
  }

  ctx.drawImage(rawQrCanvas, padding, padding, qrSize, qrSize);
  ctx.restore();

  return canvas;
}

function buildRawQrCanvas(settings, logoDataUrl) {
  return new Promise((resolve, reject) => {
    if (typeof QRCodeStyling === "undefined") {
      reject(new Error("QR library could not load. Check your internet connection and try again."));
      return;
    }

    const tempContainer = document.createElement("div");

    const tempQr = new QRCodeStyling({
      width: settings.size,
      height: settings.size,
      type: "canvas",
      data: settings.url,
      image: logoDataUrl || undefined,
      margin: 14,

      qrOptions: {
        errorCorrectionLevel: "H"
      },

      dotsOptions: {
        type: settings.dotStyle,
        color: settings.darkColor
      },

      cornersSquareOptions: {
        type: settings.cornerStyle,
        color: settings.cornerColor
      },

      cornersDotOptions: {
        type: settings.cornerDotStyle,
        color: settings.cornerColor
      },

      backgroundOptions: {
        color: settings.transparent ? "transparent" : settings.lightColor
      },

      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: settings.logoSize,
        hideBackgroundDots: true
      }
    });

    tempQr.append(tempContainer);
    waitForCanvas(tempContainer, resolve, reject);
  });
}

function waitForCanvas(container, resolve, reject, attempts = 0) {
  const canvas = container.querySelector("canvas");
  const canvasReady = canvas && canvas.width > 0 && canvas.height > 0;

  if (canvasReady && (attempts >= 6 || canvasHasContent(canvas))) {
    requestAnimationFrame(() => resolve(canvas));
    return;
  }

  if (attempts > 80) {
    reject(new Error("Could not render QR canvas."));
    return;
  }

  setTimeout(() => waitForCanvas(container, resolve, reject, attempts + 1), 50);
}

function canvasHasContent(canvas) {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return false;

    const width = canvas.width;
    const height = canvas.height;
    const sampleStep = Math.max(8, Math.floor(width / 28));
    const image = ctx.getImageData(0, 0, width, height).data;
    const baseR = image[0];
    const baseG = image[1];
    const baseB = image[2];
    const baseA = image[3];
    let changedPixels = 0;

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const index = (y * width + x) * 4;
        const diff =
          Math.abs(image[index] - baseR) +
          Math.abs(image[index + 1] - baseG) +
          Math.abs(image[index + 2] - baseB) +
          Math.abs(image[index + 3] - baseA);

        if (diff > 36) changedPixels += 1;
        if (changedPixels > 14) return true;
      }
    }
  } catch {
    return true;
  }

  return false;
}

function drawCanvasBase(ctx, settings, size, radius) {
  if (settings.transparent) {
    ctx.clearRect(0, 0, size, size);
    return;
  }

  ctx.fillStyle = settings.lightColor;

  if (settings.roundedFrame || settings.frameStyle !== "none") {
    roundedRect(ctx, 0, 0, size, size, radius);
    ctx.fill();
    return;
  }

  ctx.fillRect(0, 0, size, size);
}

function drawCanvasFrame(ctx, settings, size, radius) {
  if (settings.frameStyle === "none") return;

  const padding = getFramePadding(settings, size);
  const strokeWidth = getBorderThickness(settings);
  const inset = Math.max(padding / 2, strokeWidth / 2);

  ctx.save();

  if (settings.frameStyle === "rounded") {
    drawRoundedFrame(ctx, settings, size, radius, strokeWidth, inset);
  }

  if (settings.frameStyle === "glass") {
    drawGlassFrame(ctx, settings, size, radius, strokeWidth, inset);
  }

  if (settings.frameStyle === "neon") {
    drawNeonFrame(ctx, settings, size, radius, strokeWidth, inset);
  }

  if (settings.frameStyle === "sticker") {
    drawStickerFrame(ctx, settings, size, radius, strokeWidth, inset);
  }

  ctx.restore();
}

function drawRoundedFrame(ctx, settings, size, radius, strokeWidth, inset) {
  ctx.fillStyle = settings.transparent ? "rgba(255,255,255,0)" : settings.lightColor;
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.fill();
  drawOptionalBorder(ctx, settings.cornerColor, strokeWidth, inset, size, radius);
}

function drawGlassFrame(ctx, settings, size, radius, strokeWidth, inset) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(1, "rgba(226,232,240,0.58)");

  ctx.fillStyle = gradient;
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.fill();
  drawOptionalBorder(ctx, "rgba(37,99,235,0.32)", strokeWidth, inset, size, radius * 0.92);
}

function drawNeonFrame(ctx, settings, size, radius, strokeWidth, inset) {
  ctx.shadowColor = settings.cornerColor;
  ctx.shadowBlur = size * 0.065;
  ctx.fillStyle = settings.transparent ? "rgba(255,255,255,0.05)" : settings.lightColor;
  roundedRect(ctx, inset, inset, size - inset * 2, size - inset * 2, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  drawOptionalBorder(ctx, settings.cornerColor, strokeWidth, inset, size, radius);
}

function drawStickerFrame(ctx, settings, size, radius, strokeWidth, inset) {
  ctx.shadowColor = "rgba(15,23,42,0.16)";
  ctx.shadowBlur = size * 0.035;
  ctx.shadowOffsetY = size * 0.015;

  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.fill();

  ctx.shadowColor = "transparent";
  drawOptionalBorder(ctx, "rgba(15,23,42,0.18)", strokeWidth, inset, size, radius * 0.92);
}

function drawOptionalBorder(ctx, color, strokeWidth, inset, size, radius) {
  if (strokeWidth <= 0) return;

  const halfStroke = strokeWidth / 2;
  const x = inset + halfStroke;
  const y = inset + halfStroke;
  const width = size - inset * 2 - strokeWidth;
  const height = size - inset * 2 - strokeWidth;

  if (width <= 0 || height <= 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function getFramePadding(settings, size) {
  if (settings.frameStyle === "none") return 0;

  const percent = clamp(settings.customPadding, 0, 20) / 100;
  return Math.round(size * percent);
}

function getBorderThickness(settings) {
  return clamp(Number(settings.borderThickness) || 0, 0, 24);
}
