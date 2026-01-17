import type { Page, Locator } from "@playwright/test";
import {
  ComponentOptions,
  ComboboxWithGridOptions,
  ComboboxWithGrid,
  ComponentBase,
  ModalOptions,
  DropdownOptions,
  TableComponentOptions,
  DatePickerOptions,
  TabsOptions,
  PaginationOptions,
  TextInputOptions,
  TextInput,
  CheckboxOptions,
  Checkbox,
  RadioGroupOptions,
  RadioGroup,
  AlertOptions,
  Alert,
  AccordionOptions,
  Accordion,
} from "./types";

function escapeForHasText(value: unknown) {
  return String(value).replace(/"/g, '\\"');
}

/**
 * Generic component factory.
 * Provides a minimal, composable API for component-specific factories to build on.
 */
export function createComponent<T extends object = {}>(
  page: Page,
  root: Locator,
  options: ComponentOptions = {},
  extensions?: T,
): ComponentBase & T {
  const defaultTimeout = options.defaultTimeout ?? 30000;

  // NOTE: avoid relying on `this` inside methods so users can safely destructure/compose.
  const base: ComponentBase = {
    page,
    root,
    options,

    locator(selector: string) {
      return root.locator(selector);
    },

    async waitForReady(timeout: number = defaultTimeout) {
      await root.waitFor({ state: "attached", timeout });
    },

    async isVisible(timeout: number = defaultTimeout) {
      try {
        await root.waitFor({ state: "visible", timeout });
        return true;
      } catch {
        return false;
      }
    },

    extend<T>(extensions: T) {
      return Object.assign(base, extensions) as typeof base & T;
    },
  };

  return (extensions ? base.extend(extensions) : base) as ComponentBase & T;
}

// Modal / Dialog component
export function createModal<T extends object = {}>(
  page: Page,
  root: Locator,
  options: ModalOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const titleSelector = options.titleSelector || "h1, h2, .modal-title";
  const contentSelector = options.contentSelector || ".modal-body, .content";
  const confirmSelector = options.confirmSelector || 'button[data-action="confirm"], button.confirm';
  const cancelSelector = options.cancelSelector || 'button[data-action="cancel"], button.cancel';
  const closeSelector = options.closeSelector || 'button[aria-label="close"], .close';

  async function isOpen() {
    return base.isVisible();
  }

  async function getTitle() {
    const el = root.locator(titleSelector).first();
    return (await el.textContent()) || "";
  }

  async function getContent() {
    const el = root.locator(contentSelector).first();
    return (await el.textContent()) || "";
  }

  async function confirm() {
    await root.locator(confirmSelector).first().click();
  }

  async function cancel() {
    await root.locator(cancelSelector).first().click();
  }

  async function close() {
    // try close button, then ESC
    const btn = root.locator(closeSelector).first();
    if ((await btn.count()) > 0) {
      await btn.click();
    } else {
      await page.keyboard.press("Escape");
    }
  }

  const modal = base.extend({
    async open() {
      // Typically modals are opened by interacting elsewhere; here we assume root click triggers it.
      await root.click();
    },
    async close() {
      await close();
    },
    async isOpen() {
      return isOpen();
    },
    async getTitle() {
      return getTitle();
    },
    async getContent() {
      return getContent();
    },
    async confirm() {
      return confirm();
    },
    async cancel() {
      return cancel();
    },
  });

  return extensions ? modal.extend(extensions) : modal;
}

// Dropdown component (simple)
export function createDropdown<T extends object = {}>(
  page: Page,
  root: Locator,
  options: DropdownOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const triggerSelector = options.triggerSelector || 'button, [role="button"], .trigger';
  const panelSelector = options.panelSelector || '.dropdown-panel, [role="menu"], .menu';
  const optionSelector = options.optionSelector || 'li, .option, [role="option"]';

  async function open() {
    const trigger = root.locator(triggerSelector);
    if ((await trigger.count()) > 0) {
      await trigger.first().click();
    } else {
      await root.click();
    }
    await page
      .locator(`${panelSelector}:visible`)
      .first()
      .waitFor({ state: "visible", timeout: options.defaultTimeout ?? 30000 });
  }

  async function close() {
    await page.keyboard.press("Escape");
  }

  function panel() {
    return page.locator(panelSelector).first();
  }

  function optionsLocator() {
    return panel().locator(optionSelector);
  }

  async function selectByText(text: string) {
    const sel = `${panelSelector} ${optionSelector}:has-text("${escapeForHasText(text)}")`;
    const candidate = page.locator(sel);
    const count = await candidate.count();
    if (!count) throw new Error(`No option found with text: ${text}`);
    await candidate.first().click();
  }

  async function selectByIndex(index: number) {
    const opts = optionsLocator();
    await opts.nth(index).click();
  }

  async function search(query: string) {
    const input = root.locator('input[type="search"], input[placeholder], input[aria-label*="search"]');
    if ((await input.count()) > 0) {
      await input.first().fill(query);
      await page.waitForTimeout(100);
    } else {
      throw new Error("Search input not found in dropdown root");
    }
  }

  const dropdown = base.extend({
    async open() {
      return open();
    },
    async close() {
      return close();
    },
    async isOpen() {
      return (await page.locator(`${panelSelector}:visible`).count()) > 0;
    },
    getOptions() {
      return optionsLocator();
    },
    async selectByText(text: string) {
      return selectByText(text);
    },
    async selectByIndex(i: number) {
      return selectByIndex(i);
    },
    async search(q: string) {
      return search(q);
    },
  });

  return extensions ? dropdown.extend(extensions) : dropdown;
}

// Table component
export function createTableComponent<T extends object = {}>(
  page: Page,
  root: Locator,
  options: TableComponentOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const headerSelector = options.headerSelector || "th";
  const rowSelector = options.rowSelector || "tr";
  const cellSelector = options.cellSelector || "td";

  function headers() {
    return root.locator(headerSelector);
  }

  function rows() {
    return root.locator(rowSelector);
  }

  function row(index: number) {
    return rows().nth(index);
  }

  function cell(rowIndex: number, colIndex: number) {
    return row(rowIndex).locator(`${cellSelector}`).nth(colIndex);
  }

  async function getHeaders() {
    const count = await headers().count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      out.push((await headers().nth(i).textContent()) || "");
    }
    return out;
  }

  async function extractRowData(index: number) {
    const r = row(index);
    const cells = r.locator(cellSelector);
    const count = await cells.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push((await cells.nth(i).textContent()) || "");
    }
    return result;
  }

  function findRowByCellText(text: string) {
    const sel = `${rowSelector}:has-text("${escapeForHasText(text)}")`;
    return root.locator(sel);
  }

  async function selectRow(index: number) {
    await row(index).click();
  }

  const table = base.extend({
    async getHeaders() {
      return getHeaders();
    },
    getRows() {
      return rows();
    },
    getRow(i: number) {
      return row(i);
    },
    getCell(r: number, c: number) {
      return cell(r, c);
    },
    async extractRowData(i: number) {
      return extractRowData(i);
    },
    findRowByCellText(text: string) {
      return findRowByCellText(text);
    },
    async selectRow(i: number) {
      return selectRow(i);
    },
  });

  return extensions ? table.extend(extensions) : table;
}

