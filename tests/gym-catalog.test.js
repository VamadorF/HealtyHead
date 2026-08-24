"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const GymCatalog = require("../assets/js/gym-catalog.js");

const all = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/gym_exercises.json"), "utf8"));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log("ok  " + name);
}

test("dataset local tiene 1324 ejercicios", () => {
  assert.strictEqual(all.length, 1324);
  assert.ok(all[0].id && all[0].name && all[0].gif);
});

test("query sin filtros pagina y cuenta el total", () => {
  const data = GymCatalog.query(all, { catalog: "1", limit: "48" });
  assert.strictEqual(data.count, 1324);
  assert.strictEqual(data.total, 1324);
  assert.strictEqual(data.items.length, 48);
  assert.ok(data.items[0].gif);
  assert.ok(data.equipos.indexOf("body weight") >= 0);
  assert.ok(data.equipo_counts["body weight"] >= 300);
});

test("filtro por grupo recorta opciones de material", () => {
  const data = GymCatalog.query(all, { catalog: "1", grupo: "chest", limit: "1400" });
  assert.ok(data.total > 0);
  assert.ok(data.total < 1324);
  data.items.forEach((e) => assert.strictEqual(e.grupo, "chest"));
});

test("filtro por equipo y búsqueda", () => {
  const data = GymCatalog.query(all, { catalog: "1", equipo: "dumbbell", q: "press", limit: "1400" });
  assert.ok(data.items.length > 0);
  data.items.forEach((e) => {
    assert.strictEqual(e.equipo, "dumbbell");
    const blob = (e.name + " " + e.target + " " + e.equipo).toLowerCase();
    assert.ok(blob.indexOf("press") >= 0);
  });
});

test("ids concretos y offset", () => {
  const data = GymCatalog.query(all, { catalog: "1", ids: "0001,0662", limit: "10" });
  assert.strictEqual(data.total, 2);
  assert.strictEqual(data.items.length, 2);
  const page = GymCatalog.query(all, { catalog: "1", limit: "10", offset: "10" });
  assert.strictEqual(page.items.length, 10);
  assert.notStrictEqual(page.items[0].id, GymCatalog.query(all, { catalog: "1", limit: "10" }).items[0].id);
});

test("handler de Vercel /api/gym no 404", () => {
  const handler = require("../api/gym.js");
  let status = 0;
  let body = "";
  const res = {
    setHeader() {},
    end(chunk) { body = chunk; },
  };
  Object.defineProperty(res, "statusCode", {
    set(v) { status = v; },
    get() { return status; },
  });
  handler({ url: "/api/gym?catalog=1&limit=48&grupo=waist" }, res);
  assert.strictEqual(status, 200);
  const data = JSON.parse(body);
  assert.strictEqual(data.items.length, 48);
  data.items.forEach((e) => assert.strictEqual(e.grupo, "waist"));
});

(async () => {
  GymCatalog.setCatalog([]);
  global.fetch = async (url) => {
    const u = String(url);
    if (u.indexOf("gym_exercises.json") >= 0) {
      return { ok: true, json: async () => all };
    }
    return { ok: false, status: 404 };
  };
  const items = await GymCatalog.loadAll();
  assert.strictEqual(items.length, 1324);
  const page = await GymCatalog.fetchGym({ catalog: "1", limit: "48" });
  assert.strictEqual(page.items.length, 48);
  assert.strictEqual(page.count, 1324);
  passed += 1;
  console.log("ok  loadAll usa el JSON estático aunque /api/gym dé 404");
  console.log(passed + " tests");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
