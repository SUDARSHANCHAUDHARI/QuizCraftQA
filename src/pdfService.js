import PdfWorker from "./workers/pdfWorker?worker";

const analysisCache = new Map();
let workerInstance = null;
let requestCounter = 0;
const pendingRequests = new Map();

function ensureWorker() {
  if (!workerInstance) {
    workerInstance = new PdfWorker();
    workerInstance.onmessage = (event) => {
      const { id, status, result, error } = event.data || {};
      if (!id) return;
      const pending = pendingRequests.get(id);
      if (!pending) return;
      pendingRequests.delete(id);
      if (status === "success") {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error || "PDF worker error"));
      }
    };
    workerInstance.onerror = (event) => {
      console.error("PDF worker error", event.message || event);
    };
  }
  return workerInstance;
}

function requestAnalysis(dataUrl) {
  const worker = ensureWorker();
  const id = ++requestCounter;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ id, action: "analyze", payload: { dataUrl } });
  });
}

export async function getPdfAnalysis(pdf) {
  if (!pdf?.id) {
    throw new Error("Invalid PDF metadata");
  }
  if (analysisCache.has(pdf.id)) {
    return analysisCache.get(pdf.id);
  }
  const analysis = await requestAnalysis(pdf.dataUrl);
  analysisCache.set(pdf.id, analysis);
  return analysis;
}

export async function getPdfText(pdf) {
  const analysis = await getPdfAnalysis(pdf);
  return analysis.text;
}

export function evictPdfText(pdfId) {
  if (pdfId && analysisCache.has(pdfId)) {
    analysisCache.delete(pdfId);
  }
}

export function clearPdfTextCache() {
  analysisCache.clear();
}
