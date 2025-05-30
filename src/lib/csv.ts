
import type { CsvRowTool1, CsvRowTool2, EXPECTED_COLUMNS_TOOL1, EXPECTED_COLUMNS_TOOL2, COLUMN_ALIASES_TOOL1 } from './types';

// --- Funzioni di Utilità ---
function removeBOM(str: string): string {
  if (!str) return "";
  // Character code 0xFEFF is the BOM character
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.substring(1);
  }
  return str;
}

function getFirstLogicalLineAndRest(text: string): { headerLine: string; restOfText: string } {
  if (!text) return { headerLine: "", restOfText: "" };
  let inQuotes = false;
  let firstLineEndIndex = -1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      firstLineEndIndex = i;
      break;
    }
  }
  let headerLine, restOfText;
  if (firstLineEndIndex === -1) {
    headerLine = text;
    restOfText = "";
  } else {
    headerLine = text.substring(0, firstLineEndIndex);
    restOfText = text.substring(firstLineEndIndex).replace(/^(\r\n|\r|\n)+/, '');
  }
  return { headerLine, restOfText };
}

function parseCsvValues(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  const delimiterChar = delimiter.charAt(0);

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // If an escaped quote (two double quotes)
      if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiterChar && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue); // Add the last value

  // Post-process each value: unquote and trim
  return values.map(v => {
    let val = v;
    // Remove surrounding quotes if they exist
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    // Replace escaped double quotes with a single double quote
    val = val.replace(/""/g, '"');
    return val.trim();
  });
}


function getColumnIndices<T extends Record<string, string>, A extends Record<string, string[]>>(
  headers: string[],
  expectedColumns: T,
  columnAliases: A,
  siteNameForError: string,
  requiredKeys: (keyof T)[]
): Record<keyof T, number> {
  const columnIndices = {} as Record<keyof T, number>;
  const lowercasedHeaders = headers.map(h => h.toLowerCase());

  for (const key in expectedColumns) {
    const typedKey = key as keyof T;
    const expectedHeader = expectedColumns[typedKey].toLowerCase();
    let index = lowercasedHeaders.findIndex(h => h === expectedHeader);

    if (index === -1 && columnAliases[typedKey as string]) {
      for (const alias of columnAliases[typedKey as string]) {
        index = lowercasedHeaders.findIndex(h => h === alias.toLowerCase());
        if (index !== -1) break;
      }
    }
    
    if (index === -1 && requiredKeys.includes(typedKey)) {
      console.error(`Colonna obbligatoria "${expectedColumns[typedKey]}" (o alias) non trovata per ${siteNameForError}. Headers trovati:`, headers, `Expected: "${expectedHeader}"`);
      throw new Error(`Colonna obbligatoria "${expectedColumns[typedKey]}" (o suoi alias) non trovata nelle intestazioni CSV per ${siteNameForError}. Intestazioni rilevate: ${headers.join(' | ')}`);
    }
    columnIndices[typedKey] = index;
  }
  return columnIndices;
}

function detectDelimiter(headerLine: string): string {
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    // Prefer semicolon if it's more frequent, otherwise default to comma.
    // This is a simple heuristic; more complex CSVs might need a more robust detection.
    if (semicolonCount > commaCount && semicolonCount > 0) {
        return ';';
    }
    return ',';
}


export function parseCSVTool1(csvText: string, siteNameForError: string): CsvRowTool1[] {
  let content = removeBOM(csvText.trim());
  const { headerLine, restOfText } = getFirstLogicalLineAndRest(content);
  
  if (!headerLine) {
    throw new Error(`File CSV per ${siteNameForError} sembra vuoto o non contiene una riga di intestazione valida.`);
  }
  
  const detectedDelimiter = detectDelimiter(headerLine);
  // console.log(`Tool1: Delimitatore rilevato per ${siteNameForError}: '${detectedDelimiter}'`);

  const headers = parseCsvValues(headerLine, detectedDelimiter)
    .map(h => h.replace(/\r\n|\n|\r/g, ' ').trim()); // Keep original case for getColumnIndices which handles lowercasing

  const requiredKeysTool1: (keyof typeof EXPECTED_COLUMNS_TOOL1)[] = ['keyword', 'posizione', 'url'];
  const columnIndices = getColumnIndices(headers, EXPECTED_COLUMNS_TOOL1, COLUMN_ALIASES_TOOL1, siteNameForError, requiredKeysTool1);

  const data: CsvRowTool1[] = [];
  const dataLines = restOfText.replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim() !== '');

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCsvValues(line, detectedDelimiter);
    const entry: Partial<CsvRowTool1> = {};

    entry.keyword = (columnIndices.keyword !== -1 && values[columnIndices.keyword]) ? values[columnIndices.keyword].toLowerCase() : undefined;
    if (!entry.keyword) continue;

    const posVal = columnIndices.posizione !== -1 ? values[columnIndices.posizione] : null;
    entry.posizione = posVal && !isNaN(parseInt(posVal)) ? parseInt(posVal) : null;
    
    entry.url = columnIndices.url !== -1 ? values[columnIndices.url] : 'N/A';
    
    const volVal = columnIndices.volume !== -1 ? values[columnIndices.volume] : null;
    entry.volume = volVal && !isNaN(parseInt(volVal)) ? parseInt(volVal) : null;

    const diffVal = columnIndices.difficolta !== -1 ? values[columnIndices.difficolta] : null;
    entry.difficolta = diffVal && !isNaN(parseInt(diffVal)) ? parseInt(diffVal) : null;

    const oppVal = columnIndices.opportunity !== -1 ? values[columnIndices.opportunity] : null;
    entry.opportunity = oppVal && !isNaN(parseInt(oppVal)) ? parseInt(oppVal) : null;
    
    entry.intento = columnIndices.intento !== -1 ? values[columnIndices.intento] : 'N/A';
    
    entry.varTraffico = columnIndices.varTraffico !== -1 ? values[columnIndices.varTraffico] : 'N/A';
    entry.trafficoStimato = columnIndices.trafficoStimato !== -1 ? values[columnIndices.trafficoStimato] : 'N/A';
    entry.cpcMedio = columnIndices.cpcMedio !== -1 ? values[columnIndices.cpcMedio] : 'N/A';

    data.push(entry as CsvRowTool1);
  }
  return data;
}


