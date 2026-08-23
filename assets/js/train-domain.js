/* ============================================================
   HEALTHYHEAD — Motor de entrenamiento
   Dominio puro: persistencia, progresión, 1RM, plan, merge.
   Funciona en navegador y en Node (tests).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Train = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY = "hh-train-v1";
  const PLAN_EXPORT_TYPE = "healthyhead-plan";
  const PLAN_EXPORT_VERSION = 1;

  const DAYS = [
    { js: 1, key: "mon", name: "Lunes" },
    { js: 2, key: "tue", name: "Martes" },
    { js: 3, key: "wed", name: "Miércoles" },
    { js: 4, key: "thu", name: "Jueves" },
    { js: 5, key: "fri", name: "Viernes" },
    { js: 6, key: "sat", name: "Sábado" },
    { js: 0, key: "sun", name: "Domingo" },
  ];

  const MUSCLES = [
    { id: "pectorals", es: "Pectorales", side: "front" },
    { id: "delts", es: "Deltoides", side: "both" },
    { id: "biceps", es: "Bíceps", side: "front" },
    { id: "triceps", es: "Tríceps", side: "back" },
    { id: "abs", es: "Abdomen", side: "front" },
    { id: "obliques", es: "Oblicuos", side: "front" },
    { id: "lats", es: "Dorsales", side: "back" },
    { id: "upper-back", es: "Espalda alta", side: "back" },
    { id: "lower-back", es: "Zona lumbar", side: "back" },
    { id: "traps", es: "Trapecio", side: "back" },
    { id: "forearms", es: "Antebrazos", side: "both" },
    { id: "quads", es: "Cuádriceps", side: "front" },
    { id: "hamstrings", es: "Isquiotibiales", side: "back" },
    { id: "glutes", es: "Glúteos", side: "back" },
    { id: "calves", es: "Gemelos", side: "back" },
    { id: "adductors", es: "Aductores", side: "front" },
    { id: "abductors", es: "Abductores", side: "both" },
    { id: "hip-flexors", es: "Flexores de cadera", side: "front" },
    { id: "neck", es: "Cuello", side: "both" },
    { id: "cardio", es: "Sistema cardiovascular", side: "front" },
  ];

  const MUSCLE_ALIASES = {
    pectorals: "pectorals", pectoralis: "pectorals", chest: "pectorals",
    delts: "delts", deltoids: "delts", shoulders: "delts",
    biceps: "biceps", brachialis: "biceps",
    triceps: "triceps",
    abs: "abs", "rectus abdominis": "abs", waist: "abs",
    obliques: "obliques",
    lats: "lats",
    "upper back": "upper-back", back: "upper-back",
    "lower back": "lower-back", spine: "lower-back",
    traps: "traps", trapezius: "traps",
    forearms: "forearms", "lower arms": "forearms",
    "wrist flexors": "forearms", "wrist extensors": "forearms",
    brachioradialis: "forearms",
    quads: "quads", quadriceps: "quads", "upper legs": "quads",
    hamstrings: "hamstrings",
    glutes: "glutes", "gluteus maximus": "glutes",
    calves: "calves", soleus: "calves", "lower legs": "calves",
    adductors: "adductors", abductors: "abductors",
    "hip flexors": "hip-flexors",
    neck: "neck", "levator scapulae": "neck",
    "cardiovascular system": "cardio", cardio: "cardio",
    "serratus anterior": "pectorals",
  };

  const EQUIPMENT_ES = {
    "body weight": "Peso corporal", dumbbell: "Mancuerna", cable: "Polea", barbell: "Barra",
    "leverage machine": "Máquina", band: "Banda elástica", "smith machine": "Máquina Smith",
    kettlebell: "Pesa rusa", weighted: "Con peso", "stability ball": "Fitball",
    "ez barbell": "Barra Z", assisted: "Asistido", "medicine ball": "Balón medicinal",
    "resistance band": "Banda elástica", rope: "Cuerda", roller: "Rodillo",
    "olympic barbell": "Barra olímpica", "elliptical machine": "Elíptica",
    "stationary bike": "Bici estática", "sled machine": "Trineo",
    "upper body ergometer": "Ergómetro", tire: "Neumático", hammer: "Martillo",
    "bosu ball": "Bosu", "wheel roller": "Rueda abdominal", "trap bar": "Barra hexagonal",
    "skierg machine": "SkiErg", "stepmill machine": "Escaladora",
  };

  const GROUP_ES = {
    chest: "Pecho", back: "Espalda", "upper legs": "Piernas", "upper arms": "Brazos",
    shoulders: "Hombros", waist: "Core", "lower legs": "Pantorrillas",
    "lower arms": "Antebrazos", cardio: "Cardio", neck: "Cuello",
  };

  const PROGRESSION_TYPES = {
    linear: { name: "Lineal", desc: "Si completas todas las series al objetivo, sube el peso. Los fallos no suben carga; dos estancamientos disparan una descarga del 10%." },
    gslp: { name: "Greyskull LP", desc: "La última serie es AMRAP. Un top set alto da salto doble; fallar dos veces resetea un 10%." },
    double: { name: "Doble progresión", desc: "Sube repeticiones dentro de un rango. Al llegar al techo, sube el peso y vuelve al suelo del rango." },
    time: { name: "Añadir tiempo", desc: "Si sostienes el objetivo, suma segundos. Fallar no alarga el objetivo; dos estancamientos recortan el tiempo." },
  };

  function memoryStorage() {
    const d = {};
    return {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null),
      setItem: (k, v) => { d[k] = String(v); },
      removeItem: (k) => { delete d[k]; },
    };
  }

  let storage = typeof localStorage !== "undefined" ? localStorage : memoryStorage();
  let state = null;

  function useStorage(s) { storage = s || memoryStorage(); state = null; }

  function uid(prefix) {
    const rnd = Math.random().toString(36).slice(2, 10);
    const t = Date.now().toString(36);
    return (prefix || "t") + rnd + t;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function todayISO(d) {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + "-" + pad2(x.getMonth() + 1) + "-" + pad2(x.getDate());
  }

  function parseISO(iso) {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function weekdayKey(isoOrDate) {
    const d = typeof isoOrDate === "string" ? parseISO(isoOrDate) : new Date(isoOrDate);
    const found = DAYS.find((x) => x.js === d.getDay());
    return found ? found.key : "mon";
  }

  function formatDateES(iso) {
    if (!iso) return "";
    const d = parseISO(iso);
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return d.getDate() + " " + months[d.getMonth()];
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function defaultState() {
    return {
      version: 1,
      settings: {
        wakeLock: true,
        effortScale: "off",
        bodyFigure: "male",
        equipment: [],
        bodyWeightGoal: null,
        bwRepCeiling: 15,
        bwMaxSets: 5,
        defaultIncrement: 2.5,
        defaultRest: 90,
      },
      weighIns: [],
      customExercises: [],
      weeklyPlan: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
      overrides: {},
      routines: [],
      workouts: [],
      activeSession: null,
    };
  }

  function normalizeState(raw) {
    const base = defaultState();
    if (!raw || typeof raw !== "object") return base;
    const s = Object.assign(base, raw);
    s.settings = Object.assign(defaultState().settings, raw.settings || {});
    s.weighIns = Array.isArray(raw.weighIns) ? raw.weighIns : [];
    s.customExercises = Array.isArray(raw.customExercises) ? raw.customExercises : [];
    s.weeklyPlan = Object.assign(defaultState().weeklyPlan, raw.weeklyPlan || {});
    s.overrides = raw.overrides && typeof raw.overrides === "object" ? raw.overrides : {};
    s.routines = Array.isArray(raw.routines) ? raw.routines : [];
    s.workouts = Array.isArray(raw.workouts) ? raw.workouts : [];
    s.activeSession = raw.activeSession || null;
    return s;
  }

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      state = normalizeState(raw ? JSON.parse(raw) : null);
    } catch (e) {
      state = defaultState();
    }
    return state;
  }

  function save() {
    if (!state) state = defaultState();
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function getState() {
    if (!state) load();
    return state;
  }

  function resetState() {
    state = defaultState();
    save();
    return state;
  }

  function updateSettings(patch) {
    const s = getState();
    Object.assign(s.settings, patch || {});
    save();
    return s.settings;
  }

  function isTimedName(name) {
    const n = String(name || "").toLowerCase();
    if (/\b(plank|wall sit|wall-sit)\b/.test(n)) return true;
    if (/\b(farmer|suitcase|loaded)\b.*\b(carry|walk)\b/.test(n)) return true;
    if (/\b(carry|walk)\b/.test(n) && /\b(farmer|suitcase|overhead|loaded)\b/.test(n)) return true;
    if (/\bsingle arm overhead carry\b/.test(n)) return true;
    if (/\b(dead hang|active hang|flexed[- ]arm hang)\b/.test(n)) return true;
    return false;
  }

  function isPerSideName(name) {
    const n = String(name || "").toLowerCase();
    return /\b(lunge|split squat|bulgarian|pistol|single[- ]arm|single[- ]leg|one[- ]arm|one[- ]leg|unilateral)\b/.test(n);
  }

  function canUseBelt(name) {
    const n = String(name || "").toLowerCase();
    return /\b(dip|pull[- ]?up|chin[- ]?up|muscle[- ]?up)\b/.test(n);
  }

  function classifyExercise(ex) {
    const name = (ex && ex.name) || "";
    const equipo = String((ex && ex.equipo) || "").toLowerCase();
    const grupo = String((ex && ex.grupo) || "").toLowerCase();
    const timed = !!(ex && ex.logType === "timed") || isTimedName(name);
    const cardio = !!(ex && ex.logType === "cardio") || (grupo === "cardio" && !timed);
    const bodyweight = equipo === "body weight" && !cardio;
    const perSide = !!(ex && ex.perSide) || isPerSideName(name);
    return {
      logType: timed ? "timed" : cardio ? "cardio" : "reps",
      isBodyweight: bodyweight && !timed,
      perSide: perSide && !timed && !cardio,
      beltEligible: canUseBelt(name),
      equipo: equipo,
      grupo: grupo,
    };
  }

  function muscleId(name) {
    if (!name) return null;
    const key = String(name).toLowerCase();
    return MUSCLE_ALIASES[key] || null;
  }

  function musclesOf(ex) {
    const ids = [];
    const add = (n) => {
      const id = muscleId(n);
      if (id && ids.indexOf(id) < 0) ids.push(id);
    };
    if (ex) {
      add(ex.target);
      add(ex.grupo);
      (ex.sec || []).forEach(add);
      if (ex.bodyPart) add(ex.bodyPart);
    }
    return ids;
  }

  function epley1RM(weight, reps) {
    const w = Number(weight);
    const r = Number(reps);
    if (!(w > 0) || !(r > 0) || r > 12) return null;
    if (r === 1) return w;
    return w * (1 + r / 30);
  }

  function bestEligibleSet(sets) {
    let best = null;
    (sets || []).forEach((set, idx) => {
      if (!set || set.completed === false) return;
      const est = epley1RM(set.weight, set.reps);
      if (est == null) return;
      if (!best || est > best.estimate) {
        best = { estimate: est, set: set, index: idx, label: describeSet(set) };
      }
    });
    return best;
  }

  function describeSet(set) {
    if (!set) return "";
    const date = set.date ? " el " + formatDateES(set.date) : "";
    if (set.weight && set.reps) return set.reps + " × " + trimNum(set.weight) + " kg" + date;
    if (set.reps) return set.reps + " reps" + date;
    return "serie" + date;
  }

  function trimNum(n) {
    const x = Number(n);
    if (!isFinite(x)) return "";
    return String(Math.round(x * 100) / 100);
  }

  function lastLogsForExercise(exerciseId, workouts) {
    const logs = [];
    (workouts || []).forEach((w) => {
      (w.items || []).forEach((it) => {
        if (it.exerciseId !== exerciseId) return;
        logs.push({
          date: w.date,
          workoutId: w.id,
          sets: (it.sets || []).map((s) => Object.assign({ date: w.date }, s)),
          dipBelt: !!it.dipBelt,
        });
      });
    });
    logs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return logs;
  }

  function lastCompletedSets(exerciseId, workouts) {
    const logs = lastLogsForExercise(exerciseId, workouts);
    for (let i = logs.length - 1; i >= 0; i--) {
      const done = (logs[i].sets || []).filter((s) => s.completed !== false && (s.reps > 0 || s.timeSec > 0));
      if (done.length) return Object.assign({ date: logs[i].date, dipBelt: logs[i].dipBelt }, { sets: done });
    }
    return null;
  }

  function allSetsHit(sets, pred) {
    const done = (sets || []).filter((s) => s.completed !== false);
    return done.length > 0 && done.every(pred);
  }

  function countConsecutiveFails(logs, failedFn) {
    let n = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      const sets = (logs[i].sets || []).filter((s) => s.completed !== false);
      if (!sets.length) continue;
      if (failedFn(sets, logs[i])) n += 1;
      else break;
    }
    return n;
  }

  function nextEven(n) {
    const x = Math.max(2, Math.round(Number(n) || 2));
    return x % 2 === 0 ? x : x + 1;
  }

  function applyPerSide(reps, perSide) {
    if (!perSide) return Math.max(1, Math.round(reps));
    return nextEven(reps);
  }

  function ruleOf(item, routine, settings) {
    const base = (routine && routine.progression) || { type: "linear", increment: settings.defaultIncrement, minReps: 8, maxReps: 12, timeIncrement: 5 };
    const over = item && item.progressionOverride;
    if (!over || over.type === "inherit") return Object.assign({ increment: settings.defaultIncrement, minReps: 8, maxReps: 12, timeIncrement: 5 }, base);
    return Object.assign({ increment: settings.defaultIncrement, minReps: 8, maxReps: 12, timeIncrement: 5 }, base, over);
  }

  function progressLinear(opts) {
    const last = opts.last;
    const rule = opts.rule;
    const item = opts.item;
    const settings = opts.settings;
    const inc = Number(rule.increment) || settings.defaultIncrement || 2.5;
    const targetReps = applyPerSide(item.targetReps || rule.minReps || 8, item.perSide);
    const targetSets = item.targetSets || 3;
    if (!last) {
      return {
        weight: item.seedWeight || null,
        reps: targetReps,
        sets: targetSets,
        reason: "Sin historial: elige un peso cómodo que te deje 1–2 repeticiones en reserva y regístralo.",
      };
    }
    const weight = Number(last.sets[0].weight) || 0;
    const hit = allSetsHit(last.sets, (s) => Number(s.reps) >= targetReps && (item.isBodyweight && !item.dipBelt ? true : Number(s.weight) >= weight));
    const fails = countConsecutiveFails(opts.logs, (sets) => !allSetsHit(sets, (s) => Number(s.reps) >= targetReps));
    if (!hit) {
      if (fails >= 2) {
        const deload = Math.round(weight * 0.9 * 4) / 4;
        return {
          weight: deload,
          reps: targetReps,
          sets: targetSets,
          reason: "Dos sesiones seguidas por debajo de " + targetReps + " reps a " + trimNum(weight) + " kg → descarga del 10% (" + trimNum(deload) + " kg). Las reps fallidas no suben la carga.",
        };
      }
      return {
        weight: weight || null,
        reps: targetReps,
        sets: targetSets,
        reason: "El " + formatDateES(last.date) + " no llegaste a " + targetReps + " reps en todas las series. Se mantiene " + trimNum(weight) + " kg: las reps fallidas nunca suben la carga.",
      };
    }
    const nextW = Math.round((weight + inc) * 4) / 4;
    return {
      weight: nextW,
      reps: targetReps,
      sets: targetSets,
      reason: "Completaste " + last.sets.length + "×" + targetReps + " a " + trimNum(weight) + " kg el " + formatDateES(last.date) + " → +" + trimNum(inc) + " kg (regla lineal).",
    };
  }

  function progressGSLP(opts) {
    const last = opts.last;
    const rule = opts.rule;
    const item = opts.item;
    const settings = opts.settings;
    const inc = Number(rule.increment) || settings.defaultIncrement || 2.5;
    const targetReps = applyPerSide(item.targetReps || 5, item.perSide);
    const targetSets = item.targetSets || 3;
    if (!last) {
      return {
        weight: item.seedWeight || null,
        reps: targetReps,
        sets: targetSets,
        amrap: true,
        reason: "Greyskull LP sin historial:  " + (targetSets - 1) + " series a " + targetReps + " y un top set AMRAP. Empieza con un peso que puedas hacer limpio.",
      };
    }
    const weight = Number(last.sets[0].weight) || 0;
    const top = last.sets[last.sets.length - 1];
    const amrap = Number(top && top.reps) || 0;
    const fails = countConsecutiveFails(opts.logs, (sets) => {
      const t = sets[sets.length - 1];
      return !t || Number(t.reps) < targetReps;
    });
    if (amrap < targetReps) {
      if (fails >= 2) {
        const deload = Math.round(weight * 0.9 * 4) / 4;
        return {
          weight: deload,
          reps: targetReps,
          sets: targetSets,
          amrap: true,
          reason: "El top set AMRAP quedó por debajo de " + targetReps + " dos veces → reset del 10% (Greyskull). Nuevo peso: " + trimNum(deload) + " kg.",
        };
      }
      return {
        weight: weight || null,
        reps: targetReps,
        sets: targetSets,
        amrap: true,
        reason: "AMRAP de " + amrap + " el " + formatDateES(last.date) + " no llegó a " + targetReps + ". Se mantiene " + trimNum(weight) + " kg; las reps fallidas no suben la carga.",
      };
    }
    if (amrap >= 10) {
      const nextW = Math.round((weight + inc * 2) * 4) / 4;
      return {
        weight: nextW,
        reps: targetReps,
        sets: targetSets,
        amrap: true,
        reason: "Top set AMRAP de " + amrap + " reps a " + trimNum(weight) + " kg el " + formatDateES(last.date) + " → salto doble de Greyskull (+" + trimNum(inc * 2) + " kg).",
      };
    }
    const nextW = Math.round((weight + inc) * 4) / 4;
    return {
      weight: nextW,
      reps: targetReps,
      sets: targetSets,
      amrap: true,
      reason: "Top set AMRAP de " + amrap + " reps a " + trimNum(weight) + " kg el " + formatDateES(last.date) + " → +" + trimNum(inc) + " kg (Greyskull LP).",
    };
  }

  function progressDouble(opts) {
    const last = opts.last;
    const rule = opts.rule;
    const item = opts.item;
    const settings = opts.settings;
    const inc = Number(rule.increment) || settings.defaultIncrement || 2.5;
    let minR = applyPerSide(rule.minReps || item.targetReps || 8, item.perSide);
    let maxR = applyPerSide(rule.maxReps || 12, item.perSide);
    if (item.perSide && maxR <= minR) maxR = minR + 2;
    const targetSets = item.targetSets || 3;
    if (!last) {
      return {
        weight: item.seedWeight || null,
        reps: minR,
        sets: targetSets,
        reason: "Doble progresión sin historial: rango " + minR + "–" + maxR + " reps. Empieza en el suelo del rango con un peso cómodo.",
      };
    }
    const weight = Number(last.sets[0].weight) || 0;
    const lastTarget = applyPerSide(item.lastTargetReps || minR, item.perSide);
    const hitMax = allSetsHit(last.sets, (s) => Number(s.reps) >= maxR);
    const hitTarget = allSetsHit(last.sets, (s) => Number(s.reps) >= lastTarget);
    const fails = countConsecutiveFails(opts.logs, (sets) => !allSetsHit(sets, (s) => Number(s.reps) >= minR));
    if (!hitTarget) {
      if (fails >= 2) {
        const deload = Math.round(weight * 0.9 * 4) / 4;
        return {
          weight: deload,
          reps: minR,
          sets: targetSets,
          reason: "Dos estancamientos por debajo de " + minR + " reps → descarga del 10% (" + trimNum(deload) + " kg) y vuelta al suelo del rango. Las reps fallidas no suben la carga.",
        };
      }
      return {
        weight: weight || null,
        reps: lastTarget,
        sets: targetSets,
        reason: "No llegaste a " + lastTarget + " reps en todas las series el " + formatDateES(last.date) + ". Se mantiene " + trimNum(weight) + " kg.",
      };
    }
    if (hitMax) {
      const nextW = Math.round((weight + inc) * 4) / 4;
      return {
        weight: nextW,
        reps: minR,
        sets: targetSets,
        reason: "Llegaste al techo (" + maxR + " reps) a " + trimNum(weight) + " kg el " + formatDateES(last.date) + " → +" + trimNum(inc) + " kg y vuelves a " + minR + " reps.",
      };
    }
    const step = item.perSide ? 2 : 1;
    const nextReps = applyPerSide(lastTarget + step, item.perSide);
    return {
      weight: weight || null,
      reps: Math.min(nextReps, maxR),
      sets: targetSets,
      reason: "Completaste " + lastTarget + " reps a " + trimNum(weight) + " kg. En doble progresión suben las reps (+" + step + ") hasta " + maxR + " antes de tocar el peso.",
    };
  }

  function progressTime(opts) {
    const last = opts.last;
    const rule = opts.rule;
    const item = opts.item;
    const step = Number(rule.timeIncrement) || 5;
    const targetSets = item.targetSets || 3;
    const target = item.targetTime || 30;
    if (!last) {
      return {
        weight: item.seedWeight || (item.isBodyweight && !item.dipBelt ? 0 : null),
        timeSec: target,
        sets: targetSets,
        reason: "Ejercicio a tiempo sin historial: apunta a sostener " + target + " s. El temporizador de trabajo registra lo que realmente aguantas.",
      };
    }
    const held = last.sets.map((s) => Number(s.timeSec) || 0);
    const hit = held.length && held.every((t) => t >= target);
    const fails = countConsecutiveFails(opts.logs, (sets) => sets.some((s) => (Number(s.timeSec) || 0) < target));
    const weight = last.sets[0].weight != null ? Number(last.sets[0].weight) : (item.seedWeight || 0);
    if (!hit) {
      if (fails >= 2) {
        const cut = Math.max(10, target - step * 2);
        return {
          weight: weight,
          timeSec: cut,
          sets: targetSets,
          reason: "Dos sesiones por debajo de " + target + " s → recorte del objetivo a " + cut + " s. Un fallo no alarga el tiempo.",
        };
      }
      return {
        weight: weight,
        timeSec: target,
        sets: targetSets,
        reason: "El " + formatDateES(last.date) + " sostuviste menos de " + target + " s. Se mantiene el objetivo; un intento fallido no suma tiempo.",
      };
    }
    return {
      weight: weight,
      timeSec: target + step,
      sets: targetSets,
      reason: "Sostuviste " + target + " s en todas las series el " + formatDateES(last.date) + " → +" + step + " s (regla de añadir tiempo).",
    };
  }

  function progressBodyweight(opts) {
    const last = opts.last;
    const item = opts.item;
    const settings = opts.settings;
    const ceiling = Number(settings.bwRepCeiling) || 15;
    const maxSets = Number(settings.bwMaxSets) || 5;
    const perSide = !!item.perSide;
    const startReps = applyPerSide(item.targetReps || 8, perSide);
    const startSets = item.targetSets || 3;
    if (item.dipBelt) {
      return progressLinear(opts);
    }
    if (!last) {
      return {
        weight: 0,
        reps: startReps,
        sets: startSets,
        reason: "Peso corporal sin historial: registra solo repeticiones (sin columna de peso). El stepper suma de " + (perSide ? "2 en 2" : "1 en 1") + ".",
      };
    }
    const lastReps = Math.max.apply(null, last.sets.map((s) => Number(s.reps) || 0));
    const lastSets = last.sets.length;
    const targetThen = applyPerSide(item.lastTargetReps || startReps, perSide);
    const hit = allSetsHit(last.sets, (s) => Number(s.reps) >= targetThen);
    const fails = countConsecutiveFails(opts.logs, (sets) => !allSetsHit(sets, (s) => Number(s.reps) >= targetThen));
    if (!hit) {
      return {
        weight: 0,
        reps: targetThen,
        sets: lastSets,
        reason: "No llegaste a " + targetThen + (perSide ? " reps totales (" + (targetThen / 2) + " por lado)" : " reps") + " el " + formatDateES(last.date) + ". Se mantienen las reps; un fallo no progresa.",
      };
    }
    if (fails >= 2) {
      return {
        weight: 0,
        reps: targetThen,
        sets: lastSets,
        reason: "Estancamiento: se mantiene el objetivo. En peso corporal no se inventa carga.",
      };
    }
    const nextReps = applyPerSide(targetThen + (perSide ? 2 : 1), perSide);
    if (nextReps <= ceiling) {
      return {
        weight: 0,
        reps: nextReps,
        sets: lastSets,
        reason: "Completaste " + targetThen + (perSide ? " reps (" + (targetThen / 2) + " por lado)" : " reps") + " el " + formatDateES(last.date) + " → " + nextReps + " reps" + (perSide ? " (" + (nextReps / 2) + " por lado)" : "") + ".",
      };
    }
    if (lastSets < maxSets) {
      return {
        weight: 0,
        reps: ceiling,
        sets: lastSets + 1,
        reason: "Pasaste el techo de " + ceiling + " reps que definiste. En vez de otra repetición se añade una serie (" + (lastSets + 1) + ").",
      };
    }
    return {
      weight: 0,
      reps: ceiling,
      sets: lastSets,
      suggestLoad: true,
      reason: "Ya estás en " + lastSets + "×" + ceiling + ". El consejo honesto: añade lastre (cinturón) o pasa a una variación más difícil; seguir sumando reps deja de ser el estímulo útil.",
    };
  }

  function computeTarget(item, routine, workouts, settings) {
    const logs = lastLogsForExercise(item.exerciseId, workouts);
    const last = lastCompletedSets(item.exerciseId, workouts);
    const rule = ruleOf(item, routine, settings);
    const opts = { item: item, routine: routine, rule: rule, last: last, logs: logs, settings: settings };
    let result;
    if (item.logType === "cardio") {
      const lastCardio = last && last.sets[0];
      result = {
        timeSec: item.targetTime || (lastCardio && lastCardio.timeSec) || 600,
        speed: item.targetSpeed || (lastCardio && lastCardio.speed) || null,
        sets: 1,
        reason: lastCardio
          ? "Último cardio: " + formatDuration(lastCardio.timeSec) + (lastCardio.speed ? " a " + lastCardio.speed : "") + " el " + formatDateES(last.date) + "."
          : "Cardio: registra tiempo y velocidad, no peso × reps.",
      };
    } else if (item.logType === "timed" || rule.type === "time") {
      result = progressTime(opts);
    } else if (item.isBodyweight && !item.dipBelt) {
      result = progressBodyweight(opts);
    } else if (rule.type === "gslp") {
      result = progressGSLP(opts);
    } else if (rule.type === "double") {
      result = progressDouble(opts);
    } else {
      result = progressLinear(opts);
    }
    if (last && result.weight == null && last.sets[0] && last.sets[0].weight != null && !item.isBodyweight) {
      result.weight = last.sets[0].weight;
      result.reason = (result.reason || "") + " Se rellena el último peso registrado (" + trimNum(last.sets[0].weight) + " kg).";
    }
    if (item.perSide && result.reps) {
      result.reps = applyPerSide(result.reps, true);
      result.perSideLabel = (result.reps / 2) + " por lado";
    }
    result.ruleType = (item.logType === "timed") ? "time" : (item.isBodyweight && !item.dipBelt ? "bodyweight" : rule.type);
    result.last = last;
    return result;
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return h + "h " + pad2(m % 60) + "m";
    }
    return m + ":" + pad2(r);
  }

  function detectPR(exerciseId, candidate, workouts, logType) {
    const logs = lastLogsForExercise(exerciseId, workouts);
    const prevSets = [];
    logs.forEach((l) => l.sets.forEach((s) => prevSets.push(s)));
    if (logType === "timed") {
      const best = prevSets.reduce((m, s) => Math.max(m, Number(s.timeSec) || 0), 0);
      const held = Number(candidate.timeSec) || 0;
      if (held > 0 && held > best) {
        return { kind: "time", message: "PR de tiempo: " + formatDuration(held) + (best ? " (antes " + formatDuration(best) + ")" : "") };
      }
      return null;
    }
    if (logType === "cardio") return null;
    const est = epley1RM(candidate.weight, candidate.reps);
    const prevBest = bestEligibleSet(prevSets);
    if (est != null && (!prevBest || est > prevBest.estimate + 0.05)) {
      return { kind: "1rm", message: "PR estimado: 1RM ≈ " + trimNum(est) + " kg (" + describeSet(Object.assign({ date: todayISO() }, candidate)) + ")" };
    }
    const sameWeightMoreReps = prevSets.some((s) => Number(s.weight) === Number(candidate.weight) && Number(s.weight) > 0)
      && prevSets.filter((s) => Number(s.weight) === Number(candidate.weight)).every((s) => Number(s.reps) < Number(candidate.reps));
    if (sameWeightMoreReps && Number(candidate.reps) > 0) {
      return { kind: "reps", message: "PR de reps: " + candidate.reps + " a " + trimNum(candidate.weight) + " kg" };
    }
    const bwMore = (!candidate.weight || Number(candidate.weight) === 0) && Number(candidate.reps) > 0
      && prevSets.every((s) => (Number(s.reps) || 0) < Number(candidate.reps));
    if (bwMore && prevSets.length) {
      return { kind: "reps", message: "PR de reps a peso corporal: " + candidate.reps };
    }
    return null;
  }

  function weighInTowardGoal(prev, next, goal) {
    if (goal == null || !isFinite(Number(goal))) return "neutral";
    const g = Number(goal);
    const a = Number(prev);
    const b = Number(next);
    if (!isFinite(a) || !isFinite(b)) return "neutral";
    const closer = Math.abs(b - g) < Math.abs(a - g) - 0.0001;
    const farther = Math.abs(b - g) > Math.abs(a - g) + 0.0001;
    if (closer) return "toward";
    if (farther) return "away";
    return "neutral";
  }

  function chartSegments(weighIns, goal) {
    const pts = (weighIns || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      segs.push({
        from: pts[i - 1],
        to: pts[i],
        delta: Number(pts[i].kg) - Number(pts[i - 1].kg),
        tone: weighInTowardGoal(pts[i - 1].kg, pts[i].kg, goal),
      });
    }
    return segs;
  }

  function addWeighIn(kg, date) {
    const s = getState();
    const iso = date || todayISO();
    const existing = s.weighIns.find((w) => w.date === iso);
    if (existing) existing.kg = Number(kg);
    else s.weighIns.push({ id: uid("w"), date: iso, kg: Number(kg) });
    s.weighIns.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    save();
    return s.weighIns;
  }

  function removeWeighIn(id) {
    const s = getState();
    s.weighIns = s.weighIns.filter((w) => w.id !== id);
    save();
    return s.weighIns;
  }

  function addCustomExercise(fields) {
    const s = getState();
    const name = String((fields && fields.name) || "").trim();
    const bodyPart = String((fields && fields.bodyPart) || "").trim();
    if (!name || !bodyPart) throw new Error("Nombre y parte del cuerpo son obligatorios.");
    const ex = {
      id: uid("cx"),
      name: name,
      bodyPart: bodyPart,
      target: bodyPart,
      grupo: fields.grupo || bodyPart,
      equipo: fields.equipo || "body weight",
      description: String((fields && fields.description) || "").trim(),
      custom: true,
      gif: null,
      sec: [],
      pasos: fields.description ? [fields.description] : [],
      logType: fields.logType || null,
      perSide: !!fields.perSide,
    };
    s.customExercises.push(ex);
    save();
    return ex;
  }

  function allExercises(catalog) {
    const s = getState();
    return (catalog || []).concat(s.customExercises || []);
  }

  function findExercise(id, catalog) {
    if (!id) return null;
    const s = getState();
    const custom = (s.customExercises || []).find((e) => e.id === id);
    if (custom) return custom;
    return (catalog || []).find((e) => e.id === id) || null;
  }

  function upsertRoutine(fields) {
    const s = getState();
    if (fields.id) {
      const i = s.routines.findIndex((r) => r.id === fields.id);
      if (i >= 0) {
        s.routines[i] = Object.assign({}, s.routines[i], fields);
        save();
        return s.routines[i];
      }
    }
    const r = {
      id: fields.id || uid("r"),
      name: fields.name || "Rutina",
      progression: fields.progression || { type: "linear", increment: s.settings.defaultIncrement, minReps: 8, maxReps: 12, timeIncrement: 5 },
      items: fields.items || [],
    };
    s.routines.push(r);
    save();
    return r;
  }

  function deleteRoutine(id) {
    const s = getState();
    s.routines = s.routines.filter((r) => r.id !== id);
    Object.keys(s.weeklyPlan).forEach((k) => {
      if (s.weeklyPlan[k] === id) s.weeklyPlan[k] = null;
    });
    Object.keys(s.overrides).forEach((d) => {
      if (s.overrides[d] && s.overrides[d].routineId === id) delete s.overrides[d];
    });
    save();
  }

  function getRoutine(id) {
    return getState().routines.find((r) => r.id === id) || null;
  }

  function assignDay(dayKey, routineId) {
    const s = getState();
    if (!Object.prototype.hasOwnProperty.call(s.weeklyPlan, dayKey)) return s.weeklyPlan;
    s.weeklyPlan[dayKey] = routineId || null;
    save();
    return s.weeklyPlan;
  }

  function scheduledRoutineId(iso) {
    const s = getState();
    if (s.overrides[iso] && Object.prototype.hasOwnProperty.call(s.overrides[iso], "routineId")) {
      return s.overrides[iso].routineId;
    }
    return s.weeklyPlan[weekdayKey(iso)] || null;
  }

  function reschedule(fromISO, toISO) {
    const s = getState();
    const rid = scheduledRoutineId(fromISO);
    if (fromISO === toISO) return s.overrides;
    s.overrides[toISO] = {
      routineId: rid,
      from: fromISO,
      movedAt: todayISO(),
    };
    s.overrides[fromISO] = { routineId: null, vacated: true, to: toISO };
    save();
    return s.overrides;
  }

  function clearOverride(iso) {
    const s = getState();
    delete s.overrides[iso];
    save();
  }

  function weekDates(around) {
    const d = around ? parseISO(todayISO(around)) : new Date();
    const js = d.getDay();
    const mondayOffset = js === 0 ? -6 : 1 - js;
    const mon = new Date(d);
    mon.setDate(d.getDate() + mondayOffset);
    return DAYS.map((day, i) => {
      const x = new Date(mon);
      x.setDate(mon.getDate() + i);
      const iso = todayISO(x);
      return {
        iso: iso,
        key: day.key,
        name: day.name,
        routineId: scheduledRoutineId(iso),
        baseRoutineId: getState().weeklyPlan[day.key] || null,
        override: getState().overrides[iso] || null,
        isToday: iso === todayISO(),
      };
    });
  }

  function makeRoutineItem(ex, extras) {
    const c = classifyExercise(ex);
    const rest = (extras && extras.restSec != null) ? extras.restSec : getState().settings.defaultRest;
    return Object.assign({
      id: uid("i"),
      exerciseId: ex.id,
      name: ex.name,
      targetSets: c.logType === "cardio" ? 1 : 3,
      targetReps: c.perSide ? 16 : (c.isBodyweight ? 10 : 8),
      targetTime: c.logType === "timed" ? 30 : (c.logType === "cardio" ? 600 : null),
      targetSpeed: null,
      restSec: rest,
      logType: c.logType,
      isBodyweight: c.isBodyweight,
      perSide: c.perSide,
      dipBelt: false,
      beltEligible: c.beltEligible,
      supersetGroup: null,
      progressionOverride: null,
      seedWeight: null,
    }, extras || {});
  }

  function pairSuperset(routine, itemIdA, itemIdB) {
    const gid = uid("ss");
    routine.items.forEach((it) => {
      if (it.id === itemIdA || it.id === itemIdB) {
        it.supersetGroup = gid;
      }
    });
    const a = routine.items.find((it) => it.id === itemIdA);
    const b = routine.items.find((it) => it.id === itemIdB);
    if (a) a.restSec = 0;
    if (b && (b.restSec == null || b.restSec === 0)) b.restSec = getState().settings.defaultRest;
    return gid;
  }

  function clearSuperset(routine, groupId) {
    routine.items.forEach((it) => {
      if (it.supersetGroup === groupId) {
        it.supersetGroup = null;
        if (!it.restSec) it.restSec = getState().settings.defaultRest;
      }
    });
  }

  function startSession(iso, catalog) {
    const s = getState();
    const date = iso || todayISO();
    const rid = scheduledRoutineId(date);
    const routine = rid ? getRoutine(rid) : null;
    const items = routine ? routine.items.map((it) => {
      const ex = findExercise(it.exerciseId, catalog) || { id: it.exerciseId, name: it.name };
      const target = computeTarget(it, routine, s.workouts, s.settings);
      const n = target.sets || it.targetSets || 3;
      const sets = [];
      for (let i = 0; i < n; i++) {
        sets.push({
          weight: it.isBodyweight && !it.dipBelt ? 0 : (target.weight != null ? target.weight : ""),
          reps: it.logType === "reps" ? (target.reps || it.targetReps || "") : "",
          timeSec: (it.logType === "timed" || it.logType === "cardio") ? (target.timeSec || it.targetTime || "") : "",
          speed: it.logType === "cardio" ? (target.speed || "") : "",
          effort: "",
          effortScale: s.settings.effortScale === "off" ? null : s.settings.effortScale,
          completed: false,
          isPR: false,
        });
      }
      return {
        id: it.id,
        exerciseId: it.exerciseId,
        name: it.name || ex.name,
        logType: it.logType,
        isBodyweight: it.isBodyweight,
        perSide: it.perSide,
        dipBelt: it.dipBelt,
        beltEligible: it.beltEligible,
        restSec: it.restSec,
        supersetGroup: it.supersetGroup,
        target: target,
        gif: ex.gif || null,
        description: ex.description || "",
        pasos: ex.pasos || [],
        sets: sets,
      };
    }) : [];
    s.activeSession = {
      id: uid("ws"),
      date: date,
      routineId: rid,
      routineName: routine ? routine.name : "Sesión libre",
      startedAt: Date.now(),
      finishedAt: null,
      bodyWeightKg: null,
      bodyWeightAsked: false,
      items: items,
    };
    save();
    return s.activeSession;
  }

  function patchSession(mutator) {
    const s = getState();
    if (!s.activeSession) return null;
    mutator(s.activeSession);
    save();
    return s.activeSession;
  }

  function finishSession() {
    const s = getState();
    const ses = s.activeSession;
    if (!ses) return null;
    ses.finishedAt = Date.now();
    const durationSec = Math.max(0, Math.round((ses.finishedAt - ses.startedAt) / 1000));
    const workout = {
      id: ses.id,
      date: ses.date,
      routineId: ses.routineId,
      routineName: ses.routineName,
      startedAt: ses.startedAt,
      finishedAt: ses.finishedAt,
      durationSec: durationSec,
      bodyWeightKg: ses.bodyWeightKg,
      items: (ses.items || []).map((it) => ({
        exerciseId: it.exerciseId,
        name: it.name,
        logType: it.logType,
        dipBelt: it.dipBelt,
        perSide: it.perSide,
        sets: (it.sets || []).filter((x) => x.completed).map((x) => ({
          weight: x.weight === "" ? null : Number(x.weight),
          reps: x.reps === "" ? null : Number(x.reps),
          timeSec: x.timeSec === "" ? null : Number(x.timeSec),
          speed: x.speed === "" ? null : x.speed,
          effort: x.effort === "" || x.effort == null ? null : Number(x.effort),
          effortScale: x.effortScale || null,
          completed: true,
          isPR: !!x.isPR,
        })),
      })),
    };
    s.workouts.push(workout);
    if (ses.bodyWeightKg != null && isFinite(Number(ses.bodyWeightKg))) {
      addWeighIn(ses.bodyWeightKg, ses.date);
    }
    s.activeSession = null;
    save();
    return workout;
  }

  function discardSession() {
    const s = getState();
    s.activeSession = null;
    save();
  }

  function workoutDurationOn(iso) {
    return getState().workouts
      .filter((w) => w.date === iso)
      .reduce((sum, w) => sum + (Number(w.durationSec) || 0), 0);
  }

  function heatmap(year) {
    const y = year || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    const cells = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = todayISO(d);
      const sec = workoutDurationOn(iso);
      cells.push({ date: iso, seconds: sec, minutes: Math.round(sec / 60) });
    }
    return { year: y, cells: cells, maxMinutes: cells.reduce((m, c) => Math.max(m, c.minutes), 0) };
  }

  function muscleWork(workouts, catalog, fromISO, toISO) {
    const scores = {};
    MUSCLES.forEach((m) => { scores[m.id] = 0; });
    (workouts || []).forEach((w) => {
      if (fromISO && w.date < fromISO) return;
      if (toISO && w.date > toISO) return;
      (w.items || []).forEach((it) => {
        const ex = findExercise(it.exerciseId, catalog) || { target: it.target, grupo: it.grupo, sec: it.sec, name: it.name };
        const ids = musclesOf(ex);
        if (!ids.length && it.name) {
          /* custom without mapped muscle still ignored for map */
        }
        let volume = 0;
        (it.sets || []).forEach((s) => {
          if (s.completed === false) return;
          if (it.logType === "timed") volume += (Number(s.timeSec) || 0);
          else if (it.logType === "cardio") volume += (Number(s.timeSec) || 0) / 10;
          else {
            const reps = Number(s.reps) || 0;
            const wgt = Number(s.weight) || 0;
            volume += wgt > 0 ? wgt * reps : reps * 10;
          }
        });
        ids.forEach((id, i) => {
          const factor = i === 0 ? 1 : 0.4;
          scores[id] = (scores[id] || 0) + volume * factor;
        });
      });
    });
    const max = Object.keys(scores).reduce((m, k) => Math.max(m, scores[k]), 0);
    const unused = MUSCLES.filter((m) => (scores[m.id] || 0) === 0).map((m) => m.es);
    return { scores: scores, max: max, unused: unused, muscles: MUSCLES };
  }

  function routinePreviewMuscles(routine, catalog) {
    const fake = {
      date: todayISO(),
      items: (routine.items || []).map((it) => {
        const ex = findExercise(it.exerciseId, catalog) || it;
        return {
          exerciseId: it.exerciseId,
          name: it.name,
          logType: it.logType,
          target: ex.target,
          grupo: ex.grupo,
          sec: ex.sec,
          sets: [{ completed: true, reps: it.targetReps || 8, weight: it.seedWeight || 20, timeSec: it.targetTime || 30 }],
        };
      }),
    };
    return muscleWork([fake], catalog);
  }

  function periodRange(kind) {
    const today = todayISO();
    if (kind === "week") {
      const week = weekDates();
      return { from: week[0].iso, to: week[6].iso };
    }
    if (kind === "month") {
      const d = new Date();
      return { from: d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-01", to: today };
    }
    return { from: null, to: today };
  }

  function equipmentOptions(exercises, selected, extraFilters) {
    const sel = selected || [];
    const q = extraFilters || {};
    const pool = (exercises || []).filter((e) => {
      if (q.grupo && e.grupo !== q.grupo) return false;
      if (q.search) {
        const hay = String(e.name || "").toLowerCase();
        if (hay.indexOf(String(q.search).toLowerCase()) < 0) return false;
      }
      if (sel.length && sel.indexOf(e.equipo) < 0) return false;
      return true;
    });
    const counts = {};
    pool.forEach((e) => {
      const eq = e.equipo || "";
      counts[eq] = (counts[eq] || 0) + 1;
    });
    const owned = extraFilters && extraFilters.owned;
    return {
      items: pool,
      equipment: Object.keys(counts).sort().map((eq) => ({
        id: eq,
        name: EQUIPMENT_ES[eq] || eq,
        count: counts[eq],
        selected: sel.indexOf(eq) >= 0,
      })).filter((x) => x.count > 0),
      owned: owned || [],
    };
  }

  function filterByOwned(exercises, owned) {
    if (!owned || !owned.length) return exercises || [];
    return (exercises || []).filter((e) => owned.indexOf(e.equipo) >= 0);
  }

  function exportPlan() {
    const s = getState();
    return {
      type: PLAN_EXPORT_TYPE,
      version: PLAN_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      weeklyPlan: clone(s.weeklyPlan),
      routines: clone(s.routines),
      customExercises: clone(s.customExercises),
    };
  }

  function mergePlan(incoming) {
    if (!incoming || incoming.type !== PLAN_EXPORT_TYPE) {
      throw new Error("El archivo no es un plan de Healthyhead.");
    }
    const s = getState();
    const added = { routines: 0, custom: 0, days: 0 };
    const idMap = {};
    (incoming.customExercises || []).forEach((ex) => {
      const exists = s.customExercises.some((c) => c.id === ex.id || c.name.toLowerCase() === String(ex.name || "").toLowerCase());
      if (exists) return;
      const copy = clone(ex);
      if (s.customExercises.some((c) => c.id === copy.id)) copy.id = uid("cx");
      s.customExercises.push(copy);
      added.custom += 1;
    });
    (incoming.routines || []).forEach((r) => {
      const exists = s.routines.some((x) => x.id === r.id || x.name.toLowerCase() === String(r.name || "").toLowerCase());
      if (exists) return;
      const copy = clone(r);
      if (s.routines.some((x) => x.id === copy.id)) {
        const nid = uid("r");
        idMap[copy.id] = nid;
        copy.id = nid;
      }
      s.routines.push(copy);
      added.routines += 1;
    });
    const plan = incoming.weeklyPlan || {};
    Object.keys(s.weeklyPlan).forEach((day) => {
      if (s.weeklyPlan[day]) return;
      let rid = plan[day];
      if (!rid) return;
      if (idMap[rid]) rid = idMap[rid];
      if (!s.routines.some((r) => r.id === rid)) return;
      s.weeklyPlan[day] = rid;
      added.days += 1;
    });
    save();
    return added;
  }

  function applyTemplate(name, catalog) {
    const s = getState();
    if (name === "fullbody") {
      const byId = {};
      (catalog || []).forEach((e) => { byId[e.id] = e; });
      const add = (routine, ids) => {
        ids.forEach((id) => {
          const ex = byId[id];
          if (ex) routine.items.push(makeRoutineItem(ex));
        });
      };
      const push = upsertRoutine({
        name: "Full body A",
        progression: { type: "linear", increment: 2.5, minReps: 8, maxReps: 12, timeIncrement: 5 },
        items: [],
      });
      const pull = upsertRoutine({
        name: "Full body B",
        progression: { type: "gslp", increment: 2.5, minReps: 5, maxReps: 10, timeIncrement: 5 },
        items: [],
      });
      add(push, ["0043", "0025", "0662", "2135"]);
      add(pull, ["0032", "0027", "0652", "0054"]);
      if (push.items.length >= 2) pairSuperset(push, push.items[push.items.length - 2].id, push.items[push.items.length - 1].id);
      upsertRoutine(push);
      upsertRoutine(pull);
      if (!s.weeklyPlan.mon) s.weeklyPlan.mon = push.id;
      if (!s.weeklyPlan.wed) s.weeklyPlan.wed = pull.id;
      if (!s.weeklyPlan.fri) s.weeklyPlan.fri = push.id;
      save();
      return [push, pull];
    }
    return [];
  }

  function exercisePRs(catalog) {
    const s = getState();
    const byEx = {};
    s.workouts.forEach((w) => {
      (w.items || []).forEach((it) => {
        const key = it.exerciseId;
        if (!byEx[key]) byEx[key] = { exerciseId: key, name: it.name, sets: [], logType: it.logType };
        (it.sets || []).forEach((set) => {
          byEx[key].sets.push(Object.assign({ date: w.date }, set));
        });
      });
    });
    return Object.keys(byEx).map((k) => {
      const row = byEx[k];
      const best = bestEligibleSet(row.sets);
      const history = [];
      const byDate = {};
      row.sets.forEach((set) => {
        const est = epley1RM(set.weight, set.reps);
        if (est == null) return;
        if (!byDate[set.date] || est > byDate[set.date]) byDate[set.date] = est;
      });
      Object.keys(byDate).sort().forEach((d) => history.push({ date: d, estimate: byDate[d] }));
      const ex = findExercise(k, catalog);
      return {
        exerciseId: k,
        name: row.name || (ex && ex.name) || k,
        best: best,
        history: history,
        logType: row.logType,
      };
    }).filter((r) => r.best).sort((a, b) => b.best.estimate - a.best.estimate);
  }

  function sessionMuscles(session, catalog) {
    if (!session) return muscleWork([], catalog);
    const fake = {
      date: session.date,
      items: (session.items || []).map((it) => {
        const ex = findExercise(it.exerciseId, catalog) || it;
        return {
          exerciseId: it.exerciseId,
          name: it.name,
          logType: it.logType,
          target: ex.target,
          grupo: ex.grupo,
          sec: ex.sec,
          sets: (it.sets || []).filter((s) => s.completed),
        };
      }),
    };
    return muscleWork([fake], catalog);
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    PLAN_EXPORT_TYPE: PLAN_EXPORT_TYPE,
    DAYS: DAYS,
    MUSCLES: MUSCLES,
    EQUIPMENT_ES: EQUIPMENT_ES,
    GROUP_ES: GROUP_ES,
    PROGRESSION_TYPES: PROGRESSION_TYPES,
    useStorage: useStorage,
    memoryStorage: memoryStorage,
    uid: uid,
    todayISO: todayISO,
    parseISO: parseISO,
    weekdayKey: weekdayKey,
    formatDateES: formatDateES,
    formatDuration: formatDuration,
    trimNum: trimNum,
    clone: clone,
    defaultState: defaultState,
    load: load,
    save: save,
    getState: getState,
    resetState: resetState,
    updateSettings: updateSettings,
    isTimedName: isTimedName,
    isPerSideName: isPerSideName,
    canUseBelt: canUseBelt,
    classifyExercise: classifyExercise,
    muscleId: muscleId,
    musclesOf: musclesOf,
    epley1RM: epley1RM,
    bestEligibleSet: bestEligibleSet,
    lastLogsForExercise: lastLogsForExercise,
    lastCompletedSets: lastCompletedSets,
    computeTarget: computeTarget,
    progressLinear: progressLinear,
    progressGSLP: progressGSLP,
    progressDouble: progressDouble,
    progressTime: progressTime,
    progressBodyweight: progressBodyweight,
    detectPR: detectPR,
    weighInTowardGoal: weighInTowardGoal,
    chartSegments: chartSegments,
    addWeighIn: addWeighIn,
    removeWeighIn: removeWeighIn,
    addCustomExercise: addCustomExercise,
    allExercises: allExercises,
    findExercise: findExercise,
    upsertRoutine: upsertRoutine,
    deleteRoutine: deleteRoutine,
    getRoutine: getRoutine,
    assignDay: assignDay,
    scheduledRoutineId: scheduledRoutineId,
    reschedule: reschedule,
    clearOverride: clearOverride,
    weekDates: weekDates,
    makeRoutineItem: makeRoutineItem,
    pairSuperset: pairSuperset,
    clearSuperset: clearSuperset,
    startSession: startSession,
    patchSession: patchSession,
    finishSession: finishSession,
    discardSession: discardSession,
    heatmap: heatmap,
    muscleWork: muscleWork,
    routinePreviewMuscles: routinePreviewMuscles,
    sessionMuscles: sessionMuscles,
    periodRange: periodRange,
    equipmentOptions: equipmentOptions,
    filterByOwned: filterByOwned,
    exportPlan: exportPlan,
    mergePlan: mergePlan,
    applyTemplate: applyTemplate,
    exercisePRs: exercisePRs,
    nextEven: nextEven,
    applyPerSide: applyPerSide,
  };
});
