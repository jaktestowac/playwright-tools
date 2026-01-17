import { describe, test, expect, beforeEach, vi } from "vitest";
import type { Page, Locator } from "@playwright/test";
import {
  createComponent,
  createDropdown,
  createComboboxWithGrid,
  createTextInput,
  createCheckbox,
  createRadioGroup,
  createAccordion,
  createAlert,
} from "../src/components";

function createMockLocator(name = "locator") {
  const loc: any = {
    __name: name,
    locator: vi.fn(),
    first: vi.fn(),
    nth: vi.fn(),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    press: vi.fn().mockResolvedValue(undefined),
    focus: vi.fn().mockResolvedValue(undefined),
    waitFor: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(1),
    textContent: vi.fn().mockResolvedValue(""),
    inputValue: vi.fn().mockResolvedValue(""),
    setChecked: vi.fn().mockResolvedValue(undefined),
    isChecked: vi.fn().mockResolvedValue(false),
    getAttribute: vi.fn().mockResolvedValue(null),
  };

  loc.first.mockReturnValue(loc);
  loc.nth.mockReturnValue(loc);
  loc.locator.mockImplementation((sel: string) => createMockLocator(`${name} >> ${sel}`));
  return loc;
}

function createMockPage() {
  const page: any = {
    locator: vi.fn(),
    keyboard: { press: vi.fn().mockResolvedValue(undefined) },
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
  };
  // Default: page.locator returns a locator that exists.
  page.locator.mockImplementation((sel: string) => createMockLocator(`page.locator(${sel})`));
  return page;
}

