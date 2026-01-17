import { describe, expect, test, vi } from "vitest";
import type { BrowserContext, Page } from "@playwright/test";
import {
  assertCurrentUrl,
  goBack,
  goForward,
  isPageReady,
  safeNavigate,
  waitForPageLoad,
  waitForUrlChange,
  openNewTab,
  closeTab,
  switchToTab,
} from "../src/navigation";

describe("navigation module (docs parity)", () => {
  function createMockPage(overrides?: Partial<any>) {
    const page: any = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      waitForURL: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      title: vi.fn().mockResolvedValue("Dashboard"),
      url: vi.fn().mockReturnValue("https://example.com/dashboard"),
      goBack: vi.fn().mockResolvedValue(undefined),
      goForward: vi.fn().mockResolvedValue(undefined),
      bringToFront: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    return page as unknown as Page;
  }

  test("assertCurrentUrl passes for exact string", async () => {
    const page = createMockPage({ url: vi.fn().mockReturnValue("https://example.com/a") });
    await expect(assertCurrentUrl(page, "https://example.com/a")).resolves.toBeUndefined();
  });

  test("assertCurrentUrl throws for regex mismatch", async () => {
    const page = createMockPage({ url: vi.fn().mockReturnValue("https://example.com/a") });
    await expect(assertCurrentUrl(page, /\/b$/)).rejects.toThrow("Expected current URL");
  });

  test("goBack/goForward call Playwright APIs and optionally wait for load", async () => {
    const page = createMockPage();

    await goBack(page, { waitForLoad: true, timeout: 123 });
    expect((page as any).goBack).toHaveBeenCalledWith({ timeout: 123, waitUntil: undefined });
    expect((page as any).waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: 123 });

    (page as any).waitForLoadState.mockClear();
    await goForward(page, { waitForLoad: true, timeout: 456 });
    expect((page as any).goForward).toHaveBeenCalledWith({ timeout: 456, waitUntil: undefined });
    expect((page as any).waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: 456 });
  });

  test("safeNavigate supports waitForSelector and expectedTitle", async () => {
    const page = createMockPage({ title: vi.fn().mockResolvedValue("Dashboard") });

    await safeNavigate(page, "/dashboard", {
      waitForSelector: ".main",
      expectedTitle: /Dash/,
      timeout: 999,
    });

    expect((page as any).goto).toHaveBeenCalledWith("/dashboard", {
      waitUntil: "networkidle",
      timeout: 999,
    });
    expect((page as any).waitForSelector).toHaveBeenCalledWith(".main", { timeout: 999 });
    expect((page as any).title).toHaveBeenCalled();
  });

  test("waitForPageLoad keeps backwards-compatible default (networkidle)", async () => {
    const page = createMockPage();

    await waitForPageLoad(page);
    expect((page as any).waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: undefined });
  });

  test("waitForPageLoad supports domContentLoaded + requiredElements", async () => {
    const page = createMockPage();

    await waitForPageLoad(page, {
      domContentLoaded: true,
      networkIdle: true,
      requiredElements: [".header", ".content"],
      timeout: 5000,
    } as any);

    expect((page as any).waitForLoadState).toHaveBeenCalledWith("domcontentloaded", { timeout: 5000 });
    expect((page as any).waitForLoadState).toHaveBeenCalledWith("networkidle", { timeout: 5000 });
    expect((page as any).waitForSelector).toHaveBeenCalledWith(".header", { state: "visible", timeout: 5000 });
    expect((page as any).waitForSelector).toHaveBeenCalledWith(".content", { state: "visible", timeout: 5000 });
  });

  test("isPageReady returns false on failure", async () => {
    const page = createMockPage({ waitForSelector: vi.fn().mockRejectedValue(new Error("nope")) });
    await expect(isPageReady(page, { checkElements: [".x"], timeout: 10 })).resolves.toBe(false);
  });

  test("waitForUrlChange delegates to waitForURL when expectedUrl provided", async () => {
    const page = createMockPage();
    await waitForUrlChange(page, { expectedUrl: /success/, timeout: 1234 });
    expect((page as any).waitForURL).toHaveBeenCalledWith(/success/, { timeout: 1234 });
  });

  test("openNewTab/switchToTab/closeTab basic behavior", async () => {
    const tab = createMockPage();
    const context: any = {
      newPage: vi.fn().mockResolvedValue(tab),
    };

    const newTab = await openNewTab(context as BrowserContext, "https://example.com", { timeout: 111 });
    expect(context.newPage).toHaveBeenCalled();
    expect((newTab as any).goto).toHaveBeenCalled();

    await switchToTab(newTab);
    expect((newTab as any).bringToFront).toHaveBeenCalled();

    await closeTab(newTab);
    expect((newTab as any).close).toHaveBeenCalled();
  });
});
