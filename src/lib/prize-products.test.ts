import { describe, expect, test } from "bun:test";
import { hasSelectedModel, PRIZE_PRODUCTS, selectModel } from "./prize-products";

describe("GTA VI bundle selection", () => {
  test("offers the two uploaded controller models with GTA VI", () => {
    expect(PRIZE_PRODUCTS.map((product) => product.id)).toEqual(["gta-vi-black", "gta-vi-white"]);
  });
  test("selecting the other model replaces the current choice", () => {
    expect(selectModel(["gta-vi-black"], "gta-vi-white")).toEqual(["gta-vi-white"]);
  });
  test("checkout requires one valid controller and game bundle", () => {
    expect(hasSelectedModel([])).toBe(false);
    expect(hasSelectedModel(["gta-vi-black"])).toBe(true);
    expect(hasSelectedModel(["gta-vi-black", "gta-vi-white"])).toBe(false);
    expect(hasSelectedModel(["panela-grande"])).toBe(false);
  });
  test("the selected model can be deselected", () => {
    expect(selectModel(["gta-vi-white"], "gta-vi-white")).toEqual([]);
  });
});