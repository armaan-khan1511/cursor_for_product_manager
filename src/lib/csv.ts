/**
 * Client-side RFC 4180 compliant CSV parser.
 * Handles quoted fields, commas inside quotes, multi-line fields, and headers.
 */

export interface ParsedCSVResult {
  headers: string[];
  items: string[];
  filename?: string;
}

export function parseCSV(csvContent: string, filename?: string): ParsedCSVResult {
  const cleanContent = csvContent.replace(/^\uFEFF/, ""); // Remove BOM if present
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote inside quoted field
        currentField += '"';
        i++;
      } else if (char === '"') {
        // Closing quote
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) lines.push(currentRow);
  }

  if (lines.length === 0) {
    return { headers: [], items: [], filename };
  }

  // Check if first row contains headers
  const firstRow = lines[0];
  const knownHeaderKeys = [
    "feedback",
    "description",
    "comment",
    "summary",
    "text",
    "message",
    "ticket",
    "issue",
    "notes",
    "content",
    "body",
  ];

  const firstRowLower = firstRow.map((h) => h.toLowerCase());
  const hasHeaders = firstRowLower.some((h) => knownHeaderKeys.includes(h));

  let headers: string[] = [];
  let dataRows: string[][] = [];

  if (hasHeaders) {
    headers = firstRow;
    dataRows = lines.slice(1);
  } else {
    dataRows = lines;
  }

  // Find target feedback column index if headers exist
  let targetColIndex = -1;
  if (headers.length > 0) {
    targetColIndex = firstRowLower.findIndex((h) => knownHeaderKeys.includes(h));
  }

  const items: string[] = [];

  for (const row of dataRows) {
    if (targetColIndex !== -1 && row[targetColIndex]) {
      const val = row[targetColIndex].trim();
      if (val) items.push(val);
    } else {
      // If no header match or column missing, combine non-empty text columns
      const rowText = row.filter(Boolean).join(" - ").trim();
      if (rowText) items.push(rowText);
    }
  }

  return {
    headers,
    items,
    filename,
  };
}
