import type { Locator } from "@playwright/test";

export type ExtractTableDataOptions = {
  /** Legacy option: when true (default), first row is treated as headers and omitted from returned data rows. */
  includeHeaders?: boolean;
  /** Docs option: when true (default), first row is treated as headers and omitted from returned data rows (object format). */
  hasHeaders?: boolean;
  /** Output format. Default: "object" (backwards compatible with previous behavior). */
  format?: "object" | "array";
  /** When `format: "array"` and `hasHeaders: true`, include the header row as the first row. Default: false. */
  includeHeaderRow?: boolean;
  /** Custom selector for table rows. Default: "tr" */
  rowSelector?: string;
  /** Custom selector for table cells. Default: "td, th" */
  cellSelector?: string;
  /** Optional transformation applied to each extracted cell text. */
  transformCell?: (cellText: string, rowIndex: number, colIndex: number) => unknown;
  /**
   * Optional header normalization.
   * - false: keep raw header text (default, backwards compatible)
   * - true: normalize to lowerCamelCase
   * - function: custom mapping
   */
  normalizeHeaders?: boolean | ((header: string, index: number) => string);
};

function normalizeHeaderDefault(header: string): string {
  const cleaned = header
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .trim();

  if (!cleaned) return "";

  const parts = cleaned.split(" ").filter(Boolean);
  const [first, ...rest] = parts;
  return first.toLowerCase() + rest.map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : "")).join("");
}

async function getText(locator: Locator): Promise<string> {
  const t = await locator.textContent();
  return (t ?? "").trim();
}

/**
 * Extract data from a table efficiently.
 * Handles both simple and complex table structures with headers and data extraction.
 *
 * @param tableLocator - The Playwright locator for the table element
 * @param options - Optional configuration object
 * @param options.includeHeaders - Whether to include header row (default: true)
 * @param options.rowSelector - Custom selector for table rows
 * @param options.cellSelector - Custom selector for table cells
 * @returns Promise that resolves to table data as array of objects
 *
 * @example
 * ```typescript
 * const tableData = await extractTableData(page.locator('table'), {
 *   includeHeaders: true
 * });
 * // Returns: [{ Name: 'John', Age: '25', Email: 'john@example.com' }, ...]
 * ```
 */
export async function extractTableData(tableLocator: Locator, options?: ExtractTableDataOptions) {
  const hasHeaders = options?.hasHeaders ?? options?.includeHeaders ?? true;
  const format = options?.format ?? "object";
  const rowSelector = options?.rowSelector || "tr";
  const cellSelector = options?.cellSelector || "td, th";

  const rows = tableLocator.locator(rowSelector);
  const rowCount = await rows.count();

  if (rowCount === 0) {
    return [];
  }

  // Array format: return 2D array of cell texts.
  if (format === "array") {
    const startRow = hasHeaders && options?.includeHeaderRow !== true ? 1 : 0;
    const out: unknown[][] = [];

    for (let rowIndex = startRow; rowIndex < rowCount; rowIndex++) {
      const row = rows.nth(rowIndex);
      const cells = row.locator(cellSelector);
      const cellCount = await cells.count();

      const rowValues: unknown[] = [];
      for (let colIndex = 0; colIndex < cellCount; colIndex++) {
        const raw = await getText(cells.nth(colIndex));
        rowValues.push(options?.transformCell ? options.transformCell(raw, rowIndex, colIndex) : raw);
      }
      out.push(rowValues);
    }

    return out;
  }

  let headers: string[] = [];
  let startIndex = 0;

  if (hasHeaders) {
    // Get headers from first row
    const headerRow = rows.first();
    const headerCells = headerRow.locator(cellSelector);
    const headerCount = await headerCells.count();

    for (let i = 0; i < headerCount; i++) {
      const headerText = await getText(headerCells.nth(i));
      headers.push(headerText || `Column ${i + 1}`);
    }

    startIndex = 1; // Skip header row for data extraction
  } else {
    // No headers available - generate fallback column names based on the widest row.
    let maxColumns = 0;
    for (let i = 0; i < rowCount; i++) {
      const c = await rows.nth(i).locator(cellSelector).count();
      if (c > maxColumns) maxColumns = c;
    }
    headers = Array.from({ length: maxColumns }, (_, i) => `Column ${i + 1}`);
  }

  const data: Record<string, unknown>[] = [];
  const normalizeHeaders = options?.normalizeHeaders;
  const headerMapper: ((h: string, i: number) => string) | null =
    typeof normalizeHeaders === "function"
      ? normalizeHeaders
      : normalizeHeaders === true
        ? (h) => normalizeHeaderDefault(h)
        : null;

  for (let rowIndex = startIndex; rowIndex < rowCount; rowIndex++) {
    const row = rows.nth(rowIndex);
    const cells = row.locator(cellSelector);
    const cellCount = await cells.count();

    const rowData: Record<string, unknown> = {};

    for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
      const cellText = await getText(cells.nth(cellIndex));
      const rawColumnName = headers[cellIndex] || `Column ${cellIndex + 1}`;
      const columnName = headerMapper ? headerMapper(rawColumnName, cellIndex) || rawColumnName : rawColumnName;
      rowData[columnName] = options?.transformCell ? options.transformCell(cellText, rowIndex, cellIndex) : cellText;
    }

    data.push(rowData);
  }

  return data;
}

