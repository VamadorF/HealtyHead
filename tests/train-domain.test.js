"use strict";
const assert = require("assert");
const path = require("path");
const Train = require(path.join(__dirname, "..", "assets/js/train-domain.js"));

function fresh() {
  Train.useStorage(Train.memoryStorage());
  Train.resetState();
  return Train.getState();
}

function set(weight, reps, extra) {
  return Object.assign({ weight: weight, reps: reps, completed: true }, extra || {});
}

let passed = 0;
function test(name, fn) {
  fresh();
  fn();
  passed += 1;
  console.log("ok  " + name);
}

test("1RM Epley y tope de 12 reps", () => {
  assert.strictEqual(Train.epley1RM(100, 1), 100);
  assert.ok(Math.abs(Train.epley1RM(100, 5) - (100 * (1 + 5 / 30))) < 1e-9);
  assert.strictEqual(Train.epley1RM(100, 13), null);
  assert.strictEqual(Train.epley1RM(100, 12) != null, true);
  assert.strictEqual(Train.epley1RM(0, 5), null);
});

test("mejor set elegible nombra el set y ignora >12", () => {
  const sets = [
    set(80, 10, { date: "2026-08-01" }),
    set(100, 15, { date: "2026-08-02" }),
    set(90, 5, { date: "2026-08-03" }),
  ];
  const best = Train.bestEligibleSet(sets);
  assert.ok(best);
  assert.ok(best.label.indexOf("10 × 80") >= 0);
  assert.ok(best.estimate > Train.epley1RM(90, 5));
  assert.ok(Train.epley1RM(100, 15) == null);
});

