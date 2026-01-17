import { describe, expect, test, vi } from "vitest";
import type { Page } from "@playwright/test";
import { createPageObject, createPageObjectWithComponents, withComponents } from "../src/page-objects";

describe("page-objects: composing components", () => {
  test("withComponents attaches an eager components object", () => {
    const pageObject = createPageObject({} as Page, "/test");

    const factory = vi.fn(() => ({
      header: "hello",
      answer: 42,
    }));

    const extended = withComponents(pageObject, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(extended.components.header).toBe("hello");
    expect(extended.components.answer).toBe(42);
  });

  test("withComponents supports lazy components (factory runs on first access)", () => {
    const pageObject = createPageObject({} as Page, "/test");

    const factory = vi.fn(() => ({
      foo: "bar",
    }));

    const extended = withComponents(pageObject, factory, { lazy: true });

    expect(factory).toHaveBeenCalledTimes(0);
    expect(extended.components.foo).toBe("bar");
    expect(factory).toHaveBeenCalledTimes(1);

    // cached
    expect(extended.components.foo).toBe("bar");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test("createPageObjectWithComponents composes in one call", () => {
    const factory = vi.fn((po: any) => ({
      baseUrl: po.baseUrl,
    }));

    const pageObject = createPageObjectWithComponents({} as Page, "/login", {}, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(pageObject.baseUrl).toBe("/login");
    expect(pageObject.components.baseUrl).toBe("/login");
  });
});
