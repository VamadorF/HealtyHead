"use strict";
/**
 * Smoke de vistas: carga el dominio + UI con un DOM mínimo
 * y comprueba que cada pantalla produce HTML usable.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const http = require("http");

const memory = { d: {} };
const localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memory.d, k) ? memory.d[k] : null),
  setItem: (k, v) => { memory.d[k] = String(v); },
  removeItem: (k) => { delete memory.d[k]; },
};

const created = [];
const document = {
  documentElement: { dataset: {} },
  body: { appendChild() {}, addEventListener() {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => {
    const el = {
      tagName: tag,
      style: {},
      className: "",
      innerHTML: "",
      textContent: "",
      value: "",
      files: null,
      onclick: null,
      appendChild() {},
      addEventListener() {},
      remove() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      setAttribute() {},
      getAttribute() { return null; },
      focus() {},
      setSelectionRange() {},
    };
    created.push(el);
    return el;
  },
  addEventListener() {},
};
const location = { hash: "#/entrenar", href: "http://127.0.0.1:8899/#/entrenar" };
const window = {
  localStorage,
  location,
  addEventListener() {},
  open: () => ({ document: { write() {}, close() {} }, focus() {}, print() {} }),
};
const sandbox = {
  console,
  window,
  document,
  localStorage,
  location,
  navigator: {},
  Train: undefined,
  TrainUI: undefined,
  module: { exports: {} },
  exports: {},
  globalThis: null,
};
sandbox.globalThis = sandbox;
sandbox.root = sandbox;
vm.createContext(sandbox);

const domainSrc = fs.readFileSync(path.join(__dirname, "../assets/js/train-domain.js"), "utf8");
vm.runInContext(domainSrc, sandbox);
const bodiesSrc = fs.readFileSync(path.join(__dirname, "../assets/vendor/musclemap/bodies.js"), "utf8");
vm.runInContext(bodiesSrc, sandbox);
const mapSrc = fs.readFileSync(path.join(__dirname, "../assets/js/muscle-map.js"), "utf8");
vm.runInContext(mapSrc, sandbox);
const uiSrc = fs.readFileSync(path.join(__dirname, "../assets/js/train-ui.js"), "utf8");
vm.runInContext(uiSrc, sandbox);

const Train = sandbox.Train;
const TrainUI = sandbox.TrainUI;
assert.ok(Train && TrainUI, "Train y TrainUI deben existir");

Train.useStorage(Train.memoryStorage());
Train.resetState();

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let b = "";
      res.on("data", (c) => { b += c; });
      res.on("end", () => {
        if (res.statusCode >= 400) reject(new Error("HTTP " + res.statusCode));
        else resolve(b);
      });
    }).on("error", reject);
  });
}

(async () => {
  const raw = await get("http://127.0.0.1:8899/api/gym?catalog=1&limit=1400");
  const data = JSON.parse(raw);
  assert.strictEqual(data.count, 1324);
  assert.ok(data.items.length >= 1300);

  sandbox.TrainUI; // loaded
  // inject catalog via applyTemplate / startSession using fetched items
  Train.applyTemplate("fullbody", data.items);
  const s = Train.getState();
  assert.ok(s.routines[0].items.length >= 3);

  const screens = [
    [],
    ["plan"],
    ["rutina", s.routines[0].id],
    ["sesion"],
    ["peso"],
    ["stats"],
    ["biblioteca"],
    ["compartir"],
    ["ajustes"],
    ["progreso"],
    ["mas"],
  ];
  screens.forEach((parts) => {
    const html = TrainUI.render(parts);
    assert.ok(html && html.length > 80, "vista vacía " + parts.join("/"));
    assert.ok(html.indexOf("undefined") < 0, "undefined leak en " + parts.join("/"));
    assert.ok(!/\[object Object\]/.test(html), "object leak en " + parts.join("/"));
  });

  const dash = TrainUI.render([]);
  assert.ok(dash.indexOf("Hoy") >= 0);
  assert.ok(dash.indexOf("Empezar sesión") >= 0 || dash.indexOf("Sesión") >= 0);

  const plan = TrainUI.render(["plan"]);
  assert.ok(plan.indexOf("Plan semanal") >= 0);
  assert.ok(plan.indexOf('type="date"') >= 0);

  Train.addWeighIn(80, "2026-08-01");
  Train.addWeighIn(79, "2026-08-10");
  Train.updateSettings({ bodyWeightGoal: 75 });
  const peso = TrainUI.render(["peso"]);
  assert.ok(peso.indexOf("Objetivo") >= 0);
  assert.ok(peso.indexOf("<svg") >= 0);

  const stats = TrainUI.render(["stats"]);
  assert.ok(stats.indexOf("1RM") >= 0);
  assert.ok(stats.indexOf("Mapa muscular") >= 0);
  assert.ok(stats.indexOf("tr-heat") >= 0);
  assert.ok(stats.indexOf("tr-mm") >= 0);
  assert.ok(stats.indexOf("male-front.webp") >= 0 || stats.indexOf("female-front.webp") >= 0);

  const prog = TrainUI.render(["progreso"]);
  assert.ok(prog.indexOf("Mapa muscular") >= 0);
  assert.ok(prog.indexOf("tr-mm") >= 0);

  const share = TrainUI.render(["compartir"]);
  assert.ok(share.indexOf("healthyhead-plan") >= 0 || share.indexOf("weeklyPlan") >= 0);
  assert.ok(share.indexOf("workouts") < 0);

  const lib = TrainUI.render(["biblioteca"]);
  assert.ok(lib.indexOf("Biblioteca") >= 0);

  const settings = TrainUI.render(["ajustes"]);
  assert.ok(settings.indexOf("pantalla despierta") >= 0);
  assert.ok(settings.indexOf("RIR") >= 0 && settings.indexOf("RPE") >= 0);

  const week = Train.weekDates();
  const planned = week.find((d) => d.routineId) || week[0];
  const ses = Train.startSession(planned.iso, data.items);
  assert.ok(ses.items.length >= 1, "sesión del " + planned.iso + " vacía");
  assert.ok(ses.items[0].target.reason);
  const sesHtml = TrainUI.render(["sesion"]);
  assert.ok(sesHtml.indexOf("Registrar") >= 0);
  assert.ok(sesHtml.indexOf("Peso de hoy") >= 0);

  const plank = data.items.find((e) => e.name === "weighted front plank");
  assert.ok(plank);
  assert.strictEqual(Train.classifyExercise(plank).logType, "timed");
  const lunge = data.items.find((e) => e.id === "0054");
  assert.strictEqual(Train.classifyExercise(lunge).perSide, true);
  const push = data.items.find((e) => e.id === "0662");
  assert.strictEqual(Train.classifyExercise(push).isBodyweight, true);
  const run = data.items.find((e) => e.id === "0685");
  assert.strictEqual(Train.classifyExercise(run).logType, "cardio");

  const bw = data.items.filter((e) => e.equipo === "body weight");
  assert.ok(bw.length >= 300, "se esperaban ~325 ejercicios de peso corporal, hay " + bw.length);

  console.log("ui smoke ok ·", data.count, "ejercicios ·", screens.length, "vistas");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