// DatePicker component
export function createDatePicker<T extends object = {}>(
  page: Page,
  root: Locator,
  options: DatePickerOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const inputSelector = options.inputSelector || 'input[type="date"], input.date-input';
  const calendarButtonSelector = options.calendarButtonSelector || 'button[aria-haspopup="dialog"], .calendar-button';
  const dayCellSelector = options.dayCellSelector || "td, .day";

  function input() {
    return root.locator(inputSelector).first();
  }

  async function openCalendar() {
    const btn = root.locator(calendarButtonSelector);
    if ((await btn.count()) > 0) {
      await btn.first().click();
    } else {
      await input().click();
    }
  }

  async function selectDate(date: string | Date) {
    const d = date instanceof Date ? date.toISOString().split("T")[0] : String(date);
    // naive selector that finds day cell containing text
    const sel = `${dayCellSelector}:has-text("${escapeForHasText(d)}")`;
    const candidate = page.locator(sel);
    if ((await candidate.count()) === 0) {
      // try to set value directly
      await input().fill(d);
    } else {
      await candidate.first().click();
    }
  }

  async function setDate(value: string) {
    await input().fill(value);
  }

  async function getValue() {
    return (await input().inputValue()) || "";
  }

  async function clear() {
    await input().fill("");
  }

  const datePicker = base.extend({
    async openCalendar() {
      return openCalendar();
    },
    async selectDate(v: string | Date) {
      return selectDate(v);
    },
    async setDate(v: string) {
      return setDate(v);
    },
    async getValue() {
      return getValue();
    },
    async clear() {
      return clear();
    },
  });

  return extensions ? datePicker.extend(extensions) : datePicker;
}

