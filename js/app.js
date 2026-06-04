/* ================================
   DOM ELEMENTS START
================================ */

const urlInput = document.getElementById("urlInput");
const sizeInput = document.getElementById("sizeInput");
const formatInput = document.getElementById("formatInput");
const darkColorInput = document.getElementById("darkColorInput");
const lightColorInput = document.getElementById("lightColorInput");
const roundedInput = document.getElementById("roundedInput");
const frameRoundedInput = document.getElementById("frameRoundedInput");

const logoInput = document.getElementById("logoInput");
const logoSizeInput = document.getElementById("logoSizeInput");

const dotStyleInput = document.getElementById("dotStyleInput");
const cornerStyleInput = document.getElementById("cornerStyleInput");

const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");

const qrPreview = document.getElementById("qrPreview");
const message = document.getElementById("message");

const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");

/* ================================
   DOM ELEMENTS END
================================ */


/* ================================
   APP STATE START
================================ */

let qrCode = null;
let logoDataUrl = "";
let debounceTimer = null;

/* ================================
   APP STATE END
================================ */


/* ================================
   EVENT LISTENERS START
================================ */

hamburger.addEventListener("click", () => {
  nav.classList.toggle("open");
});

nav.addEventListener("click", () => {
  nav.classList.remove("open");
});

generateBtn.addEventListener("click", generateQr);
downloadBtn.addEventListener("click", downloadQr);
copyBtn.addEventListener("click", copyQrImage);

[
  urlInput,
  sizeInput,
  formatInput,
  darkColorInput,
  lightColorInput,
  roundedInput,
  frameRoundedInput,
  logoSizeInput,
  dotStyleInput,
  cornerStyleInput
].forEach((input) => {
  input.addEventListener("input", debounceGenerate);
});

logoInput.addEventListener("change", handleLogoUpload);

/* ================================
   EVENT LISTENERS END
================================ */


/* ================================
   QR GENERATION START
================================ */

function generateQr() {
  try {
    setLoading(true);
    setMessage("Generating QR code...");

    const settings = getSettings();

    qrPreview.innerHTML = "";
    applyFrameStyle(settings);

    qrCode = new QRCodeStyling({
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
        color: settings.darkColor
      },

      cornersDotOptions: {
        type: settings.cornerDotStyle,
        color: settings.darkColor
      },

      backgroundOptions: {
        color: settings.lightColor
      },

      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: settings.logoSize,
        hideBackgroundDots: true
      }
    });

    qrCode.append(qrPreview);

    setMessage("QR code ready.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setLoading(false);
  }
}

/* ================================
   QR GENERATION END
================================ */


/* ================================
   FRAME STYLE START
================================ */

function applyFrameStyle(settings) {
  qrPreview.classList.toggle("frame-rounded", settings.roundedFrame);
  qrPreview.classList.toggle("frame-square", !settings.roundedFrame);

  qrPreview.style.setProperty("--qr-bg-color", settings.lightColor);
}

/* ================================
   FRAME STYLE END
================================ */


/* ================================
   LOGO UPLOAD START
================================ */

function handleLogoUpload() {
  const file = logoInput.files?.[0];

  if (!file) {
    logoDataUrl = "";
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
    generateQr();
  };

  reader.onerror = () => {
    logoDataUrl = "";
    setMessage("Logo could not be loaded.", "error");
  };

  reader.readAsDataURL(file);
}

/* ================================
   LOGO UPLOAD END
================================ */


/* ================================
   DOWNLOAD START
================================ */

function downloadQr() {
  try {
    if (!qrCode) {
      setMessage("Generate a QR code first.", "error");
      return;
    }

    const format = formatInput.value;

    qrCode.download({
      name: "qr-code",
      extension: format
    });

    setMessage(`${format.toUpperCase()} download started.`, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

/* ================================
   DOWNLOAD END
================================ */


/* ================================
   COPY IMAGE START
================================ */

async function copyQrImage() {
  try {
    const canvas = qrPreview.querySelector("canvas");

    if (!canvas) {
      setMessage("Generate a QR code first.", "error");
      return;
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      setMessage("Copy image is not supported in this browser.", "error");
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setMessage("Could not copy QR image.", "error");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);

      setMessage("QR image copied.", "success");
    }, "image/png");
  } catch {
    setMessage("Copy image is not supported in this browser.", "error");
  }
}

/* ================================
   COPY IMAGE END
================================ */


/* ================================
   HELPERS START
================================ */

function debounceGenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generateQr, 300);
}

function getSettings() {
  const url = getValidUrl(urlInput.value);
  const size = clamp(Number(sizeInput.value) || 420, 160, 1200);
  const roundedStyling = roundedInput.checked;

  return {
    url,
    size,
    darkColor: darkColorInput.value,
    lightColor: lightColorInput.value,
    logoSize: clamp(Number(logoSizeInput.value) / 100, 0.12, 0.25),
    dotStyle: roundedStyling ? dotStyleInput.value : "square",
    cornerStyle: roundedStyling ? cornerStyleInput.value : "square",
    cornerDotStyle: roundedStyling && cornerStyleInput.value === "dot" ? "dot" : "square",
    roundedFrame: frameRoundedInput.checked
  };
}

function getValidUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Please enter a URL.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return new URL(withProtocol).href;
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  downloadBtn.disabled = isLoading;
  copyBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "Generating..." : "Generate";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* ================================
   HELPERS END
================================ */


/* ================================
   APP INIT START
================================ */

urlInput.value = "https://example.com";
generateQr();

/* ================================
   APP INIT END
================================ */