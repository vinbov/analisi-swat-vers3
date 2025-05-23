import type { CsvRowTool1, CsvRowTool2, EXPECTED_COLUMNS_TOOL1, EXPECTED_COLUMNS_TOOL2, COLUMN_ALIASES_TOOL1 } from './types';

// --- Funzioni di Utilità ---
function removeBOM(str: string): string {
  if (!str) return "";
  if (str.charCodeAt(0) === 0xFEFF) {
    // console.log("BOM rimosso dalla stringa.");
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

function parseCsvValues(line: string): string[] {
  const values: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
        currentValue += '"'; // Escaped quote
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim()); // Add last value
  return values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
}


function getColumnIndices<T extends Record<string, string>, A extends Record<string, string[]>>(
  headers: string[],
  expectedColumns: T,
  columnAliases: A,
  siteNameForError: string,
  requiredKeys: (keyof T)[]
): Record<keyof T, number> {
  const columnIndices = {} as Record<keyof T, number>;

  for (const key in expectedColumns) {
    const typedKey = key as keyof T;
    const expectedHeader = expectedColumns[typedKey].toLowerCase();
    let index = headers.findIndex(h => h === expectedHeader);

    if (index === -1 && columnAliases[typedKey as string]) {
      for (const alias of columnAliases[typedKey as string]) {
        index = headers.findIndex(h => h === alias.toLowerCase());
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

export function parseCSVTool1(csvText: string, siteNameForError: string): CsvRowTool1[] {
  let content = removeBOM(csvText.trim());
  const { headerLine, restOfText } = getFirstLogicalLineAndRest(content);
  
  const headers = headerLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map(h => h.trim().replace(/^"|"$/g, '').replace(/\r\n|\n|\r/g, ' ').trim().toLowerCase());
  
  const requiredKeysTool1: (keyof typeof EXPECTED_COLUMNS_TOOL1)[] = ['keyword', 'posizione', 'url'];
  const columnIndices = getColumnIndices(headers, EXPECTED_COLUMNS_TOOL1, COLUMN_ALIASES_TOOL1, siteNameForError, requiredKeysTool1);

  const data: CsvRowTool1[] = [];
  const dataLines = restOfText.replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim() !== '');

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCsvValues(line);
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
    
    // Optional fields
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
  
  const headers = headerLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map(h => h.trim().replace(/^"|"$/g, '').replace(/\r\n|\n|\r/g, ' ').trim().toLowerCase());

  const requiredKeysTool2: (keyof typeof EXPECTED_COLUMNS_TOOL2)[] = ['keyword'];
  const columnIndices = getColumnIndices(headers, EXPECTED_COLUMNS_TOOL2, COLUMN_ALIASES_TOOL1, "Tool 2", requiredKeysTool2);
  
  const data: CsvRowTool2[] = [];
  const dataLines = restOfText.replace(/\r\n?/g, '\n').split('\n').filter(line => line.trim() !== '');

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCsvValues(line);
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
      // Find the key in the item that corresponds to the header (case-insensitive and space-insensitive match)
      const itemKey = Object.keys(item).find(k => 
        k.toLowerCase().replace(/\s+/g, '') === header.toLowerCase().replace(/\s+/g, '') ||
        // Specific mapping for 7C fields which have underscores in object but not in header
        (header.startsWith('7C_') && k.toLowerCase().replace(/\s+/g, '') === header.substring(3).toLowerCase().replace(/\s+/g, ''))
      );
      return escapeCSVField(itemKey ? item[itemKey] : "");
    });
    csvContent += row.join(",") + "\r\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