// Tabs component
export function createTabs<T extends object = {}>(
  page: Page,
  root: Locator,
  options: TabsOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const tabSelector = options.tabSelector || 'button[role="tab"], .tab';
  const panelSelector = options.panelSelector || '[role="tabpanel"], .tab-panel';

  function tabs() {
    return root.locator(tabSelector);
  }

  function tabByText(text: string) {
    return root.locator(`${tabSelector}:has-text("${escapeForHasText(text)}")`);
  }

  async function selectTab(index: number) {
    await tabs().nth(index).click();
  }

  async function selectTabByText(text: string) {
    const t = tabByText(text);
    if ((await t.count()) === 0) throw new Error(`Tab not found: ${text}`);
    await t.first().click();
  }

  function activeTab() {
    return root.locator(`${tabSelector}[aria-selected="true"], ${tabSelector}.active`).first();
  }

  const tabsComp = base.extend({
    async selectTab(i: number) {
      return selectTab(i);
    },
    async selectTabByText(text: string) {
      return selectTabByText(text);
    },
    getActiveTab() {
      return activeTab();
    },
    getTabs() {
      return tabs();
    },
  });

  return extensions ? tabsComp.extend(extensions) : tabsComp;
}

// Pagination component
export function createPagination<T extends object = {}>(
  page: Page,
  root: Locator,
  options: PaginationOptions = {},
  extensions?: T,
) {
  const base = createComponent(page, root, options);
  const nextSelector = options.nextSelector || '.next, [aria-label="next"]';
  const prevSelector = options.prevSelector || '.prev, [aria-label="previous"]';
  const pageSelector = options.pageSelector || "a.page, button.page";
  const currentSelector = options.currentSelector || '.active, [aria-current="true"]';

  async function next() {
    await root.locator(nextSelector).first().click();
  }

  async function prev() {
    await root.locator(prevSelector).first().click();
  }

  async function goTo(pageNumber: number) {
    const candidate = root.locator(`${pageSelector}:has-text("${pageNumber}")`);
    if ((await candidate.count()) === 0) throw new Error(`Page ${pageNumber} not found`);
    await candidate.first().click();
  }

  async function getCurrentPage() {
    const t = root.locator(
      `${pageSelector}${currentSelector ? `:has(${currentSelector})` : `.${String(currentSelector).replace(/\./g, "")}`}`,
    );
    if ((await t.count()) === 0) return null;
    const text = (await t.first().textContent()) || "";
    const num = Number(text.trim());
    return Number.isFinite(num) ? num : null;
  }

  async function totalPages() {
    const items = root.locator(pageSelector);
    const count = await items.count();
    return count || null;
  }

  const pagination = base.extend({
    async next() {
      return next();
    },
    async prev() {
      return prev();
    },
    async goTo(n: number) {
      return goTo(n);
    },
    async getCurrentPage() {
      return getCurrentPage();
    },
    async totalPages() {
      return totalPages();
    },
  });

  return extensions ? pagination.extend(extensions) : pagination;
}

