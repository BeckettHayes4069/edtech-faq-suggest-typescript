import test from "node:test";
import assert from "node:assert/strict";
import { chooseFaqs } from "./faq_service.ts";

test("deadline typing puts extension guidance first", () => {
  const result = chooseFaqs("deadline extension", "storefront-101", 2);
  assert.equal(result[0].id, "deadline-extension");
  assert.equal(result.length, 2);
});
