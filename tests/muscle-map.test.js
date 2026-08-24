"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../assets/vendor/musclemap/bodies.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../assets/js/muscle-map.js"), "utf8"), sandbox);

const Bodies = sandbox.MuscleMapBodies;
const View = sandbox.MuscleMapView;
assert.ok(Bodies && View);

const mf = Bodies.get("male", "front");
const mb = Bodies.get("male", "back");
const ff = Bodies.get("female", "front");
const fb = Bodies.get("female", "back");
assert.ok(mf.muscles.length > 20);
assert.ok(mb.muscles.length > 20);
assert.ok(ff.muscles.length > 20);
assert.ok(fb.muscles.length > 20);
assert.ok(mf.muscles.some((m) => m.group === "CHEST"));
assert.ok(mb.muscles.some((m) => m.group === "LATS"));
assert.ok(mb.muscles.some((m) => m.group === "GLUTES"));

assert.strictEqual(View.OUR_TO_CHART.pectorals[0], "CHEST");
assert.ok(View.OUR_TO_CHART.delts.indexOf("SHOULDERS_FRONT") >= 0);

const grouped = View.groupScores({ scores: { pectorals: 80, quads: 20, cardio: 999 } });
assert.strictEqual(grouped.CHEST, 80);
assert.strictEqual(grouped.QUADS, 20);
assert.strictEqual(grouped.LATS, undefined);

const html = View.mapsHTML({ scores: { pectorals: 80, lats: 40 }, max: 80 }, "male");
assert.ok(html.indexOf("<svg") >= 0);
assert.ok(html.indexOf("male-front.webp") >= 0);
assert.ok(html.indexOf("male-back.webp") >= 0);
assert.ok(html.indexOf("Pectorales") >= 0);

const htmlF = View.mapsHTML({ scores: { glutes: 10 }, max: 10 }, "female");
assert.ok(htmlF.indexOf("female-back.webp") >= 0);

console.log("ok  muscle-map ·", mf.muscles.length, "paths frente ·", mb.muscles.length, "espalda");
