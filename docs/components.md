# Components: Factory Pattern

This library includes a small component factory pattern to create composable, test-friendly component objects similar to `createPageObject`.

## Goals

- Keep things composable and functional (factory-based) — avoid deep OOP inheritance.
- Provide a minimal base (`createComponent`) with helpers and let concrete factories compose/extend it.
- Make it easy to encapsulate complex widgets (e.g., combobox whose dropdown contains a grid).

## Example

This pattern is designed to be:

- **Composable**: factories return plain objects; no inheritance hierarchy.
- **Destructurable-safe**: methods avoid relying on `this`.
- **Extensible**: every component has `.extend()` and most factories also accept an optional `extensions` object.

### Base factory

```ts
import { createComponent } from "playwright-tools";

const comp = createComponent(page, page.locator("#root"));

await comp.waitForReady();
const isVisible = await comp.isVisible();

// Extend ad-hoc
const withHelpers = comp.extend({
  async screenshot(name: string) {
    await comp.root.screenshot({ path: `${name}.png` });
  },
});
```

## Included component factories

All factories follow the same signature:

```ts
createX(page, rootLocator, options?, extensions?)
```

Where `extensions` is a plain object merged into the returned component.

### Modal / dialog

```ts
import { createModal } from "playwright-tools";

const modal = createModal(page, page.locator(".modal"), {
  titleSelector: "h2",
  confirmSelector: "button:has-text('Save')",
});

await modal.isOpen();
await modal.confirm();
```

### Dropdown (simple)

```ts
import { createDropdown } from "playwright-tools";

const dd = createDropdown(page, page.locator(".user-menu"), {
  panelSelector: "[role=menu]",
  optionSelector: "[role=menuitem]",
});

await dd.open();
await dd.selectByText("Sign out");
```

### Table

```ts
import { createTableComponent } from "playwright-tools";

const table = createTableComponent(page, page.locator("table"));

const headers = await table.getHeaders();
const firstRow = await table.extractRowData(0);
await table.selectRow(1);
```

### Date picker

```ts
import { createDatePicker } from "playwright-tools";

const date = createDatePicker(page, page.locator(".date-field"));
await date.openCalendar();
await date.selectDate("2026-01-17");
```

### Tabs

```ts
import { createTabs } from "playwright-tools";

const tabs = createTabs(page, page.locator(".tabs"));
await tabs.selectTabByText("Settings");
```

### Pagination

```ts
import { createPagination } from "playwright-tools";

const pager = createPagination(page, page.locator(".pagination"));
await pager.goTo(3);
const current = await pager.getCurrentPage();
```

### Text input

```ts
import { createTextInput } from "playwright-tools";

const email = createTextInput(page, page.locator("#email"), {
  inputSelector: "input",
});

await email.fill("user@example.com");
await email.press("Enter");
```

### Checkbox

```ts
import { createCheckbox } from "playwright-tools";

const agree = createCheckbox(page, page.locator("#agree"));
await agree.check();
expect(await agree.isChecked()).toBe(true);
```

### Radio group

```ts
import { createRadioGroup } from "playwright-tools";

const shipping = createRadioGroup(page, page.locator(".shipping-method"));
await shipping.selectByLabelText("Express");
```

### Alert / toast

```ts
import { createAlert } from "playwright-tools";

const toast = createAlert(page, page.locator(".toast"), {
  closeSelector: "button[aria-label=close]",
});

expect(await toast.getText()).toContain("Saved");
await toast.close();
```

### Accordion

```ts
import { createAccordion } from "playwright-tools";

const acc = createAccordion(page, page.locator(".accordion"));
await acc.expand();
expect(await acc.isExpanded()).toBe(true);
```

## Advanced: combobox with grid

Some apps implement “comboboxes” whose dropdown contains a grid/table.
`createComboboxWithGrid` gives you helpers to open/close, search, and select rows.

```ts
import { createComboboxWithGrid } from "playwright-tools";

const combo = createComboboxWithGrid(page, page.locator(".customer-picker"), {
  triggerSelector: "[role=combobox]",
  dropdownSelector: ".dropdown-panel",
  gridSelector: "table",
  rowSelector: "tbody tr",
  cellSelector: "td",
  searchInputSelector: "input[type=search]",
});

await combo.open();
await combo.search("Acme");
await combo.selectRowByCellText("td:nth-child(1)", "Acme Corp");
```

## Using components inside page objects

Components pair nicely with `createPageObject`. A common pattern is to attach them under a `components` property:

```ts
import { createPageObject, withComponents, createDropdown } from "playwright-tools";

const p = withComponents(createPageObject(page, "/account"), (po) => ({
  userMenu: createDropdown(po.page, po.getByTestId("user-menu")),
}));

await p.components.userMenu.open();
await p.components.userMenu.selectByText("Sign out");
```

See also: `docs/page-objects.md`.

## Extending components safely

You can extend any component either by:

1. Calling `.extend()` on the returned object
2. Passing `extensions` as the last argument to the factory

```ts
const pager = createPagination(
  page,
  page.locator(".pagination"),
  {},
  {
    async goToLast() {
      const total = await pager.totalPages();
      if (total) await pager.goTo(total);
    },
  },
);

await pager.goToLast();
```
