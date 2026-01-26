import { getDocument } from "pdfjs-dist/build/pdf";

function dataUrlToUint8Array(dataUrl) {
  if (!dataUrl) {
    throw new Error("Missing PDF data");
  }
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function computeMedian(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function isHeadingCandidate(line, medianFontSize) {
  const text = line.text;
  if (!text || text.length < 3 || text.length > 140) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 16) return false;

  const lettersOnly = text.replace(/[^A-Za-z]/g, "");
  const uppercaseLetters = text.replace(/[^A-Z]/g, "");
  const uppercaseRatio = lettersOnly.length ? uppercaseLetters.length / lettersOnly.length : 0;

  const numberingMatch = text.match(/^\s*(\d+(?:\.\d+)*)(?:[)\.]|\s)+/);
  const largeFont = line.fontSize && medianFontSize && line.fontSize >= medianFontSize * 1.15;
  const isAllCaps = uppercaseRatio >= 0.65 && lettersOnly.length >= 4;
  const hasNumbering = Boolean(numberingMatch);
  const endsWithPunctuation = /[.:;]$/.test(text.trim());

  return (hasNumbering || isAllCaps || largeFont) && !endsWithPunctuation;
}

function deriveHeadingLevel(text) {
  const numberingMatch = text.match(/^(\d+(?:\.\d+)*)/);
  if (!numberingMatch) return null;
  return numberingMatch[1].split(".").length;
}

async function extractAnalysisFromPdf(dataUrl) {
  const pdfBytes = dataUrlToUint8Array(dataUrl);
  const loadingTask = getDocument({ data: pdfBytes, disableWorker: true });
  const pdfDocument = await loadingTask.promise;

  const fullTextParts = [];
  const lines = [];
  const fontSizes = [];
  let cumulativeLength = 0;

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let buffer = "";
    let bufferFontSizes = [];

    const flushBuffer = () => {
      if (!buffer) return;
      const rawLine = buffer;
      const text = rawLine.trim();
      const fontSize = bufferFontSizes.length ? Math.max(...bufferFontSizes) : 0;
      if (fontSize) {
        fontSizes.push(fontSize);
      }
      lines.push({
        text,
        raw: rawLine,
        fontSize,
        pageNumber,
        charIndex: cumulativeLength,
      });
      fullTextParts.push(rawLine + "\n");
      cumulativeLength += rawLine.length + 1;
      buffer = "";
      bufferFontSizes = [];
    };

    textContent.items.forEach((item) => {
      const str = item.str || "";
      if (!str) {
        if (item.hasEOL) {
          flushBuffer();
        }
        return;
      }

      const style = textContent.styles?.[item.fontName];
      const fontSize = style?.fontSize || Math.hypot(item.transform[0], item.transform[1]);
      if (Number.isFinite(fontSize)) {
        bufferFontSizes.push(fontSize);
      }

      buffer += str;
      if (item.hasEOL) {
        flushBuffer();
      }
    });

    flushBuffer();
  }

  const medianFontSize = computeMedian(fontSizes);
  const headings = lines
    .filter((line) => isHeadingCandidate(line, medianFontSize))
    .map((line) => ({
      title: line.text,
      raw: line.raw.trim(),
      fontSize: line.fontSize,
      pageNumber: line.pageNumber,
      charIndex: line.charIndex,
      level: deriveHeadingLevel(line.text),
    }))
    .sort((a, b) => a.charIndex - b.charIndex);

  return {
    text: fullTextParts.join(""),
    headings,
  };
}

self.onmessage = async (event) => {
  const { id, action, payload } = event.data || {};
  if (!id) return;

  const respond = (message) => {
    self.postMessage({ id, ...message });
  };

  if (action === "analyze") {
    try {
      const { dataUrl } = payload;
      const analysis = await extractAnalysisFromPdf(dataUrl);
      respond({ status: "success", result: analysis });
    } catch (error) {
      respond({ status: "error", error: error?.message || String(error) });
    }
  }
};
