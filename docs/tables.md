# Tables

The `tables` module provides utilities for extracting data from HTML tables and validating table content in Playwright tests.

## Overview

Tables are common in web applications for displaying structured data. This module provides utilities to extract table data, validate table content, and interact with table elements efficiently in your Playwright tests.

## Key Features

- **Table Data Extraction** - Extract complete table data as arrays/objects
- **Row and Column Operations** - Access specific rows and columns
- **Table Validation** - Assert table content and structure
- **Table Interactions** - Click cells, sort columns, filter data
- **Dynamic Table Handling** - Work with tables that load data asynchronously

## Basic Usage

Let's work with this example table:

```html
<table id="users-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
      <td>Admin</td>
    </tr>
    <tr>
      <td>Jane Smith</td>
      <td>jane@example.com</td>
      <td>User</td>
    </tr>
    <tr>
      <td>Bob Wilson</td>
      <td>bob@example.com</td>
      <td>User</td>
    </tr>
  </tbody>
</table>
```

Visual representation:
```
┌─────────────┬──────────────────┬───────┐
│ Name        │ Email            │ Role  │
├─────────────┼──────────────────┼───────┤
│ John Doe    │ john@example.com │ Admin │
│ Jane Smith  │ jane@example.com │ User  │
│ Bob Wilson  │ bob@example.com  │ User  │
└─────────────┴──────────────────┴───────┘
```

```typescript
import { extractTableData, getTableRow, findTableCell } from "playwright-tools/tables";

// Extract complete table data
const tableData = await extractTableData(page.locator('#users-table'));
console.log(tableData);
// Output: [
//   { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
//   { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
//   { name: 'Bob Wilson', email: 'bob@example.com', role: 'User' }
// ]

// Get first data row
const firstRow = await getTableRow(page.locator('#users-table'), 0);
console.log(firstRow); // ['John Doe', 'john@example.com', 'Admin']

// Find cell containing specific text
const emailCell = await findTableCell(page.locator('#users-table'), 'jane@example.com');
```

## Table Data Extraction

Working with our users table from above:

```typescript
// Extract as objects with headers (default)
const users = await extractTableData(page.locator('#users-table'));
// Result: [
//   { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
//   { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
//   { name: 'Bob Wilson', email: 'bob@example.com', role: 'User' }
// ]

// Extract as 2D array
const rawData = await extractTableData(page.locator('#users-table'), {
  hasHeaders: false,
  format: 'array'
});
// Result: [
//   ['Name', 'Email', 'Role'],
//   ['John Doe', 'john@example.com', 'Admin'],
//   ['Jane Smith', 'jane@example.com', 'User'],
//   ['Bob Wilson', 'bob@example.com', 'User']
// ]
```

## Row and Column Operations

```typescript
// Get specific rows from our users table
const firstRow = await getTableRow(page.locator('#users-table'), 0);
// Result: ['John Doe', 'john@example.com', 'Admin']

const lastRow = await getTableRow(page.locator('#users-table'), -1);
// Result: ['Bob Wilson', 'bob@example.com', 'User']

// Get specific columns
const nameColumn = await getTableColumn(page.locator('#users-table'), 0);
// Result: ['John Doe', 'Jane Smith', 'Bob Wilson']

const emailColumn = await getTableColumn(page.locator('#users-table'), 'Email');
// Result: ['john@example.com', 'jane@example.com', 'bob@example.com']
```

Column extraction visualization:
```
Name Column (index 0):     Email Column:
┌─────────────┐           ┌──────────────────┐
│ John Doe    │           │ john@example.com │
│ Jane Smith  │           │ jane@example.com │
│ Bob Wilson  │           │ bob@example.com  │
└─────────────┘           └──────────────────┘
```

## Table Cell Operations

```typescript
// Find cell by content
const userCell = await findTableCell(page.locator('#users-table'), 'Jane Smith');
// Returns the cell element containing 'Jane Smith'

// Get cell by row and column coordinates
const cell = await getTableCell(page.locator('#users-table'), { row: 1, column: 2 });
// Returns: 'User' (Jane's role)

// Get cell coordinates for specific content
const coordinates = await getTableCellCoordinates(page.locator('#users-table'), 'Admin');
console.log(coordinates); // { row: 0, column: 2 }
```

Cell coordinate visualization:
```
        Col 0       Col 1            Col 2
     ┌─────────────┬──────────────────┬───────┐
Row 0│ John Doe    │ john@example.com │ Admin │ ← Admin at (0,2)
Row 1│ Jane Smith  │ jane@example.com │ User  │
Row 2│ Bob Wilson  │ bob@example.com  │ User  │
     └─────────────┴──────────────────┴───────┘
```

## Table Validation

```typescript
// Validate our users table structure and content
await validateTableContent(page.locator('#users-table'), {
  expectedRows: 3,
  expectedColumns: 3,
  requiredHeaders: ['Name', 'Email', 'Role'],
  cellValidations: [
    { row: 0, column: 'Name', value: 'John Doe' },
    { row: 1, column: 'Role', value: 'User' }
  ]
});

// Validate expected data matches
const expectedUsers = [
  { name: 'John Doe', role: 'Admin' },
  { name: 'Jane Smith', role: 'User' },
  { name: 'Bob Wilson', role: 'User' }
];
await assertTableDataMatches(page.locator('#users-table'), expectedUsers);
```

## Table Interactions

