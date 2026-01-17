import { describe, expect, test, vi } from "vitest";
import type { Locator } from "@playwright/test";
import { extractTableData, findTableCell, getTableRow } from "../src/tables";

type Cell = { text: string };

function createMockTable(rowsData: string[][]) {
  // Create stable per-cell locators so `nth(i)` returns the same instance.
  const rowLocators = rowsData.map((row, rowIndex) => {
    const cellLocators = row.map((text, colIndex) => {
      const cell: any = {
        __kind: "cell",
        __rowIndex: rowIndex,
        __colIndex: colIndex,
        textContent: vi.fn().mockResolvedValue(text),
      };
      return cell;
    });

    const cellsCollection: any = {
      __kind: "cells",
      count: vi.fn().mockResolvedValue(cellLocators.length),
      nth: vi.fn().mockImplementation((i: number) => cellLocators[i]),
    };

    const rowLocator: any = {
      __kind: "row",
      locator: vi.fn().mockImplementation((sel: string) => {
        if (sel === "td, th") return cellsCollection;
        throw new Error(`Unexpected row locator selector: ${sel}`);
      }),
    };

    return rowLocator;
  });

  const rowsCollection: any = {
    __kind: "rows",
    count: vi.fn().mockResolvedValue(rowLocators.length),
    nth: vi.fn().mockImplementation((i: number) => rowLocators[i]),
    first: vi.fn().mockImplementation(() => rowLocators[0]),
  };

  const table: any = {
    __kind: "table",
    locator: vi.fn().mockImplementation((sel: string) => {
      if (sel === "tr") return rowsCollection;
      if (sel === "td, th") {
        // Flatten all row cells for findTableCell.
        const flatCells = rowsData.flatMap((r, rIdx) =>
          r.map((text, cIdx) => ({
            __kind: "cell",
            __rowIndex: rIdx,
            __colIndex: cIdx,
            textContent: vi.fn().mockResolvedValue(text),
          })),
        );

        return {
          count: vi.fn().mockResolvedValue(flatCells.length),
          nth: vi.fn().mockImplementation((i: number) => flatCells[i]),
        };
      }
      throw new Error(`Unexpected table locator selector: ${sel}`);
    }),
  };

  return table as unknown as Locator;
}

describe("tables module", () => {
  test("extractTableData returns objects using header row by default", async () => {
    const table = createMockTable([
      ["Name", "Email"],
      ["John Doe", "john@example.com"],
      ["Jane Smith", "jane@example.com"],
    ]);

    const data = await extractTableData(table);

    expect(data).toEqual([
      { Name: "John Doe", Email: "john@example.com" },
      { Name: "Jane Smith", Email: "jane@example.com" },
    ]);
  });

  test("extractTableData supports docs-style options: hasHeaders=false and format=array", async () => {
    const table = createMockTable([
      ["Name", "Email"],
      ["John Doe", "john@example.com"],
    ]);

    const data = await extractTableData(table, { hasHeaders: false, format: "array" });

    expect(data).toEqual([
      ["Name", "Email"],
      ["John Doe", "john@example.com"],
    ]);
  });

  test("getTableRow returns first data row (rowIndex=0) and supports -1", async () => {
    const table = createMockTable([
      ["Name", "Role"],
      ["John", "Admin"],
      ["Jane", "User"],
      ["Bob", "User"],
    ]);

    await expect(getTableRow(table, 0)).resolves.toEqual(["John", "Admin"]);
    await expect(getTableRow(table, -1)).resolves.toEqual(["Bob", "User"]);
  });

  test("getTableRow with hasHeaders=false treats row 0 as the first row", async () => {
    const table = createMockTable([
      ["H1", "H2"],
      ["A", "B"],
    ]);

    await expect(getTableRow(table, 0, { hasHeaders: false })).resolves.toEqual(["H1", "H2"]);
  });

  test("findTableCell finds a cell by exact text", async () => {
    const table = createMockTable([
      ["Name", "Email"],
      ["John", "john@example.com"],
      ["Jane", "jane@example.com"],
    ]);

    const cell = await findTableCell(table, "jane@example.com");
    await expect(cell.textContent()).resolves.toBe("jane@example.com");
  });

  test("findTableCell throws when not found", async () => {
    const table = createMockTable([["A"], ["B"]]);

    await expect(findTableCell(table, "missing")).rejects.toThrow("was not found");
  });
});