export function parseCSVTool2(csvText: string): CsvRowTool2[] {
  let content = removeBOM(csvText.trim());
  const { headerLine, restOfText } = getFirstLogicalLineAndRest(content);

  if (!headerLine) {
    throw new Error(`File CSV per Tool 2 sembra vuoto o non contiene una riga di intestazione valida.`);
  }

  const detectedDelimiter = detectDelimiter(headerLine);
  // console.log(`Tool2: Delimitatore rilevato: '${detectedDelimiter}'`);

  const headers = parseCsvValues(headerLine, detectedDelimiter)
    .map(h => h.replace(/\r\n|\n|\r/g, ' ').trim());

  const requiredKeysTool2: (keyof typeof EXPECTED_COLUMNS_TOOL2)[] = ['keyword'];
  const columnIndices = getColumnIndices(headers, EXPECTED_COLUMNS_TOOL2, COLUMN_ALIASES_TOOL1, "Tool 2", requiredKeysTool2); // Using COLUMN_ALIASES_TOOL1 as they are shared
  
  const data: CsvRowTool2[] = [];
  const dataLines = restOfText.replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim() !== '');

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCsvValues(line, detectedDelimiter);
    const entry: Partial<CsvRowTool2> = {};

    entry.keyword = (columnIndices.keyword !== -1 && values[columnIndices.keyword]) ? values[columnIndices.keyword].toLowerCase() : undefined;
    if (!entry.keyword) continue;
    
    const volVal = columnIndices.volume !== -1 ? values[columnIndices.volume] : "N/A";
    entry.volume = volVal && !isNaN(parseInt(volVal as string)) ? parseInt(volVal as string) : "N/A";

    const diffVal = columnIndices.difficolta !== -1 ? values[columnIndices.difficolta] : "N/A";
    entry.difficolta = diffVal && !isNaN(parseInt(diffVal as string)) ? parseInt(diffVal as string) : "N/A";
    
    const oppVal = columnIndices.opportunity !== -1 ? values[columnIndices.opportunity] : "N/A";
    entry.opportunity = oppVal && !isNaN(parseInt(oppVal as string)) ? parseInt(oppVal as string) : "N/A";

    const posVal = columnIndices.posizione !== -1 ? values[columnIndices.posizione] : "N/A";
    entry.posizione = posVal && !isNaN(parseInt(posVal as string)) ? parseInt(posVal as string) : "N/A";

    entry.url = columnIndices.url !== -1 ? values[columnIndices.url] : 'N/A';
    entry.intento = columnIndices.intento !== -1 ? values[columnIndices.intento] : 'N/A';
    
    data.push(entry as CsvRowTool2);
  }
  return data;
}

export function escapeCSVField(field: any): string {
  if (field === null || typeof field === 'undefined') {
    return "";
  }
  let stringField = String(field);
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    stringField = stringField.replace(/"/g, '""'); // Escape double quotes
    return `"${stringField}"`; // Enclose in double quotes
  }
  return stringField;
}

export function exportToCSV(filename: string, headers: string[], data: Record<string, any>[]) {
  let csvContent = headers.map(h => escapeCSVField(h)).join(",") + "\r\n";

  data.forEach(item => {
    const row = headers.map(header => {
      const itemKey = Object.keys(item).find(k => 
        k.toLowerCase().replace(/\s+/g, '') === header.toLowerCase().replace(/\s+/g, '') ||
        (header.startsWith('7C_') && k.toLowerCase().replace(/\s+/g, '') === header.substring(3).toLowerCase().replace(/\s+/g, ''))
      );
      return escapeCSVField(itemKey ? item[itemKey] : "");
    });
    csvContent += row.join(",") + "\r\n";
  });

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Added BOM for Excel compatibility
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