```typescript
// Click on specific cells in our users table
await clickTableCell(page.locator('#users-table'), { row: 1, column: 0 });
// Clicks on 'Jane Smith'

await clickTableCellByContent(page.locator('#users-table'), 'bob@example.com');
// Clicks on Bob's email cell

// Sort table by column (assuming sortable table)
await sortTableByColumn(page.locator('#users-table'), 'Name', 'desc');
// Table would be sorted: Bob Wilson, Jane Smith, John Doe

// Filter to show only Admin users
await filterTable(page.locator('#users-table'), 'Role', 'Admin');
```

After sorting by Name (desc):
```
┌─────────────┬──────────────────┬───────┐
│ Name        │ Email            │ Role  │
├─────────────┼──────────────────┼───────┤
│ Bob Wilson  │ bob@example.com  │ User  │
│ Jane Smith  │ jane@example.com │ User  │
│ John Doe    │ john@example.com │ Admin │
└─────────────┴──────────────────┴───────┘
```

## Dynamic Table Handling

For tables that load data asynchronously:

```html
<table id="dynamic-table">
  <thead>
    <tr><th>Product</th><th>Price</th><th>Stock</th></tr>
  </thead>
  <tbody>
    <!-- Data loads via JavaScript -->
  </tbody>
</table>
```

```typescript
// Wait for table to populate with data
await waitForTableToLoad(page.locator('#dynamic-table'), {
  expectedRows: 5,
  timeout: 10000
});

// Handle paginated data extraction
const allProducts = await extractPaginatedTableData(page.locator('#product-table'), {
  nextButtonSelector: '.next-page',
  maxPages: 5
});
```

Paginated table visualization:
```
Page 1:                    Page 2:                    Combined Result:
┌─────────┬───────┬───────┐ ┌─────────┬───────┬───────┐ ┌─────────┬───────┬───────┐
│ Product │ Price │ Stock │ │ Product │ Price │ Stock │ │ Product │ Price │ Stock │
├─────────┼───────┼───────┤ ├─────────┼───────┼───────┤ ├─────────┼───────┼───────┤
│ Item A  │ $10   │ 50    │ │ Item D  │ $40   │ 20    │ │ Item A  │ $10   │ 50    │
│ Item B  │ $20   │ 30    │ │ Item E  │ $50   │ 10    │ │ Item B  │ $20   │ 30    │
│ Item C  │ $30   │ 40    │ │ Item F  │ $60   │ 5     │ │ Item C  │ $30   │ 40    │
└─────────┴───────┴───────┘ └─────────┴───────┴───────┘ │ Item D  │ $40   │ 20    │
                                                        │ Item E  │ $50   │ 10    │
                                                        │ Item F  │ $60   │ 5     │
                                                        └─────────┴───────┴───────┘
```

## Advanced Table Operations

```typescript
// Extract table with data transformation
const salesTable = await extractTableData(page.locator('#sales-table'), {
  hasHeaders: true,
  transformCell: (cellText, rowIndex, colIndex) => {
    // Convert price column to numbers
    if (colIndex === 2) return parseFloat(cellText.replace('$', ''));
    return cellText;
  }
});

// Compare two tables
const comparison = await compareTables(
  page.locator('#current-table'),
  page.locator('#expected-table'),
  {
    ignoreOrder: true,
    ignoreColumns: ['timestamp']
  }
);
```

Table comparison example:
```
Table A (Current):              Table B (Expected):
┌─────────┬───────┬───────────┐  ┌─────────┬───────┬───────────┐
│ Product │ Price │ Timestamp │  │ Product │ Price │ Timestamp │
├─────────┼───────┼───────────┤  ├─────────┼───────┼───────────┤
│ Item A  │ $10   │ 10:30     │  │ Item B  │ $20   │ 10:45     │
│ Item B  │ $20   │ 10:35     │  │ Item A  │ $10   │ 10:50     │
└─────────┴───────┴───────────┘  └─────────┴───────┴───────────┘

Comparison Result (ignoring order & timestamp):
✓ Tables match - same products and prices
```

## Table Search and Filtering

```typescript
// Search for 'john' in our users table
const searchResults = await searchTable(page.locator('#users-table'), 'john', {
  columns: ['Name', 'Email'],
  caseSensitive: false
});
// Returns: [{ name: 'John Doe', email: 'john@example.com', role: 'Admin' }]

// Find all User role entries
const users = await findTableRows(page.locator('#users-table'), {
  column: 'Role',
  value: 'User'
});
// Returns: Jane Smith and Bob Wilson rows

// Get unique values from Role column
const roles = await getUniqueColumnValues(page.locator('#users-table'), 'Role');
console.log(roles); // ['Admin', 'User']
```

Search results visualization:
```
Search for 'john':
┌─────────────┬──────────────────┬───────┐
│ Name        │ Email            │ Role  │
├─────────────┼──────────────────┼───────┤
│ John Doe ✓  │ john@example.com │ Admin │ ← Match found
└─────────────┴──────────────────┴───────┘

Filter by Role = 'User':
┌─────────────┬──────────────────┬───────┐
│ Name        │ Email            │ Role  │
├─────────────┼──────────────────┼───────┤
│ Jane Smith  │ jane@example.com │ User  │ ← Matches
│ Bob Wilson  │ bob@example.com  │ User  │ ← Matches
└─────────────┴──────────────────┴───────┘
```

## Best Practices

- Use header-based column access for maintainable tests
- Wait for dynamic tables to fully load before extraction
- Validate table structure before extracting data
- Use specific selectors for complex table layouts
- Handle pagination when extracting complete datasets
- Consider performance with large tables - extract only needed data

## Related Modules

- [Element Queries](./element-queries.md) - For table element existence checks
- [Waiting](./waiting.md) - For dynamic table loading
- [Assertions](./assertions.md) - For table content validation