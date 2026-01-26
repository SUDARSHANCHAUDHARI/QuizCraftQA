import { get, set } from "idb-keyval";

const STORAGE_PDFS_KEY = "quizcraftqa-uploaded-pdfs";
const STORAGE_HISTORY_KEY = "quizcraftqa-question-history";
const STORAGE_SETTINGS_KEY = "quizcraftqa-settings";

export async function loadStoredPDFs() {
  try {
    const stored = await get(STORAGE_PDFS_KEY);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Failed to load stored PDFs", error);
    return [];
  }
}

export async function storePDFs(pdfs) {
  try {
    const serialisable = pdfs.map((pdf) => ({
      ...pdf,
      uploadedAt:
        pdf.uploadedAt instanceof Date ? pdf.uploadedAt.toISOString() : pdf.uploadedAt,
    }));
    await set(STORAGE_PDFS_KEY, serialisable);
  } catch (error) {
    console.warn("Failed to persist PDFs", error);
  }
}

export async function loadQuestionHistory() {
  try {
    const stored = await get(STORAGE_HISTORY_KEY);
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored.map((entry) => ({
      ...entry,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    }));
  } catch (error) {
    console.warn("Failed to load question history", error);
    return [];
  }
}

export async function storeQuestionHistory(history) {
  try {
    const serialisable = history.map((entry) => ({
      ...entry,
      timestamp:
        entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp,
    }));
    await set(STORAGE_HISTORY_KEY, serialisable);
  } catch (error) {
    console.warn("Failed to persist question history", error);
  }
}

export async function loadSettings() {
  try {
    const stored = await get(STORAGE_SETTINGS_KEY);
    return stored && typeof stored === "object" ? stored : { dailyGoal: 5 };
  } catch (error) {
    console.warn("Failed to load settings", error);
    return { dailyGoal: 5 };
  }
}

export async function storeSettings(settings) {
  try {
    await set(STORAGE_SETTINGS_KEY, settings);
  } catch (error) {
    console.warn("Failed to persist settings", error);
  }
}
