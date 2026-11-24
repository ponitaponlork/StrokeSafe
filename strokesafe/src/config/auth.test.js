import { test } from "node:test";
import assert from "node:assert/strict";
import { validateIdentifier, validateLogIn, validateSignUp, isAuthAvailable } from "./auth.js";

test("auth backend is not connected, so the app never pretends to log in", () => {
  assert.equal(isAuthAvailable(), false);
});

test("identifier accepts email or phone", () => {
  assert.equal(validateIdentifier("someone@example.com"), null);
  assert.equal(validateIdentifier("012 345 678"), null);
  assert.equal(validateIdentifier("+855 12 345 678"), null);
  assert.equal(validateIdentifier(""), "auth.error.identifierRequired");
  assert.equal(validateIdentifier("bad@"), "auth.error.email");
  assert.equal(validateIdentifier("1234"), "auth.error.identifier");
});

test("log in requires both fields", () => {
  assert.deepEqual(validateLogIn({ identifier: "a@b.co", password: "x" }), {});
  assert.deepEqual(Object.keys(validateLogIn({ identifier: "", password: "" })).sort(), ["identifier", "password"]);
});

test("sign up checks length, match and consent", () => {
  assert.deepEqual(validateSignUp({ identifier: "a@b.co", password: "12345678", confirm: "12345678", agree: true }), {});
  assert.equal(validateSignUp({ identifier: "a@b.co", password: "short", confirm: "short", agree: true }).password, "auth.error.passwordShort");
  assert.equal(validateSignUp({ identifier: "a@b.co", password: "12345678", confirm: "1234567x", agree: true }).confirm, "auth.error.passwordMatch");
  assert.equal(validateSignUp({ identifier: "a@b.co", password: "12345678", confirm: "12345678", agree: false }).agree, "auth.error.agree");
});
