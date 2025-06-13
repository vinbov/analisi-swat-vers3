
/**
 * @fileOverview A simple in-memory store for temporarily holding data between page navigations.
 * This is used to pass larger datasets that might exceed localStorage quotas.
 * Data stored here is lost on page refresh or when the browser tab is closed.
 */

export interface Tool1TempData {
  comparisonResults: any[]; // Replace 'any' with your actual ComparisonResult type if available globally
  activeCompetitorNames: string[];
}

const tempDataStore = new Map<string, Tool1TempData>();

/**
 * Stores data in the temporary in-memory store.
 * @param id A unique identifier for the data.
 * @param data The data to store (Tool1TempData object).
 */
export function storeTool1TempData(id: string, data: Tool1TempData): void {
  tempDataStore.set(id, data);
}

/**
 * Retrieves data from the temporary in-memory store.
 * Optionally clears the data after retrieval.
 * @param id The unique identifier for the data.
 * @param clearAfterGet If true, deletes the data from the store after retrieval. Defaults to false.
 * @returns The stored data (Tool1TempData object) or undefined if not found.
 */
export function getTool1TempData(id: string, clearAfterGet: boolean = false): Tool1TempData | undefined {
  const data = tempDataStore.get(id);
  if (data && clearAfterGet) {
    tempDataStore.delete(id);
  }
  return data;
}

/**
 * Clears specific data from the temporary in-memory store.
 * @param id The unique identifier for the data to clear.
 */
export function clearTool1TempData(id: string): void {
  tempDataStore.delete(id);
}

/**
 * Clears all data from the temporary in-memory store.
 */
export function clearAllTool1TempData(): void {
  tempDataStore.clear();
}
