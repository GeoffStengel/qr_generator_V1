"use strict";

const urlInput = document.getElementById("urlInput");
const sizeInput = document.getElementById("sizeInput");
const formatInput = document.getElementById("formatInput");

const darkColorInput = document.getElementById("darkColorInput");
const lightColorInput = document.getElementById("lightColorInput");
const cornerColorInput = document.getElementById("cornerColorInput");

const roundedInput = document.getElementById("roundedInput");
const frameRoundedInput = document.getElementById("frameRoundedInput");
const frameStyleInput = document.getElementById("frameStyleInput");
const transparentInput = document.getElementById("transparentInput");

const presetInput = document.getElementById("presetInput");
const logoInput = document.getElementById("logoInput");
const logoSizeInput = document.getElementById("logoSizeInput");

const dotStyleInput = document.getElementById("dotStyleInput");
const cornerStyleInput = document.getElementById("cornerStyleInput");

const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

const qrPreview = document.getElementById("qrPreview");
const message = document.getElementById("message");
const scanScore = document.getElementById("scanScore");
const previewSize = document.getElementById("previewSize");
const miniPreview = document.getElementById("miniPreview");

const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");

const paddingInput = document.getElementById("paddingInput");
const borderThicknessInput = document.getElementById("borderThicknessInput");

const logoSizeValue = document.getElementById("logoSizeValue");
const paddingValue = document.getElementById("paddingValue");
const borderThicknessValue = document.getElementById("borderThicknessValue");

let logoDataUrl = "";
let debounceTimer = null;
let currentFinalCanvas = null;

hamburger.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }
});

