"use strict";

function downloadCanvas(canvas, format, settings) {
  const outputCanvas = format === "jpg"
    ? createJpegCanvas(canvas, settings)
    : canvas;
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";

  const link = document.createElement("a");
  link.href = outputCanvas.toDataURL(mimeType, 0.95);
  link.download = "qr-code." + format;
  link.click();
}

async function copyCanvas(canvas) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error("Copy image is not supported in this browser.");
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) {
          reject(new Error("Could not create image blob."));
          return;
        }

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);

        resolve();
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
}

function createJpegCanvas(canvas, settings) {
  const jpegCanvas = document.createElement("canvas");
  jpegCanvas.width = canvas.width;
  jpegCanvas.height = canvas.height;

  const ctx = jpegCanvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  ctx.fillStyle = settings && settings.lightColor ? settings.lightColor : "#ffffff";
  ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  return jpegCanvas;
}
