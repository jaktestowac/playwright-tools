import { Locator } from "@playwright/test";

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
export async function extractTableData(
  tableLocator: Locator,
  options?: {
    includeHeaders?: boolean;
    rowSelector?: string;
    cellSelector?: string;
  },
) {
  const includeHeaders = options?.includeHeaders !== false;
  const rowSelector = options?.rowSelector || "tr";
  const cellSelector = options?.cellSelector || "td, th";

  const rows = tableLocator.locator(rowSelector);
  const rowCount = await rows.count();

  if (rowCount === 0) {
    return [];
  }

  let headers: string[] = [];
  let startIndex = 0;

  if (includeHeaders) {
    // Get headers from first row
    const headerRow = rows.first();
    const headerCells = headerRow.locator(cellSelector);
    const headerCount = await headerCells.count();

    for (let i = 0; i < headerCount; i++) {
      const headerText = await headerCells.nth(i).textContent();
      headers.push(headerText || `Column ${i + 1}`);
    }

    startIndex = 1; // Skip header row for data extraction
  }

  const data: Record<string, string>[] = [];

  for (let rowIndex = startIndex; rowIndex < rowCount; rowIndex++) {
    const row = rows.nth(rowIndex);
    const cells = row.locator(cellSelector);
    const cellCount = await cells.count();

    const rowData: Record<string, string> = {};

    for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
      const cellText = await cells.nth(cellIndex).textContent();
      const columnName = headers[cellIndex] || `Column ${cellIndex + 1}`;
      rowData[columnName] = cellText || "";
    }

    data.push(rowData);
  }

  return data;
}