test("reps fallidas nunca suben la carga (lineal)", () => {
  const item = { exerciseId: "ex1", targetReps: 8, targetSets: 3, isBodyweight: false, logType: "reps" };
  const last = { date: "2026-08-10", sets: [set(80, 8), set(80, 6), set(80, 5)] };
  const out = Train.progressLinear({
    item, last, logs: [last],
    rule: { type: "linear", increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(out.weight, 80);
  assert.ok(out.reason.toLowerCase().indexOf("fallid") >= 0 || out.reason.indexOf("no llegaste") >= 0);
});

test("lineal sube peso si se completa y deload a 2 stalls", () => {
  const item = { exerciseId: "ex1", targetReps: 8, targetSets: 3, logType: "reps" };
  const ok = { date: "2026-08-10", sets: [set(80, 8), set(80, 8), set(80, 8)] };
  const up = Train.progressLinear({
    item, last: ok, logs: [ok],
    rule: { increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(up.weight, 82.5);

  const fail = { date: "2026-08-20", sets: [set(80, 5), set(80, 5), set(80, 4)] };
  const stall = Train.progressLinear({
    item, last: fail, logs: [fail, fail],
    rule: { increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(stall.weight, 72);
  assert.ok(stall.reason.indexOf("10%") >= 0);
});

test("Greyskull: AMRAP alto = salto doble; 2 fallos = reset 10%", () => {
  const item = { exerciseId: "sq", targetReps: 5, targetSets: 3, logType: "reps" };
  const big = { date: "2026-08-01", sets: [set(100, 5), set(100, 5), set(100, 12)] };
  const jump = Train.progressGSLP({
    item, last: big, logs: [big],
    rule: { increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(jump.weight, 105);
  assert.ok(jump.reason.indexOf("doble") >= 0);

  const miss = { date: "2026-08-08", sets: [set(100, 5), set(100, 5), set(100, 3)] };
  const reset = Train.progressGSLP({
    item, last: miss, logs: [miss, miss],
    rule: { increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(reset.weight, 90);
});

test("doble progresión sube reps y luego peso; per-side avanza de 2 en 2", () => {
  const item = { exerciseId: "lunge", targetReps: 8, targetSets: 3, perSide: true, lastTargetReps: 8, logType: "reps" };
  const last = { date: "2026-08-01", sets: [set(20, 8), set(20, 8), set(20, 8)] };
  const out = Train.progressDouble({
    item, last, logs: [last],
    rule: { minReps: 8, maxReps: 12, increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(out.reps, 10);
  assert.strictEqual(out.weight, 20);

  const top = { date: "2026-08-10", sets: [set(20, 12), set(20, 12), set(20, 12)] };
  item.lastTargetReps = 12;
  const up = Train.progressDouble({
    item, last: top, logs: [top],
    rule: { minReps: 8, maxReps: 12, increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(up.weight, 22.5);
  assert.strictEqual(up.reps, 8);
});

test("añadir tiempo: fallo no alarga; éxito suma segundos", () => {
  const item = { exerciseId: "plank", targetTime: 30, targetSets: 3, logType: "timed" };
  const fail = { date: "2026-08-01", sets: [{ timeSec: 20, completed: true }, { timeSec: 18, completed: true }] };
  const stay = Train.progressTime({
    item, last: fail, logs: [fail],
    rule: { timeIncrement: 5 },
    settings: {},
  });
  assert.strictEqual(stay.timeSec, 30);

  const ok = { date: "2026-08-02", sets: [{ timeSec: 30, completed: true }, { timeSec: 32, completed: true }] };
  const up = Train.progressTime({
    item, last: ok, logs: [ok],
    rule: { timeIncrement: 5 },
    settings: {},
  });
  assert.strictEqual(up.timeSec, 35);
});

test("peso corporal: reps, techo añade serie, luego consejo de lastre", () => {
  const settings = { bwRepCeiling: 12, bwMaxSets: 3, defaultIncrement: 2.5 };
  const item = { exerciseId: "pu", targetReps: 10, targetSets: 3, isBodyweight: true, logType: "reps" };
  const last = { date: "2026-08-01", sets: [set(0, 10), set(0, 10), set(0, 10)] };
  item.lastTargetReps = 10;
  const up = Train.progressBodyweight({ item, last, logs: [last], rule: {}, settings });
  assert.strictEqual(up.reps, 11);
  assert.strictEqual(up.weight, 0);

  item.lastTargetReps = 12;
  const atCeil = { date: "2026-08-02", sets: [set(0, 12), set(0, 12)] };
  const extra = Train.progressBodyweight({
    item: Object.assign({}, item, { targetSets: 2 }),
    last: atCeil, logs: [atCeil], rule: {}, settings,
  });
  assert.strictEqual(extra.sets, 3);
  assert.ok(extra.reason.indexOf("serie") >= 0);

  const full = { date: "2026-08-03", sets: [set(0, 12), set(0, 12), set(0, 12)] };
  const advise = Train.progressBodyweight({
    item: Object.assign({}, item, { lastTargetReps: 12, targetSets: 3 }),
    last: full, logs: [full], rule: {}, settings,
  });
  assert.strictEqual(advise.suggestLoad, true);
});

test("cinturón de lastre vuelve a progresión por peso", () => {
  const item = { exerciseId: "dip", targetReps: 8, targetSets: 3, isBodyweight: true, dipBelt: true, logType: "reps" };
  const last = { date: "2026-08-01", sets: [set(10, 8), set(10, 8), set(10, 8)] };
  const s = Train.getState();
  s.workouts.push({
    id: "w1", date: "2026-08-01", items: [{ exerciseId: "dip", dipBelt: true, sets: last.sets }],
  });
  const routine = { progression: { type: "linear", increment: 2.5 } };
  const t = Train.computeTarget(item, routine, s.workouts, s.settings);
  assert.strictEqual(t.weight, 12.5);
});

test("esfuerzo RIR/RPE no altera 1RM ni progresión", () => {
  const a = Train.epley1RM(100, 5);
  const b = Train.epley1RM(100, 5);
  assert.strictEqual(a, b);
  const item = { exerciseId: "bp", targetReps: 5, targetSets: 3, logType: "reps" };
  const last = { date: "2026-08-01", sets: [set(100, 5, { effort: 9, effortScale: "rpe" }), set(100, 5), set(100, 5)] };
  const out = Train.progressLinear({
    item, last, logs: [last],
    rule: { increment: 2.5 },
    settings: { defaultIncrement: 2.5 },
  });
  assert.strictEqual(out.weight, 102.5);
});

test("clasificación: timed, per-side, cardio, bodyweight, belt", () => {
  assert.strictEqual(Train.classifyExercise({ name: "Front plank with twist", equipo: "body weight", grupo: "waist" }).logType, "timed");
  assert.strictEqual(Train.classifyExercise({ name: "dumbbell single arm overhead carry", equipo: "dumbbell" }).logType, "timed");
  assert.strictEqual(Train.classifyExercise({ name: "hanging leg raise", equipo: "body weight", grupo: "waist" }).logType, "reps");
  assert.strictEqual(Train.classifyExercise({ name: "barbell lunge", equipo: "barbell", grupo: "upper legs" }).perSide, true);
  assert.strictEqual(Train.classifyExercise({ name: "run", equipo: "body weight", grupo: "cardio" }).logType, "cardio");
  assert.strictEqual(Train.classifyExercise({ name: "push-up", equipo: "body weight", grupo: "chest" }).isBodyweight, true);
  assert.strictEqual(Train.canUseBelt("weighted dip"), true);
});

test("reprogramar un día no toca el plan semanal base", () => {
  const r = Train.upsertRoutine({ name: "Push" });
  Train.assignDay("tue", r.id);
  const baseBefore = Train.getState().weeklyPlan.tue;
  Train.reschedule("2026-08-25", "2026-08-26");
  assert.strictEqual(Train.getState().weeklyPlan.tue, baseBefore);
  assert.strictEqual(Train.scheduledRoutineId("2026-08-26"), r.id);
  assert.strictEqual(Train.scheduledRoutineId("2026-08-25"), null);
  assert.strictEqual(Train.getState().weeklyPlan.wed, null);
});

test("import merge nunca sobrescribe plan existente", () => {
  const keep = Train.upsertRoutine({ name: "La mía" });
  Train.assignDay("mon", keep.id);
  const incoming = Train.upsertRoutine({ name: "Ajena" });
  const payload = {
    type: Train.PLAN_EXPORT_TYPE,
    weeklyPlan: { mon: incoming.id, wed: incoming.id },
    routines: [{ id: incoming.id, name: "Ajena", items: [], progression: { type: "linear" } }],
    customExercises: [{ id: "cx1", name: "Face pull casero", bodyPart: "delts", target: "delts" }],
  };
  Train.deleteRoutine(incoming.id);
  const added = Train.mergePlan(payload);
  assert.strictEqual(Train.getState().weeklyPlan.mon, keep.id);
  assert.ok(Train.getState().weeklyPlan.wed);
  assert.ok(added.custom >= 1);
  const exported = Train.exportPlan();
  assert.ok(!exported.workouts);
  assert.ok(!exported.weighIns);
});

test("filtros de equipo adaptativos: toda combinación tiene resultados", () => {
  const catalog = [
    { id: "1", name: "Press banca", equipo: "barbell", grupo: "chest" },
    { id: "2", name: "Aperturas", equipo: "dumbbell", grupo: "chest" },
    { id: "3", name: "Dominada", equipo: "body weight", grupo: "back" },
  ];
  const opts = Train.equipmentOptions(catalog, ["barbell"], { grupo: "chest" });
  assert.strictEqual(opts.items.length, 1);
  assert.ok(opts.equipment.every((e) => e.count > 0));
  assert.strictEqual(opts.equipment.some((e) => e.id === "body weight"), false);
});

test("gráfico de peso: tono según acercarse o alejarse del objetivo", () => {
  assert.strictEqual(Train.weighInTowardGoal(80, 79, 75), "toward");
  assert.strictEqual(Train.weighInTowardGoal(80, 81, 75), "away");
  assert.strictEqual(Train.weighInTowardGoal(70, 71, 75), "toward");
  assert.strictEqual(Train.weighInTowardGoal(70, 69, 75), "away");
  assert.strictEqual(Train.weighInTowardGoal(80, 79, null), "neutral");
  const segs = Train.chartSegments([
    { date: "2026-08-01", kg: 80 },
    { date: "2026-08-08", kg: 79 },
    { date: "2026-08-15", kg: 80.5 },
  ], 75);
  assert.strictEqual(segs[0].tone, "toward");
  assert.strictEqual(segs[1].tone, "away");
});

test("PR detecta mejor 1RM y no usa sets de 15 reps", () => {
  const s = Train.getState();
  s.workouts.push({
    id: "w", date: "2026-08-01",
    items: [{ exerciseId: "bp", logType: "reps", sets: [set(100, 5)] }],
  });
  const pr = Train.detectPR("bp", { weight: 110, reps: 3 }, s.workouts, "reps");
  assert.ok(pr);
  const no = Train.detectPR("bp", { weight: 60, reps: 15 }, s.workouts, "reps");
  assert.strictEqual(no, null);
});

test("ejercicio custom exige nombre y parte del cuerpo", () => {
  assert.throws(() => Train.addCustomExercise({ name: "X" }));
  const ex = Train.addCustomExercise({ name: "Remo toalla", bodyPart: "lats", description: "En casa" });
  assert.strictEqual(ex.custom, true);
  assert.ok(Train.findExercise(ex.id, []));
});

test("heatmap cuenta minutos por día", () => {
  const s = Train.getState();
  s.workouts.push({ id: "a", date: "2026-08-23", durationSec: 3600, items: [] });
  const hm = Train.heatmap(2026);
  const cell = hm.cells.find((c) => c.date === "2026-08-23");
  assert.strictEqual(cell.minutes, 60);
  assert.ok(hm.maxMinutes >= 60);
});

test("mapa muscular nombra músculos no entrenados", () => {
  const catalog = [{ id: "bp", name: "Bench", target: "pectorals", grupo: "chest", sec: ["triceps"] }];
  const workouts = [{
    date: "2026-08-23",
    items: [{ exerciseId: "bp", logType: "reps", sets: [set(80, 8)] }],
  }];
  const work = Train.muscleWork(workouts, catalog, "2026-08-01", "2026-08-31");
  assert.ok(work.scores.pectorals > 0);
  assert.ok(work.unused.indexOf("Isquiotibiales") >= 0);
});

test("sesión guiada pide peso, rellena último peso y detecta vacío", () => {
  const catalog = [{ id: "sq", name: "Sentadilla", equipo: "barbell", grupo: "upper legs", target: "quads", gif: "x.gif" }];
  const r = Train.upsertRoutine({
    name: "Piernas",
    progression: { type: "linear", increment: 2.5 },
    items: [Train.makeRoutineItem(catalog[0])],
  });
  Train.assignDay(Train.weekdayKey("2026-08-24"), r.id);
  Train.getState().workouts.push({
    id: "prev", date: "2026-08-17",
    items: [{ exerciseId: "sq", logType: "reps", sets: [set(60, 8), set(60, 8), set(60, 8)] }],
  });
  const ses = Train.startSession("2026-08-24", catalog);
  assert.strictEqual(ses.bodyWeightAsked, false);
  assert.ok(ses.items.length === 1);
  assert.strictEqual(ses.items[0].target.weight, 62.5);
  assert.ok(ses.items[0].target.reason);
  const empty = Train.startSession("2026-08-25", catalog);
  assert.strictEqual(empty.items.length, 0);
});

test("terminar sesión recuerda el objetivo: doble progresión y tiempo suben de verdad", () => {
  const catalog = [
    { id: "lg", name: "barbell lunge", equipo: "barbell", grupo: "upper legs", target: "quads" },
    { id: "pl", name: "front plank", equipo: "body weight", grupo: "waist", target: "abs" },
  ];
  const lunge = Train.makeRoutineItem(catalog[0], { targetReps: 8, targetSets: 3 });
  const plank = Train.makeRoutineItem(catalog[1], { targetTime: 30, targetSets: 2 });
  const r = Train.upsertRoutine({
    name: "Mix",
    progression: { type: "double", increment: 2.5, minReps: 8, maxReps: 12, timeIncrement: 5 },
    items: [lunge, plank],
  });
  Train.assignDay("mon", r.id);
  const ses1 = Train.startSession("2026-08-24", catalog);
  ses1.items[0].sets.forEach((st) => { st.weight = 20; st.reps = 8; st.completed = true; });
  ses1.items[1].sets.forEach((st) => { st.timeSec = 30; st.completed = true; });
  Train.finishSession();
  const stored = Train.getRoutine(r.id);
  assert.strictEqual(stored.items[0].lastTargetReps, 8);
  assert.strictEqual(stored.items[1].lastTargetTime, 30);
  const ses2 = Train.startSession("2026-08-31", catalog);
  assert.strictEqual(ses2.items[0].target.reps, 10);
  assert.strictEqual(ses2.items[1].target.timeSec, 35);
});

test("plantilla full body no se duplica al aplicarla dos veces", () => {
  const catalog = [
    { id: "0043", name: "barbell full squat", equipo: "barbell", grupo: "upper legs", target: "quads" },
    { id: "0025", name: "barbell bench press", equipo: "barbell", grupo: "chest", target: "pectorals" },
    { id: "0662", name: "push-up", equipo: "body weight", grupo: "chest", target: "pectorals" },
    { id: "2135", name: "weighted front plank", equipo: "weighted", grupo: "waist", target: "abs" },
    { id: "0032", name: "barbell deadlift", equipo: "barbell", grupo: "back", target: "glutes" },
    { id: "0027", name: "barbell bent over row", equipo: "barbell", grupo: "back", target: "lats" },
    { id: "0652", name: "pull-up", equipo: "body weight", grupo: "back", target: "lats" },
    { id: "0054", name: "barbell lunge", equipo: "barbell", grupo: "upper legs", target: "quads" },
  ];
  Train.applyTemplate("fullbody", catalog);
  Train.applyTemplate("fullbody", catalog);
  const named = Train.getState().routines.filter((r) => r.name === "Full body A" || r.name === "Full body B");
  assert.strictEqual(named.length, 2);
});

test("excepciones de más de 8 semanas se podan", () => {
  const r = Train.upsertRoutine({ name: "Push" });
  const now = new Date();
  const old = new Date(now);
  old.setDate(old.getDate() - 70);
  const recent = new Date(now);
  recent.setDate(recent.getDate() - 10);
  const oldIso = Train.todayISO(old);
  const recentIso = Train.todayISO(recent);
  Train.getState().overrides[oldIso] = { routineId: r.id };
  Train.getState().overrides[recentIso] = { routineId: r.id };
  Train.save();
  assert.strictEqual(Train.getState().overrides[oldIso], undefined);
  assert.ok(Train.getState().overrides[recentIso]);
});

test("merge remapea id colisionante si el nombre es distinto", () => {
  const keep = Train.upsertRoutine({ name: "La mía" });
  const payload = {
    type: Train.PLAN_EXPORT_TYPE,
    weeklyPlan: { wed: keep.id },
    routines: [{ id: keep.id, name: "Ajena distinta", items: [], progression: { type: "linear" } }],
    customExercises: [],
  };
  const added = Train.mergePlan(payload);
  assert.strictEqual(added.routines, 1);
  assert.strictEqual(Train.getState().routines.filter((x) => x.id === keep.id).length, 1);
  assert.ok(Train.getState().routines.some((x) => x.name === "Ajena distinta" && x.id !== keep.id));
  assert.ok(Train.getState().weeklyPlan.wed);
  assert.notStrictEqual(Train.getState().weeklyPlan.wed, keep.id);
});

test("per-side: total par y etiqueta por lado", () => {
  assert.strictEqual(Train.applyPerSide(7, true), 8);
  assert.strictEqual(Train.nextEven(9), 10);
});

test("plantilla full body rellena huecos del plan y crea superserie", () => {
  const catalog = [
    { id: "0043", name: "barbell full squat", equipo: "barbell", grupo: "upper legs", target: "quads" },
    { id: "0025", name: "barbell bench press", equipo: "barbell", grupo: "chest", target: "pectorals" },
    { id: "0662", name: "push-up", equipo: "body weight", grupo: "chest", target: "pectorals" },
    { id: "2135", name: "weighted front plank", equipo: "weighted", grupo: "waist", target: "abs" },
    { id: "0032", name: "barbell deadlift", equipo: "barbell", grupo: "back", target: "glutes" },
    { id: "0027", name: "barbell bent over row", equipo: "barbell", grupo: "back", target: "lats" },
    { id: "0652", name: "pull-up", equipo: "body weight", grupo: "back", target: "lats" },
    { id: "0054", name: "barbell lunge", equipo: "barbell", grupo: "upper legs", target: "quads" },
  ];
  Train.applyTemplate("fullbody", catalog);
  const s = Train.getState();
  assert.ok(s.weeklyPlan.mon);
  assert.ok(s.weeklyPlan.wed);
  const a = Train.getRoutine(s.weeklyPlan.mon);
  assert.ok(a.items.length >= 4);
  assert.ok(a.items.some((it) => it.logType === "timed"));
  assert.ok(a.items.some((it) => it.supersetGroup));
  const lunge = Train.getRoutine(s.weeklyPlan.wed).items.find((it) => it.exerciseId === "0054");
  assert.strictEqual(lunge.perSide, true);
});

console.log("\n" + passed + " tests ok");
