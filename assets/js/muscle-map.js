/* ============================================================
   HEALTHYHEAD — Mapa muscular
   Render vanilla de diagramas MuscleMap (MIT, @musclemap/assets).
   Figura hombre/mujer, frente y espalda, heatmap por grupo.
   ============================================================ */
(function (root) {
  "use strict";

  const OUR_TO_CHART = {
    pectorals: ["CHEST"],
    delts: ["SHOULDERS_FRONT", "SHOULDERS_SIDE", "SHOULDERS_REAR"],
    biceps: ["BICEPS"],
    triceps: ["TRICEPS"],
    abs: ["CORE"],
    obliques: ["OBLIQUES"],
    lats: ["LATS"],
    "upper-back": ["RHOMBOIDS"],
    "lower-back": ["BACK_LOWER"],
    traps: ["TRAPEZIUS"],
    forearms: ["FOREARMS"],
    quads: ["QUADS"],
    hamstrings: ["HAMSTRINGS"],
    glutes: ["GLUTES"],
    calves: ["CALVES"],
    adductors: ["ADDUCTORS"],
    abductors: ["ABDUCTORS"],
    "hip-flexors": ["ADDUCTORS"],
  };

  const GROUP_ES = {
    CHEST: "Pectorales",
    SHOULDERS_FRONT: "Deltoides (frente)",
    SHOULDERS_SIDE: "Deltoides (lateral)",
    SHOULDERS_REAR: "Deltoides (posterior)",
    BICEPS: "Bíceps",
    TRICEPS: "Tríceps",
    CORE: "Abdomen",
    OBLIQUES: "Oblicuos",
    LATS: "Dorsales",
    RHOMBOIDS: "Espalda alta",
    BACK_LOWER: "Zona lumbar",
    TRAPEZIUS: "Trapecio",
    FOREARMS: "Antebrazos",
    QUADS: "Cuádriceps",
    HAMSTRINGS: "Isquiotibiales",
    GLUTES: "Glúteos",
    CALVES: "Gemelos",
    ADDUCTORS: "Aductores",
    ABDUCTORS: "Abductores",
  };

  function mix(a, b, t) {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const A = p(a), B = p(b);
    const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
    return "rgb(" + c.join(",") + ")";
  }

  function heat(t) {
    const x = Math.max(0, Math.min(1, t));
    if (x <= 0) return "rgba(80,88,98,.28)";
    if (x < 0.55) return mix("#4a6f62", "#5a9e88", x / 0.55);
    return mix("#5a9e88", "#c3a256", (x - 0.55) / 0.45);
  }

  function groupScores(work) {
    const out = {};
    const scores = (work && work.scores) || {};
    Object.keys(scores).forEach((id) => {
      const groups = OUR_TO_CHART[id] || [];
      groups.forEach((g) => {
        out[g] = (out[g] || 0) + Number(scores[id] || 0);
      });
    });
    return out;
  }

  function photoFor(sex, view) {
    const s = sex === "female" ? "female" : "male";
    const v = view === "BACK" ? "back" : "front";
    return "assets/vendor/musclemap/" + s + "-" + v + ".webp";
  }

  function renderOne(work, figure, view, uid) {
    const Bodies = root.MuscleMapBodies;
    if (!Bodies) return `<div class="tr-body-fallback">Mapa muscular no disponible.</div>`;
    const diagram = Bodies.get(figure, view);
    if (!diagram) return "";
    const grouped = groupScores(work);
    const max = Object.keys(grouped).reduce((m, k) => Math.max(m, grouped[k]), 0) || (work && work.max) || 0;
    const bodyPath = ((diagram.outline || []).find((p) => p.id === "BODY") || (diagram.outline || [])[0] || {}).d || "";
    const clip = "mmclip-" + uid;
    const muscles = (diagram.muscles || []).map((p) => {
      const v = grouped[p.group] || 0;
      const t = max ? v / max : 0;
      const label = GROUP_ES[p.group] || p.group;
      return `<path class="tr-mm-m" data-group="${p.group}" d="${p.d}" fill="${heat(t)}" fill-opacity="${t ? 0.88 : 0.18}">
        <title>${label}${t ? " · " + Math.round(t * 100) + "%" : ""}</title></path>`;
    }).join("");
    const vb = diagram.viewBox || "0 0 1024 1536";
    const [vx, vy, vw, vh] = vb.split(/\s+/).map(Number);
    return `<svg class="tr-mm" viewBox="${vb}" role="img" aria-label="${view === "BACK" ? "Espalda" : "Frente"}">
      <defs>
        <clipPath id="${clip}">${bodyPath ? `<path d="${bodyPath}"/>` : `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}"/>`}</clipPath>
      </defs>
      <image href="${photoFor(figure, view)}" x="${vx}" y="${vy}" width="${vw}" height="${vh}"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})" class="tr-mm-photo"></image>
      <g class="tr-mm-muscles" clip-path="url(#${clip})">${muscles}</g>
    </svg>`;
  }

  function mapsHTML(work, figure) {
    const fig = figure === "female" ? "female" : "male";
    const t = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `<div class="tr-maps">
      <figure class="tr-mapcard">
        <figcaption>Frente</figcaption>
        ${renderOne(work, fig, "FRONT", t + "f")}
      </figure>
      <figure class="tr-mapcard">
        <figcaption>Espalda</figcaption>
        ${renderOne(work, fig, "BACK", t + "b")}
      </figure>
    </div>`;
  }

  root.MuscleMapView = {
    OUR_TO_CHART: OUR_TO_CHART,
    GROUP_ES: GROUP_ES,
    groupScores: groupScores,
    heat: heat,
    mapsHTML: mapsHTML,
    renderOne: renderOne,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