// Combobox whose dropdown items are a grid
export function createComboboxWithGrid<T extends object = {}>(
  page: Page,
  root: Locator,
  options: ComboboxWithGridOptions = {},
  extensions?: T,
): ComboboxWithGrid & T {
  const base = createComponent(page, root, options);
  const triggerSelector = options.triggerSelector || '[role="combobox"], input, button';
  const dropdownSelector = options.dropdownSelector || '[role="listbox"], .dropdown-panel, .menu';
  const gridSelector = options.gridSelector || '[role="grid"], table, .grid';
  const rowSelector = options.rowSelector || '[role="row"], tr, .row';
  const defaultCellSelector = options.cellSelector || '[role="gridcell"], td, .cell';
  const searchInputSelector =
    options.searchInputSelector ||
    'input[type="search"], input[aria-label*="search" i], input[placeholder*="search" i]';

  function trigger() {
    return root.locator(triggerSelector).first();
  }

  function panel() {
    return page.locator(dropdownSelector).first();
  }

  function grid() {
    return panel().locator(gridSelector).first();
  }

  async function open() {
    if (options.openOnFocus) {
      const t = trigger();
      if (typeof (t as any).focus === "function") {
        await (t as any).focus();
      } else {
        await root.focus();
      }
    } else {
      await trigger().click();
    }
    await page
      .locator(`${dropdownSelector}:visible`)
      .first()
      .waitFor({
        state: "visible",
        timeout: options.defaultTimeout ?? 30000,
      });
  }

  async function close() {
    await page.keyboard.press("Escape");
  }

  async function isOpen() {
    return (await page.locator(`${dropdownSelector}:visible`).count()) > 0;
  }

  async function toggle() {
    if (await isOpen()) {
      await close();
    } else {
      await open();
    }
  }

  async function search(query: string) {
    const input = root.locator(searchInputSelector).first();
    if ((await input.count()) === 0) {
      throw new Error("Search input not found in combobox root");
    }
    await input.fill(query);
    await page.waitForTimeout(100);
  }

  function getRows() {
    return grid().locator(rowSelector);
  }

  function getRow(index: number) {
    return getRows().nth(index);
  }

  function getCell(rowIndex: number, cellSelector?: string) {
    return getRow(rowIndex)
      .locator(cellSelector || defaultCellSelector)
      .first();
  }

  async function selectRow(index: number) {
    await getRow(index).click();
  }

  async function selectRowByCellText(cellSelector: string, text: string) {
    const escaped = escapeForHasText(text);
    const row = grid().locator(`${rowSelector}:has(${cellSelector}:has-text("${escaped}"))`).first();
    if ((await row.count()) === 0) {
      throw new Error(`No grid row found with cell text: ${text}`);
    }
    await row.click();
  }

  const combo = base.extend({
    async open() {
      return open();
    },
    async close() {
      return close();
    },
    async isOpen() {
      return isOpen();
    },
    async toggle() {
      return toggle();
    },
    async search(q: string) {
      return search(q);
    },
    getRows() {
      return getRows();
    },
    getRow(i: number) {
      return getRow(i);
    },
    getCell(rowIndex: number, cellSelector?: string) {
      return getCell(rowIndex, cellSelector);
    },
    async selectRow(i: number) {
      return selectRow(i);
    },
    async selectRowByCellText(cellSelector: string, text: string) {
      return selectRowByCellText(cellSelector, text);
    },
  });

  return (extensions ? combo.extend(extensions) : combo) as ComboboxWithGrid & T;
}

// Text input component
export function createTextInput<T extends object = {}>(
  page: Page,
  root: Locator,
  options: TextInputOptions = {},
  extensions?: T,
): TextInput & T {
  const base = createComponent(page, root, options);
  const inputSelector = options.inputSelector || 'input, textarea, [contenteditable="true"]';

  function input() {
    return root.locator(inputSelector).first();
  }

  async function fill(value: string) {
    await input().fill(value);
  }

  async function clear() {
    await input().fill("");
  }

  async function getValue() {
    // Prefer inputValue when available; fallback to textContent for contenteditable.
    const el: any = input();
    if (typeof el.inputValue === "function") {
      return (await el.inputValue()) || "";
    }
    return (await input().textContent()) || "";
  }

  async function focus() {
    const el: any = input();
    if (typeof el.focus === "function") {
      await el.focus();
    } else {
      await root.focus();
    }
  }

  async function press(key: string) {
    await input().press(key);
  }

  const textInput = base.extend({
    getInput() {
      return input();
    },
    async fill(value: string) {
      return fill(value);
    },
    async clear() {
      return clear();
    },
    async getValue() {
      return getValue();
    },
    async focus() {
      return focus();
    },
    async press(key: string) {
      return press(key);
    },
  });

  return (extensions ? textInput.extend(extensions) : textInput) as TextInput & T;
}

