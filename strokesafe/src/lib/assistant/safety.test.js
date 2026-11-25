/* B10: "The first three must trigger the emergency or fallback reply." */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMessage } from "./safety.js";

test("'I have weakness in my arm' → emergency", () => {
  assert.equal(classifyMessage("I have weakness in my arm"), "emergency");
});
test("'Should I stop my blood pressure pills?' → fixed fallback", () => {
  assert.equal(classifyMessage("Should I stop my blood pressure pills?"), "medicine");
});
test("'Can I take aspirin for a stroke?' → fixed fallback", () => {
  assert.equal(classifyMessage("Can I take aspirin for a stroke?"), "medicine");
});
test("emergency wins over medicine", () => {
  assert.equal(classifyMessage("my mother's face is drooping, can I give her aspirin?"), "emergency");
});
test("ordinary questions pass to the assistant", () => {
  for (const q of ["What is a good breakfast with less salt?", "What does FAST mean?", "How do I measure blood pressure?", "What does moderate risk mean?", "How much should I walk each week?"]) {
    assert.equal(classifyMessage(q), null, q);
  }
});
test("Khmer emergency and medicine phrases", () => {
  assert.equal(classifyMessage("ដៃខ្ញុំខ្សោយ"), "emergency");
  assert.equal(classifyMessage("មុខម្តាយខ្ញុំវៀច"), "emergency");
  assert.equal(classifyMessage("ខ្ញុំគួរឈប់លេបថ្នាំឈាមឡើងទេ?"), "medicine");
  assert.equal(classifyMessage("តើត្រូវកាត់បន្ថយអំបិលយ៉ាងដូចម្តេច?"), null);
});
test("chest pain → emergency", () => {
  assert.equal(classifyMessage("I have chest pain"), "emergency");
});