describe("Component factories", () => {
  let mockPage: any;
  let mockRoot: any;

  beforeEach(() => {
    mockPage = createMockPage();
    mockRoot = createMockLocator("root");
  });

  test("createComponent provides locator, waitForReady and isVisible", async () => {
    const returnedLocator = {};
    mockRoot.locator.mockReturnValue(returnedLocator);

    const comp = createComponent(mockPage as Page, mockRoot as Locator, { defaultTimeout: 2000 });

    expect(comp.page).toBe(mockPage);
    expect(comp.root).toBe(mockRoot);

    const loc = comp.locator(".foo");
    expect(loc).toBe(returnedLocator);
    expect(mockRoot.locator).toHaveBeenCalledWith(".foo");

    await comp.waitForReady(123);
    expect(mockRoot.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 123 });

    mockRoot.waitFor.mockResolvedValue(undefined);
    await expect(comp.isVisible(50)).resolves.toBe(true);

    mockRoot.waitFor.mockRejectedValue(new Error("not visible"));
    await expect(comp.isVisible(50)).resolves.toBe(false);
  });

  test("createComponent supports extensions via argument and .extend", async () => {
    const comp = createComponent(mockPage as Page, mockRoot as Locator, {}, { hello: () => "world" });
    expect((comp as any).hello()).toBe("world");

    const comp2 = createComponent(mockPage as Page, mockRoot as Locator).extend({
      add: (a: number, b: number) => a + b,
    });
    expect((comp2 as any).add(1, 2)).toBe(3);
  });

  test("createDropdown open waits for panel and selectByText clicks option", async () => {
    const triggerLoc = createMockLocator("trigger");
    triggerLoc.count.mockResolvedValue(1);
    mockRoot.locator.mockReturnValue(triggerLoc);

    const visiblePanel = createMockLocator("panel-visible");
    mockPage.locator.mockImplementation((sel: string) => {
      if (sel.includes(":visible")) return visiblePanel;
      return createMockLocator(`page.locator(${sel})`);
    });

    const dd = createDropdown(mockPage as Page, mockRoot as Locator, {
      panelSelector: ".menu",
      optionSelector: ".option",
      triggerSelector: "button",
    });

    await dd.open();
    expect(visiblePanel.waitFor).toHaveBeenCalled();

    const candidate = createMockLocator("candidate");
    candidate.count.mockResolvedValue(1);
    mockPage.locator.mockImplementation((sel: string) => {
      if (sel.includes(":has-text")) return candidate;
      if (sel.includes(":visible")) return visiblePanel;
      return createMockLocator(`page.locator(${sel})`);
    });

    await dd.selectByText("Sign out");
    expect(candidate.click).toHaveBeenCalled();
  });

  test("createComboboxWithGrid opens dropdown and selects row by cell text", async () => {
    const trigger = createMockLocator("combo-trigger");
    mockRoot.locator.mockImplementation((sel: string) => {
      if (sel.includes("combobox")) return trigger;
      return createMockLocator(`root.locator(${sel})`);
    });

    const visibleDropdown = createMockLocator("dropdown-visible");
    const grid = createMockLocator("grid");
    const matchingRow = createMockLocator("matching-row");
    matchingRow.count.mockResolvedValue(1);
    grid.locator.mockReturnValue(matchingRow);
    visibleDropdown.locator.mockReturnValue(grid);

    mockPage.locator.mockImplementation((sel: string) => {
      if (sel.includes(":visible")) return visibleDropdown;
      if (sel.includes(".dropdown")) return visibleDropdown;
      return createMockLocator(`page.locator(${sel})`);
    });

    const combo = createComboboxWithGrid(mockPage as Page, mockRoot as Locator, {
      triggerSelector: '[role="combobox"]',
      dropdownSelector: ".dropdown",
      gridSelector: "table",
      rowSelector: "tr",
      cellSelector: "td",
    });

    await combo.open();
    expect(trigger.click).toHaveBeenCalled();
    expect(visibleDropdown.waitFor).toHaveBeenCalled();

    await combo.selectRowByCellText("td:nth-child(1)", "Acme");
    expect(matchingRow.click).toHaveBeenCalled();
  });

  test("createTextInput fills and reads value", async () => {
    const input = createMockLocator("input");
    input.inputValue.mockResolvedValue("hello");
    mockRoot.locator.mockReturnValue(input);

    const ti = createTextInput(mockPage as Page, mockRoot as Locator, { inputSelector: "input" });
    await ti.fill("hello");
    expect(input.fill).toHaveBeenCalledWith("hello");

    await expect(ti.getValue()).resolves.toBe("hello");
  });

  test("createCheckbox uses setChecked when available", async () => {
    const checkbox = createMockLocator("checkbox");
    mockRoot.locator.mockReturnValue(checkbox);
    const cb = createCheckbox(mockPage as Page, mockRoot as Locator, { checkboxSelector: "input[type=checkbox]" });
    await cb.check();
    expect(checkbox.setChecked).toHaveBeenCalledWith(true);
  });

  test("createRadioGroup selects by label text", async () => {
    const label = createMockLocator("label");
    label.count.mockResolvedValue(1);
    mockRoot.locator.mockImplementation((sel: string) => {
      if (sel.startsWith("label:")) return label;
      return createMockLocator(`root.locator(${sel})`);
    });
    const rg = createRadioGroup(mockPage as Page, mockRoot as Locator);
    await rg.selectByLabelText("Express");
    expect(label.click).toHaveBeenCalled();
  });

  test("createAccordion expand/collapse toggles header click based on expanded state", async () => {
    const header = createMockLocator("header");
    header.getAttribute.mockResolvedValue("false");
    const panel = createMockLocator("panel");

    mockRoot.locator.mockImplementation((sel: string) => {
      if (sel.includes("accordion-header") || sel.includes('role="button"')) return header;
      if (sel.includes("accordion-panel") || sel.includes('role="region"')) return panel;
      return createMockLocator(`root.locator(${sel})`);
    });

    const acc = createAccordion(mockPage as Page, mockRoot as Locator, {
      headerSelector: ".accordion-header",
      panelSelector: ".accordion-panel",
    });

    await acc.expand();
    expect(header.click).toHaveBeenCalled();
  });

  test("createAlert reads text and closes via close button", async () => {
    const msg = createMockLocator("msg");
    msg.textContent.mockResolvedValue("Saved!");
    const closeBtn = createMockLocator("close");
    closeBtn.count.mockResolvedValue(1);

    mockRoot.locator.mockImplementation((sel: string) => {
      if (sel.includes("message") || sel.includes('role="alert"')) return msg;
      if (sel.includes('aria-label="close"') || sel.includes("close")) return closeBtn;
      return createMockLocator(`root.locator(${sel})`);
    });

    const alert = createAlert(mockPage as Page, mockRoot as Locator, {
      messageSelector: ".message",
      closeSelector: "button[aria-label=close]",
    });

    await expect(alert.getText()).resolves.toBe("Saved!");
    await alert.close();
    expect(closeBtn.click).toHaveBeenCalled();
  });
});