// Checkbox component
export function createCheckbox<T extends object = {}>(
  page: Page,
  root: Locator,
  options: CheckboxOptions = {},
  extensions?: T,
): Checkbox & T {
  const base = createComponent(page, root, options);
  const checkboxSelector = options.checkboxSelector || 'input[type="checkbox"], [role="checkbox"]';

  function checkbox() {
    return root.locator(checkboxSelector).first();
  }

  async function setChecked(value: boolean) {
    const el: any = checkbox();
    if (typeof el.setChecked === "function") {
      await el.setChecked(value);
      return;
    }
    const current = await isChecked();
    if (current !== value) {
      await checkbox().click();
    }
  }

  async function isChecked() {
    const el: any = checkbox();
    if (typeof el.isChecked === "function") {
      return await el.isChecked();
    }
    // role=checkbox fallback
    const aria = (await checkbox().getAttribute?.("aria-checked")) || "";
    return aria === "true";
  }

  async function toggle() {
    await checkbox().click();
  }

  const cb = base.extend({
    getCheckbox() {
      return checkbox();
    },
    async check() {
      return setChecked(true);
    },
    async uncheck() {
      return setChecked(false);
    },
    async toggle() {
      return toggle();
    },
    async isChecked() {
      return isChecked();
    },
  });

  return (extensions ? cb.extend(extensions) : cb) as Checkbox & T;
}

// Radio group component
export function createRadioGroup<T extends object = {}>(
  page: Page,
  root: Locator,
  options: RadioGroupOptions = {},
  extensions?: T,
): RadioGroup & T {
  const base = createComponent(page, root, options);
  const radioSelector = options.radioSelector || 'input[type="radio"], [role="radio"]';

  function radios() {
    return root.locator(radioSelector);
  }

  async function selectByValue(value: string) {
    const r = root.locator(`${radioSelector}[value="${escapeForHasText(value)}"]`).first();
    if ((await r.count()) === 0) throw new Error(`Radio not found with value: ${value}`);
    await r.click();
  }

  async function selectByLabelText(text: string) {
    const label = root.locator(`label:has-text("${escapeForHasText(text)}")`).first();
    if ((await label.count()) === 0) throw new Error(`Radio label not found: ${text}`);
    await label.click();
  }

  const rg = base.extend({
    getRadios() {
      return radios();
    },
    async selectByValue(value: string) {
      return selectByValue(value);
    },
    async selectByLabelText(text: string) {
      return selectByLabelText(text);
    },
  });

  return (extensions ? rg.extend(extensions) : rg) as RadioGroup & T;
}

// Alert / Toast component
export function createAlert<T extends object = {}>(
  page: Page,
  root: Locator,
  options: AlertOptions = {},
  extensions?: T,
): Alert & T {
  const base = createComponent(page, root, options);
  const messageSelector = options.messageSelector || '.message, [role="alert"], [role="status"]';
  const closeSelector = options.closeSelector || 'button[aria-label="close"], .close, .dismiss';

  async function getText() {
    const el = root.locator(messageSelector).first();
    return (await el.textContent()) || "";
  }

  async function close() {
    const btn = root.locator(closeSelector).first();
    if ((await btn.count()) > 0) {
      await btn.click();
    } else {
      await page.keyboard.press("Escape");
    }
  }

  const alert = base.extend({
    async getText() {
      return getText();
    },
    async close() {
      return close();
    },
  });

  return (extensions ? alert.extend(extensions) : alert) as Alert & T;
}

// Accordion component
export function createAccordion<T extends object = {}>(
  page: Page,
  root: Locator,
  options: AccordionOptions = {},
  extensions?: T,
): Accordion & T {
  const base = createComponent(page, root, options);
  const headerSelector = options.headerSelector || '[role="button"], button, .accordion-header';
  const panelSelector = options.panelSelector || '.accordion-panel, [role="region"], .panel';

  function header() {
    return root.locator(headerSelector).first();
  }

  function panel() {
    return root.locator(panelSelector).first();
  }

  async function isExpanded() {
    const h: any = header();
    if (typeof h.getAttribute === "function") {
      const aria = (await h.getAttribute("aria-expanded")) || "";
      if (aria) return aria === "true";
    }
    // fallback: panel visible
    try {
      await panel().waitFor({ state: "visible", timeout: options.defaultTimeout ?? 30000 });
      return true;
    } catch {
      return false;
    }
  }

  async function expand() {
    if (!(await isExpanded())) await header().click();
  }

  async function collapse() {
    if (await isExpanded()) await header().click();
  }

  async function toggle() {
    await header().click();
  }

  const acc = base.extend({
    getHeader() {
      return header();
    },
    getPanel() {
      return panel();
    },
    async isExpanded() {
      return isExpanded();
    },
    async expand() {
      return expand();
    },
    async collapse() {
      return collapse();
    },
    async toggle() {
      return toggle();
    },
  });

  return (extensions ? acc.extend(extensions) : acc) as Accordion & T;
}