if (miniPreview) {
  miniPreview.addEventListener("click", () => {
    qrPreview.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
downloadBtn.addEventListener("click", handleDownload);
copyBtn.addEventListener("click", handleCopy);
resetBtn.addEventListener("click", resetCurrentPreset);
presetInput.addEventListener("change", applyPreset);
logoInput.addEventListener("change", handleLogoUpload);

[
  urlInput,
  sizeInput,
  formatInput,
  darkColorInput,
  lightColorInput,
  cornerColorInput,
  roundedInput,
  frameRoundedInput,
  frameStyleInput,
  transparentInput,
  logoSizeInput,
  dotStyleInput,
  cornerStyleInput,
  paddingInput,
  borderThicknessInput
].forEach((input) => {
  input.addEventListener("input", handleControlInput);
});

async function generateQr() {
  try {
    setLoading(true);
    setMessage("Generating QR code...");

    const settings = getSettings();
    currentFinalCanvas = await buildFinalCanvas(settings, logoDataUrl);

    qrPreview.replaceChildren(currentFinalCanvas);
    updateMiniPreview(currentFinalCanvas);
    updateScanScore(settings, scanScore);
    syncUiState();
    setMessage("QR code ready.", "success");
  } catch (error) {
    currentFinalCanvas = null;
    setMessage(error.message || "Could not generate the QR code.", "error");
  } finally {
    setLoading(false);
  }
}

async function handleDownload() {
  try {
    const settings = getSettings();
    setLoading(true);

    const canvas = await buildFinalCanvas(settings, logoDataUrl);
    currentFinalCanvas = canvas;
    qrPreview.replaceChildren(canvas);
    updateMiniPreview(canvas);
    updateScanScore(settings, scanScore);
    syncUiState();

    downloadCanvas(canvas, formatInput.value, settings);
    setMessage(formatInput.value.toUpperCase() + " downloaded exactly like preview.", "success");
  } catch (error) {
    setMessage(error.message || "Could not download the QR code.", "error");
  } finally {
    setLoading(false);
  }
}

async function handleCopy() {
  try {
    const settings = getSettings();
    setLoading(true);

    const canvas = await buildFinalCanvas(settings, logoDataUrl);
    currentFinalCanvas = canvas;
    qrPreview.replaceChildren(canvas);
    updateMiniPreview(canvas);
    updateScanScore(settings, scanScore);
    syncUiState();

    await copyCanvas(canvas);
    setMessage("QR design copied.", "success");
  } catch (error) {
    setMessage(error.message || "Could not copy the QR code.", "error");
  } finally {
    setLoading(false);
  }
}

function handleControlInput() {
  currentFinalCanvas = null;
  syncUiState();
  debounceGenerate();
}

function applyPreset() {
  const preset = QR_PRESETS[presetInput.value] || QR_PRESETS.modern;

  darkColorInput.value = preset.dark;
  lightColorInput.value = preset.light;
  cornerColorInput.value = preset.corner;
  dotStyleInput.value = preset.dots;
  cornerStyleInput.value = preset.corners;
  frameStyleInput.value = preset.frame;

  frameRoundedInput.checked = preset.frame !== "none";
  roundedInput.checked = true;

  currentFinalCanvas = null;
  syncUiState();
  generateQr();
}

function handleLogoUpload() {
  const file = logoInput.files && logoInput.files[0];

  if (!file) {
    logoDataUrl = "";
    currentFinalCanvas = null;
    generateQr();
    return;
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml"];

  if (!allowedTypes.includes(file.type)) {
    setMessage("Please upload a PNG, JPG, or SVG logo.", "error");
    logoInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    logoDataUrl = reader.result;
    currentFinalCanvas = null;
    generateQr();
  };

  reader.onerror = () => {
    logoDataUrl = "";
    currentFinalCanvas = null;
    setMessage("Logo could not be loaded.", "error");
  };

  reader.readAsDataURL(file);
}

function resetCurrentPreset() {
  logoInput.value = "";
  logoDataUrl = "";
  logoSizeInput.value = "20";
  paddingInput.value = "7";
  borderThicknessInput.value = "2";
  transparentInput.checked = false;
  formatInput.value = "png";
  sizeInput.value = "420";

  applyPreset();
  setMessage("Reset to preset.", "success");
}

function getSettings() {
  const url = getValidUrl(urlInput.value);
  const size = clamp(Number(sizeInput.value) || 420, 160, 4096);
  const roundedStyling = roundedInput.checked;

  return {
    url,
    size,
    darkColor: darkColorInput.value,
    lightColor: lightColorInput.value,
    cornerColor: cornerColorInput.value,
    transparent: transparentInput.checked,
    logoSize: clamp(Number(logoSizeInput.value) / 100, 0.12, 0.25),
    dotStyle: roundedStyling ? dotStyleInput.value : "square",
    cornerStyle: roundedStyling ? cornerStyleInput.value : "square",
    cornerDotStyle: roundedStyling && cornerStyleInput.value === "dot" ? "dot" : "square",
    roundedFrame: frameRoundedInput.checked,
    frameStyle: frameStyleInput.value,
    customPadding: Number(paddingInput.value) || 0,
    borderThickness: Number(borderThicknessInput.value) || 0
  };
}

function debounceGenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generateQr, 280);
}

function syncUiState() {
  logoSizeValue.textContent = logoSizeInput.value + "%";
  paddingValue.textContent = paddingInput.value + "%";
  borderThicknessValue.textContent = borderThicknessInput.value + "px";

  const clampedSize = clamp(Number(sizeInput.value) || 420, 160, 4096);
  previewSize.textContent = clampedSize + " px";

  const frameEnabled = frameStyleInput.value !== "none";
  paddingInput.disabled = !frameEnabled;
  borderThicknessInput.disabled = !frameEnabled;
  frameRoundedInput.disabled = !frameEnabled;
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = type ? "message " + type : "message";
}

function setLoading(isLoading) {
  downloadBtn.disabled = isLoading;
  copyBtn.disabled = isLoading;
}

function updateMiniPreview(canvas) {
  if (!canvas || !miniPreview) return;

  const thumbnail = document.createElement("canvas");
  thumbnail.width = 96;
  thumbnail.height = 96;

  const ctx = thumbnail.getContext("2d");

  if (!ctx) return;

  ctx.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
  miniPreview.replaceChildren(thumbnail);
}

document.title = "QR Generator";
urlInput.value = "https://example.com";
sizeInput.value = "420";
syncUiState();
applyPreset();