/**
 * Get a row from a table as an array of cell texts.
 *
 * By default, assumes the first row is a header row and `rowIndex=0` returns the first data row.
 * Supports negative indexes (e.g. -1 for last data row).
 */
export async function getTableRow(
  tableLocator: Locator,
  rowIndex: number,
  options?: {
    hasHeaders?: boolean;
    rowSelector?: string;
    cellSelector?: string;
  },
): Promise<string[]> {
  const hasHeaders = options?.hasHeaders ?? true;
  const rowSelector = options?.rowSelector || "tr";
  const cellSelector = options?.cellSelector || "td, th";

  const rows = tableLocator.locator(rowSelector);
  const totalRows = await rows.count();
  const start = hasHeaders ? 1 : 0;
  const dataRows = Math.max(0, totalRows - start);

  if (dataRows === 0) return [];

  const resolvedDataIndex = rowIndex >= 0 ? rowIndex : dataRows + rowIndex;
  if (resolvedDataIndex < 0 || resolvedDataIndex >= dataRows) {
    throw new RangeError(
      `Row index ${rowIndex} is out of range for table with ${dataRows} data row(s) (hasHeaders=${hasHeaders}).`,
    );
  }

  const targetRow = rows.nth(start + resolvedDataIndex);
  const cells = targetRow.locator(cellSelector);
  const cellCount = await cells.count();

  const out: string[] = [];
  for (let i = 0; i < cellCount; i++) {
    out.push(await getText(cells.nth(i)));
  }
  return out;
}

/**
 * Find the first table cell whose text matches the provided value.
 * Returns the cell locator or throws if not found (default).
 */
export async function findTableCell(
  tableLocator: Locator,
  text: string,
  options?: {
    cellSelector?: string;
    caseSensitive?: boolean;
    exact?: boolean;
    throwIfNotFound?: boolean;
  },
): Promise<Locator> {
  const cellSelector = options?.cellSelector || "td, th";
  const caseSensitive = options?.caseSensitive ?? false;
  const exact = options?.exact ?? true;
  const throwIfNotFound = options?.throwIfNotFound ?? true;

  const cells = tableLocator.locator(cellSelector);
  const count = await cells.count();

  const needle = caseSensitive ? text : text.toLowerCase();

  for (let i = 0; i < count; i++) {
    const cellText = await getText(cells.nth(i));
    const hay = caseSensitive ? cellText : cellText.toLowerCase();

    const match = exact ? hay === needle : hay.includes(needle);
    if (match) return cells.nth(i);
  }

  if (throwIfNotFound) {
    throw new Error(`Cell with text ${JSON.stringify(text)} was not found in the table.`);
  }

  // For callers that explicitly want no-throw behavior.
  return cells.nth(-1);
}
