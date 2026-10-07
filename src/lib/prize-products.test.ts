import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { hasSelectedModel, PRIZE_PRODUCTS, selectModel } from "./prize-products";

describe("GTA VI bundle selection", () => {
  test("offers the two uploaded controller models with GTA VI", () => {
    assert.deepEqual(PRIZE_PRODUCTS.map((product) => product.id), ["gta-vi-black", "gta-vi-white"]);
  });
  test("selecting the other model replaces the current choice", () => {
    assert.deepEqual(selectModel(["gta-vi-black"], "gta-vi-white"), ["gta-vi-white"]);
  });
  test("checkout requires one valid controller and game bundle", () => {
    assert.equal(hasSelectedModel([]), false);
    assert.equal(hasSelectedModel(["gta-vi-black"]), true);
    assert.equal(hasSelectedModel(["gta-vi-black", "gta-vi-white"]), false);
    assert.equal(hasSelectedModel(["panela-grande"]), false);
  });
  test("the selected model can be deselected", () => {
    assert.deepEqual(selectModel(["gta-vi-white"], "gta-vi-white"), []);
  });
});