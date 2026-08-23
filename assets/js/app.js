/* ============================================================
   HEALTHYHEAD — App (router SPA + render)
   ============================================================ */

const app = document.getElementById("app");
try { document.documentElement.dataset.theme = localStorage.getItem("hh-theme") || "dark"; } catch (e) { /* noop */ }

/* ---------- Iconografía SVG (línea sobria) ---------- */
const MOTIF = {
  cardio: '<path d="M12 20.5C12 20.5 4 14.2 4 8.9 4 6.2 6 4.2 8.5 4.2c1.6 0 2.9.9 3.5 2.1.6-1.2 1.9-2.1 3.5-2.1C18 4.2 20 6.2 20 8.9c0 1.2-.4 2.3-1 3.4"/><path d="M3 13h4l1.8-3 2.4 6 1.8-4 1.5 2H21"/>',
  nutricion: '<path d="M12 8.5C10.8 5.7 7.2 5 5.4 7.1c-1.9 2.3-1.2 6.9 1.4 9.4 1.3 1.3 2.7 2.1 3.7 2.1s2.4-.8 3.7-2.1c2.6-2.5 3.3-7.1 1.4-9.4C13.8 5 11.2 5.6 12 8.5Z"/><path d="M12 8.5V4.5c0-1 .9-1.7 2-1.7"/>',
  sueno: '<path d="M20 13.5A7.5 7.5 0 1 1 10.5 4 6 6 0 0 0 20 13.5Z"/>',
  mente: '<path d="M9.5 20v-2.2A5.2 5.2 0 0 1 7 8.3 4.4 4.4 0 0 1 15.2 7a3.9 3.9 0 0 1 1.6 7.2"/><path d="M12 6.5v13.5"/><path d="M12 11h3"/>',
  fuerza: '<path d="M6.5 8.5v7M4 10v4M17.5 8.5v7M20 10v4M6.5 12h11"/>',
  longevidad: '<path d="M3 12h4l1.8-4 2.6 8 1.8-5 1.3 1.5H21"/>',
};
const MED_GLYPH = '<path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="9"/>';
const BAN_GLYPH = '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>';
const UI_ICON = {
  areas: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  tier: '<path d="M6 4h12v3a6 6 0 0 1-12 0z"/><path d="M12 13v3M9 20h6"/>',
  tool: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h4M8 15h2M12 15h4"/>',
  rec: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9.5 4h5v2.5h-5z"/><path d="M9 12h6M9 16h4"/>',
  imc: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-4"/>',
  agua: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  regla: '<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  noticia: '<path d="M10 3h4M11 3v5L7 17a2 2 0 0 0 1.8 3h6.4A2 2 0 0 0 17 17l-4-9V3"/><path d="M9 13h6"/>',
};
function svgIcon(paths, size, cls) {
  return `<svg class="glyph ${cls || ""}" viewBox="0 0 24 24" width="${size || 22}" height="${size || 22}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
function glyph(id, size) { return svgIcon(MOTIF[id] || MED_GLYPH, size || 20, "dim"); }

function coverSVG(a) {
  const p = MOTIF[a.id] || MED_GLYPH;
  return `<svg class="cover-svg" viewBox="0 0 320 124" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="124" fill="${a.color}" opacity="0.09"/>
    <g transform="translate(160 62) scale(2.4) translate(-12 -12)" fill="none" stroke="${a.color}" stroke-opacity="0.5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</g>
  </svg>`;
}
let COVERS = {};
function coverHTML(a, cls) {
  const custom = COVERS[a.id];
  const inner = custom ? `<img src="${custom}" alt="${a.nombre}">` : coverSVG(a);
  return `<div class="cover ${cls || ""}">${inner}</div>`;
}

/* ---------- Tema claro / oscuro ---------- */
const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1"/>';
const MOON = MOTIF.sueno;
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("hh-theme", t); } catch (e) { /* noop */ }
  const btn = document.getElementById("themeToggle");
  if (btn) { btn.innerHTML = svgIcon(t === "light" ? MOON : SUN, 18); btn.title = t === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"; }
}
function initTheme() {
  applyTheme(document.documentElement.dataset.theme || "dark");
  document.getElementById("themeToggle")?.addEventListener("click", () =>
    applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));
}

/* ---------- Ejercicios (dataset Gym Visual) ---------- */
const GYM_GRUPOS = [
  { id: "chest", n: "Pecho" }, { id: "back", n: "Espalda" }, { id: "upper legs", n: "Piernas" },
  { id: "upper arms", n: "Brazos" }, { id: "shoulders", n: "Hombros" }, { id: "waist", n: "Core" },
  { id: "lower legs", n: "Pantorrillas" }, { id: "lower arms", n: "Antebrazos" },
  { id: "cardio", n: "Cardio" }, { id: "neck", n: "Cuello" },
];
const MG_ES = {
  abs: "Abdomen", biceps: "Bíceps", triceps: "Tríceps", pectorals: "Pectorales", lats: "Dorsales",
  "upper back": "Espalda alta", "lower back": "Zona lumbar", "serratus anterior": "Serrato",
  delts: "Deltoides", traps: "Trapecio", forearms: "Antebrazos", quads: "Cuádriceps",
  hamstrings: "Isquiotibiales", glutes: "Glúteos", calves: "Gemelos", adductors: "Aductores",
  abductors: "Abductores", "hip flexors": "Flexores de cadera", spine: "Columna",
  "cardiovascular system": "Sistema cardiovascular", "levator scapulae": "Elevador de la escápula", soleus: "Sóleo",
  shoulders: "Hombros", chest: "Pecho", back: "Espalda", "upper arms": "Brazos", "upper legs": "Muslos",
  "lower legs": "Pantorrillas", "lower arms": "Antebrazos", waist: "Core", neck: "Cuello", cardio: "Cardio",
  deltoids: "Deltoides", trapezius: "Trapecio", obliques: "Oblicuos", brachialis: "Braquial",
  brachioradialis: "Braquiorradial", "wrist flexors": "Flexores de muñeca", "wrist extensors": "Extensores de muñeca",
  pectoralis: "Pectorales", quadriceps: "Cuádriceps", "rectus abdominis": "Recto abdominal", "gluteus maximus": "Glúteo mayor",
};
const EQUIP_ES = {
  "body weight": "Peso corporal", dumbbell: "Mancuerna", cable: "Polea", barbell: "Barra",
  "leverage machine": "Máquina", band: "Banda elástica", "smith machine": "Máquina Smith",
  kettlebell: "Pesa rusa", weighted: "Con peso", "stability ball": "Fitball", "ez barbell": "Barra Z",
  assisted: "Asistido", "medicine ball": "Balón medicinal", "resistance band": "Banda elástica",
  rope: "Cuerda", roller: "Rodillo", "olympic barbell": "Barra olímpica", "elliptical machine": "Elíptica",
  "stationary bike": "Bici estática", "sled machine": "Trineo", "upper body ergometer": "Ergómetro",
  tire: "Neumático", hammer: "Martillo", "bosu ball": "Bosu", "wheel roller": "Rueda abdominal", trap: "Barra hexagonal",
};
const esWord = (map, n) => map[(n || "").toLowerCase()] || (n || "");

/* ---------- Helpers ---------- */
const area = (id) => DB.areas.find((a) => a.id === id);
const obj = (id) => DB.objetivos[id];
const esp = (id) => DB.especialistas[id];
const guia = (id) => DB.guias[id];
const articulo = (id) => DB.articulos.find((a) => a.id === id);
const evClass = (ev) => "ev-" + ev.toLowerCase().replace(/\s+/g, "-");
const succPill = (pct) => `<span class="succ-pill">Éxito estimado en la población: ${pct}%</span>`;

function articleRow(art) {
  const a = area(art.area);
  const e = esp(art.autor);
  return `<a class="news-row" href="#/articulo/${art.id}">
    <div class="news-ico">${glyph(a.id, 22)}</div>
    <div class="news-main">
      <div class="news-title">${art.titulo}</div>
      <div class="news-excerpt">${art.extracto}</div>
      <div class="news-meta"><span class="tag">${art.etiqueta}</span><span>${a.nombre}</span><span>·</span><span>${e.nombre}</span><span>·</span><span>${art.fecha}</span></div>
    </div>
  </a>`;
}

function areaCard(a) {
  return `<a class="area-card" href="#/area/${a.id}">
    ${coverHTML(a, "thumb")}
    <div class="ac-body">
      <div class="ac-type">${a.tipo}</div>
      <div class="ac-name">${a.nombre}</div>
      <div class="ac-lema">${a.lema}</div>
      <div class="ac-specs">${a.specs.map((s) => `<span class="chip">${s.nombre}</span>`).join("")}</div>
    </div>
  </a>`;
}

/* ============================================================
   VISTAS
   ============================================================ */
function viewHome() {
  const feats = DB.articulos.slice(0, 4);
  const featSlides = feats.map((art) => {
    const a = area(art.area);
    return `<div class="car-slide"><a class="feat-slide" href="#/articulo/${art.id}">
      <div class="fs-cover">${coverHTML(a)}</div>
      <div class="fs-body">
        <span class="tag" style="align-self:flex-start">${art.etiqueta}</span>
        <div class="fs-title">${art.titulo}</div>
        <div class="fs-ex">${art.extracto}</div>
        <span class="btn primary" style="align-self:flex-start;margin-top:6px">Leer guía →</span>
      </div>
    </a></div>`;
  }).join("");

  const areaSlides = DB.areas.map((a) => `<div class="car-slide">${areaCard(a)}</div>`).join("");

  const entradas = [
    { t: "Áreas de salud", d: "Guías clínicas completas por sistema.", h: "#/areas", i: "areas" },
    { t: "Entrenar", d: "Plan semanal, sesión guiada, PRs y peso.", h: "#/entrenar", i: "fuerza" },
    { t: "Ejercicios", d: "Biblioteca ilustrada por grupo muscular.", h: "#/ejercicios", i: "ejercicio" },
    { t: "Tier list", d: "Qué priorizar según evidencia e impacto.", h: "#/tierlist", i: "tier" },
    { t: "Herramientas", d: "Calculadoras: IMC, calorías, sueño y más.", h: "#/herramientas", i: "tool" },
    { t: "Mis recomendaciones", d: "Cribados y vacunas para tu perfil (health.gov).", h: "#/recomendaciones", i: "rec" },
  ].map((e) => `<a class="entry-card reveal" href="${e.h}">
      <div class="ec-ico">${svgIcon(UI_ICON[e.i] || MOTIF.fuerza, 24)}</div>
      <div class="ec-title">${e.t}</div><div class="ec-desc">${e.d}</div></a>`).join("");

  return `
    <section class="hero reveal">
      <h1>Tu salud, organizada por <span>evidencia</span></h1>
      <p>Una base de datos de salud con la estructura de una guía de juego: cada área clínica reúne sus
      estrategias, la valoración de sus especialistas y una clasificación por nivel de evidencia. Empieza
      por lo que de verdad reduce el riesgo.</p>
      <div class="hero-cta">
        <a class="btn primary" href="#/entrenar">Entrenar hoy</a>
        <a class="btn" href="#/areas">Explorar áreas</a>
        <a class="btn" href="#/herramientas">Herramientas</a>
      </div>
    </section>

    <div class="caps-head">Guías destacadas</div>
    <div class="carousel full" data-autoplay="1">
      <button class="car-nav car-prev" aria-label="Anterior">‹</button>
      <div class="car-track">${featSlides}</div>
      <button class="car-nav car-next" aria-label="Siguiente">›</button>
      <div class="car-dots"></div>
    </div>

    <div class="caps-head">Explora Healthyhead</div>
    <div class="entry-grid">${entradas}</div>

    <div class="caps-head">Áreas de salud</div>
    <div class="carousel row">
      <button class="car-nav car-prev" aria-label="Anterior">‹</button>
      <div class="car-track">${areaSlides}</div>
      <button class="car-nav car-next" aria-label="Siguiente">›</button>
    </div>

    <div class="hoy-strip reveal" style="margin-top:22px">
      <span class="hs-label">Hoy</span>
      <span class="hs-text" id="tipRotator">${DB.hoy.tips[0]}</span>
    </div>

    <div class="caps-head">Noticias de salud<a class="ph-more" style="margin-left:auto;font-size:12px" href="#/noticias">Ver todas →</a></div>
    <div id="homeNews"></div>

    <div class="disclaimer-inline">Las tasas de éxito son estimaciones ilustrativas basadas en la literatura de salud pública, destinadas a priorizar intervenciones. No sustituyen la valoración de un profesional sanitario.</div>
  `;
}

function viewAreas() {
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Áreas</div>
    <h2 class="section-title">Áreas de salud</h2>
    <p class="section-sub">Cada área clínica incluye una guía completa con sus enfoques y sus estrategias de hábitos.</p>
    <div class="area-grid">${DB.areas.map((a) => `<div class="reveal">${areaCard(a)}</div>`).join("")}</div>
  `;
}

/* ---------- GUÍA DE ÁREA ---------- */
function viewArea(id) {
  const a = area(id);
  if (!a) return viewNotFound();
  const g = guia(id);
  const autor = esp(g.autor);
  const specs = a.specs.map((s) => `<div class="spec-card"><div class="sc-role">${s.rol}</div>
      <div class="sc-name">${s.nombre}</div><div class="sc-desc">${s.desc}</div></div>`).join("");
  const strats = a.objetivos.map(stratCard).join("");
  const beneficios = g.beneficios.map((b) => `<li>${b}</li>`).join("");
  const precauciones = g.precauciones.map((p) => `<li>${p}</li>`).join("");
  const faq = g.faq.map((f) => `<details class="faq-item"><summary>${f.q}</summary><div class="faq-a">${f.a}</div></details>`).join("");
  const refs = g.referencias.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${r.fuente}<span class="r-ext">Fuente externa ↗</span></a></li>`).join("");
  const best = a.objetivos.map(obj).sort((x, y) => y.exito - x.exito)[0];

  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span><a href="#/areas">Áreas</a><span class="sep">›</span>${a.nombre}</div>

    <section class="guide-hero">
      ${coverHTML(a)}
      <div class="gh-pad">
        <div class="gh-top">
          <div><div class="gh-type">${a.tipo}</div><h1>Guía de ${a.nombre}</h1></div>
          <button class="btn upload-btn" onclick="uploadCover('${a.id}')">Cambiar portada</button>
        </div>
        <p class="gh-lema">“${a.lema}”</p>
        <div class="gh-byline">
          <span>Revisado por <b>${autor.nombre}</b></span><span>·</span>
          <span>Actualizado: <b>${g.actualizado}</b></span><span>·</span><span>Temporada Verano 2026</span>
        </div>
      </div>
    </section>

    <nav class="guide-tabs">
      <a href="#/area/${id}#overview">Overview</a>
      <a href="#/area/${id}#enfoques">Enfoques</a>
      <a href="#/area/${id}#cheat">Cheat sheet</a>
      <a href="#/area/${id}#builds">Builds</a>
      <a href="#/area/${id}#faq">Preguntas</a>
      <a href="#/area/${id}#referencias">Referencias</a>
    </nav>

    <div class="guide-layout">
      <aside class="guide-toc">
        <div class="toc-head">En esta guía</div>
        <a href="#/area/${id}#overview">Overview</a>
        <a href="#/area/${id}#beneficios">Beneficios y precauciones</a>
        <a href="#/area/${id}#enfoques">Enfoques (specs)</a>
        <a href="#/area/${id}#cheat">Cheat sheet</a>
        <a href="#/area/${id}#builds">Builds de hábitos</a>
        <a href="#/area/${id}#faq">Preguntas frecuentes</a>
        <a href="#/area/${id}#referencias">Referencias</a>
      </aside>

      <div>
        <p class="prose" style="color:var(--text-dim)">${g.resumen}</p>

        <div class="caps-head" id="overview">${a.nombre} — Overview</div>
        <div class="prose"><p>${g.overview}</p></div>

        <div class="caps-head" id="beneficios">Beneficios y precauciones</div>
        <div class="sw-table">
          <div class="sw-col good"><h4>Beneficios</h4><ul>${beneficios}</ul></div>
          <div class="sw-col bad"><h4>Precauciones</h4><ul>${precauciones}</ul></div>
        </div>

        <div class="caps-head" id="enfoques">Enfoques (specs)</div>
        <div class="spec-grid">${specs}</div>

        <div class="caps-head" id="cheat">Cheat sheet</div>
        <div class="cheat-box">
          <div class="cb-head">${a.nombre} — Resumen accionable</div>
          <div class="cb-body">
            <div class="cheat-line"><span class="cl-k">Empieza por</span><span class="cl-v"><a href="#/objetivo/${a.objetivos[0]}">${best.titulo}</a> <span class="badge ${evClass(best.evidencia)}" style="margin-left:6px">Evidencia: ${best.evidencia}</span></span></div>
            <div class="cheat-line"><span class="cl-k">Primer paso</span><span class="cl-v">${best.pasos[0]}</span></div>
            <div class="cheat-line"><span class="cl-k">Éxito estimado</span><span class="cl-v">${succPill(best.exito)}</span></div>
            <div class="cheat-line"><span class="cl-k">Revisado por</span><span class="cl-v">${autor.nombre}</span></div>
            <div class="cheat-line"><span class="cl-k">Consejo clínico</span><span class="cl-v">${best.tips}</span></div>
          </div>
        </div>

        <div class="caps-head" id="builds">Builds de hábitos</div>
        <p class="section-sub">Cada estrategia tiene su propia cheat sheet de cómo aplicarla, con sus pasos.</p>
        <div class="strat-list">${strats}</div>

        <div class="caps-head" id="faq">Preguntas frecuentes</div>
        ${faq}

        <div class="caps-head">Noticias recientes</div>
        <p class="section-sub">Actualidad en español relacionada con esta área (fuente: Google Noticias).</p>
        <div id="areaNews"></div>

        <div class="caps-head" id="referencias">Referencias y fuentes</div>
        <ul class="refs">${refs}</ul>
        <div class="disclaimer-inline">Contenido educativo basado en el consenso de estas organizaciones. No sustituye la valoración de un profesional que conozca tu caso.</div>
      </div>
    </div>
  `;
}

function stratCard(oid) {
  const o = obj(oid);
  if (!o) return "";
  return `<div class="strat-card">
    <div class="strat-head">
      <h3><a href="#/objetivo/${oid}">${o.titulo}</a></h3>
      <div class="meta-badges">
        <span class="badge">Dificultad: ${o.dificultad}</span>
        <span class="badge ${evClass(o.evidencia)}">Evidencia: ${o.evidencia}</span>
      </div>
    </div>
    <div class="strat-body">
      <p class="strat-resumen">${o.resumen}</p>
      <div style="margin-bottom:10px">${succPill(o.exito)}</div>
      <ol class="strat-steps">${o.pasos.map((p) => `<li>${p}</li>`).join("")}</ol>
      <div style="margin-top:12px"><a class="btn" href="#/objetivo/${oid}">Ver cheat sheet completa →</a></div>
    </div>
  </div>`;
}

/* ---------- CHEAT SHEET DE INTERVENCIÓN ---------- */
function viewObjetivo(id) {
  const o = obj(id);
  if (!o) return viewNotFound();
  const a = area(o.area);
  const g = guia(a.id);
  const autor = esp(g.autor);
  const steps = o.pasos.map((p, i) => `<div class="cs"><span class="n">${i + 1}</span><span>${p}</span></div>`).join("");
  const otras = a.objetivos.filter((x) => x !== id)
    .map((x) => `<a class="chip" href="#/objetivo/${x}">${obj(x).titulo}</a>`).join("");

  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span><a href="#/area/${a.id}">${a.nombre}</a><span class="sep">›</span>${o.titulo}</div>

    <section class="guide-hero">
      <div class="gh-pad">
        <div class="gh-type">${a.nombre} · Cheat sheet de intervención</div>
        <h1>${glyph(a.id, 22)} ${o.titulo}</h1>
        <p class="gh-lema" style="font-style:normal;color:var(--text-dim)">${o.resumen}</p>
        <div class="gh-byline">
          <span class="badge">Dificultad: ${o.dificultad}</span>
          <span class="badge ${evClass(o.evidencia)}">Evidencia: ${o.evidencia}</span>
          <span>${succPill(o.exito)}</span>
        </div>
      </div>
    </section>

    <div class="caps-head">Cómo hacerlo, paso a paso</div>
    <div class="cheat-box"><div class="cb-body"><div class="cheat-steps">${steps}</div></div></div>

    <div class="caps-head">Ficha rápida</div>
    <div class="cheat-box"><div class="cb-body">
      <div class="cheat-line"><span class="cl-k">Consejo clínico</span><span class="cl-v">${o.tips}</span></div>
      <div class="cheat-line"><span class="cl-k">Nivel de evidencia</span><span class="cl-v">${o.evidencia}</span></div>
      <div class="cheat-line"><span class="cl-k">Dificultad</span><span class="cl-v">${o.dificultad}</span></div>
      <div class="cheat-line"><span class="cl-k">Área</span><span class="cl-v"><a href="#/area/${a.id}">${a.nombre}</a></span></div>
      <div class="cheat-line"><span class="cl-k">Revisado por</span><span class="cl-v">${autor.nombre}</span></div>
    </div></div>

    ${otras ? `<div class="caps-head">Otras estrategias de ${a.nombre}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${otras}</div>` : ""}
    <div style="margin-top:18px"><a class="btn" href="#/area/${a.id}">← Volver a la guía de ${a.nombre}</a></div>
  `;
}

/* ---------- TIER LIST ---------- */
const TREND = {
  up: { s: "▲", c: "#6aa98a", t: "Al alza" },
  down: { s: "▼", c: "#c98d63", t: "A la baja" },
  flat: { s: "▬", c: "#7c828c", t: "Estable" },
};
function trendTag(tr) { const t = TREND[tr] || TREND.flat; return `<span class="trend" style="color:${t.c}" title="${t.t}">${t.s}</span>`; }

function tierPill(it) {
  if (it.id) {
    const o = obj(it.id);
    const a = area(o.area);
    return `<a class="tier-pill" href="#/objetivo/${it.id}" title="${o.titulo}">
      <span class="tp-ico">${glyph(a.id, 18)}</span>
      <span class="tp-main"><span class="tp-name">${o.titulo}</span><span class="tp-area">${a.nombre}</span></span>
      <span class="tp-meta">${trendTag(it.trend)}<span class="tp-succ">${o.exito}%</span></span>
    </a>`;
  }
  return `<span class="tier-pill inert" title="${it.nombre}">
    <span class="tp-ico">${svgIcon(BAN_GLYPH, 18, "dim")}</span>
    <span class="tp-main"><span class="tp-name">${it.nombre}</span><span class="tp-area">Sin respaldo científico</span></span>
  </span>`;
}

function viewTierList() {
  const tl = DB.tierlist;
  const autor = esp(tl.autor);
  const defOf = (t) => tl.definiciones.find((d) => d.tier === t);

  const disclaimers = tl.disclaimers.map((d) => `<li>${d}</li>`).join("");
  const definiciones = tl.definiciones.map((d) => `<div class="tierdef">
      <div class="td-badge" style="background:${d.color}">${d.tier}</div>
      <div class="td-body"><b style="color:${d.color}">Nivel ${d.tier}</b> — ${d.def}</div>
    </div>`).join("");
  const filtros = tl.definiciones.map((d) => `<button class="tl-filter active" data-tier="${d.tier}" style="--tc:${d.color}">${d.tier}</button>`).join("");

  const rows = tl.ranking.map((r) => {
    const def = defOf(r.tier);
    return `<div class="tier-row" data-tier="${r.tier}">
      <div class="tier-badge" style="background:${def.color}"><span class="tb-letter">${r.tier}</span></div>
      <div class="tier-items">${r.items.map(tierPill).join("")}</div>
    </div>`;
  }).join("");

  const explicaciones = tl.ranking.flatMap((r) => r.items.map((it) => {
    const def = defOf(r.tier);
    if (it.id) {
      const o = obj(it.id);
      const a = area(o.area);
      return `<div class="rank-item reveal">
        <div class="ri-head">${glyph(a.id, 20)}
          <a href="#/objetivo/${it.id}" class="ri-title">${o.titulo}</a>
          <span class="ri-tier" style="background:${def.color}">${r.tier}</span>${trendTag(it.trend)}</div>
        <div class="ri-sub"><a href="#/area/${a.id}">${a.nombre}</a> · Evidencia: <b>${o.evidencia}</b> · Éxito estimado: <b>${o.exito}%</b> · <a href="#/objetivo/${it.id}">Ver cheat sheet →</a></div>
        <p class="ri-why">${it.porque}</p>
      </div>`;
    }
    return `<div class="rank-item reveal">
      <div class="ri-head">${svgIcon(BAN_GLYPH, 20, "dim")}
        <span class="ri-title">${it.nombre}</span>
        <span class="ri-tier" style="background:${def.color}">${r.tier}</span></div>
      <div class="ri-sub">Sin respaldo científico suficiente</div>
      <p class="ri-why">${it.porque}</p>
    </div>`;
  })).join("");

  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Tier list</div>

    <section class="guide-hero">
      <div class="gh-pad">
        <div class="gh-type">Rankings · Intervenciones de salud</div>
        <h1>Tier list de intervenciones de salud</h1>
        <div class="gh-byline">
          <span>Revisado por <b>${autor.nombre}</b></span><span>·</span>
          <span>Actualizado: <b>${tl.actualizado}</b></span><span>·</span><span>${tl.version}</span>
        </div>
      </div>
    </section>

    <p class="prose" style="color:var(--text-dim);margin-top:14px">${tl.intro}</p>

    <div class="caps-head">Aclaraciones sobre esta tier list</div>
    <ul class="disc-list">${disclaimers}</ul>

    <div class="caps-head">Cómo clasificamos cada nivel</div>
    <div class="tierdefs">${definiciones}</div>

    <div class="caps-head">Tier list · Temporada Verano 2026</div>
    <p class="section-sub">Cada intervención enlaza a su cheat sheet de cómo aplicarla.</p>
    <div class="tl-filters" id="tlFilters"><span class="tlf-label">Mostrar niveles:</span> ${filtros}</div>
    <div id="tierRows">${rows}</div>

    <div class="caps-head">Rankings y explicaciones</div>
    <p class="section-sub">Justificación de la posición de cada intervención.</p>
    <div class="rank-list">${explicaciones}</div>

    <div class="disclaimer-inline">La clasificación es una guía de priorización, no una norma rígida. La mejor intervención es la que puedes sostener en el tiempo y la que indique tu situación clínica.</div>
  `;
}

function initTierFilters() {
  const bar = document.getElementById("tlFilters");
  if (!bar) return;
  bar.querySelectorAll(".tl-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      const row = document.querySelector(`#tierRows .tier-row[data-tier="${btn.dataset.tier}"]`);
      if (row) row.style.display = btn.classList.contains("active") ? "" : "none";
    });
  });
}

/* ---------- HERRAMIENTAS / CALCULADORAS ---------- */
function toolCard(icon, title, desc, bodyHTML, outId) {
  return `<div class="tool-card">
    <div class="tc-head">${svgIcon(UI_ICON[icon] || MED_GLYPH, 20)} ${title}</div>
    <div class="tc-body"><p>${desc}</p>${bodyHTML}<div class="tool-out" id="${outId}"></div></div>
  </div>`;
}
function field(label, inner) { return `<div class="field"><label>${label}</label>${inner}</div>`; }
function actSelect(id) {
  return `<select id="${id}">
    <option value="1.2">Sedentario</option>
    <option value="1.375">Ligero (1-3 días/sem)</option>
    <option value="1.55" selected>Moderado (3-5 días/sem)</option>
    <option value="1.725">Alto (6-7 días/sem)</option>
    <option value="1.9">Muy alto</option></select>`;
}

function viewHerramientas() {
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Herramientas</div>
    <h2 class="section-title">Herramientas y calculadoras de salud</h2>
    <p class="section-sub">Calculadoras con fórmulas de referencia (OMS, CDC, AHA). Todo se calcula en tu dispositivo; nada se envía a ningún servidor.</p>

    <div class="tools-grid">
      ${toolCard("imc", "Índice de Masa Corporal (IMC)", "Relación entre tu peso y tu estatura.",
        `<div class="tool-row">
          ${field("Peso (kg)", `<input id="imc-peso" type="number" value="70" min="20" max="300">`)}
          ${field("Altura (cm)", `<input id="imc-altura" type="number" value="170" min="100" max="230">`)}
          <button class="btn primary" onclick="calcIMC()">Calcular</button>
        </div>`, "imc-out")}

      ${toolCard("tool", "Calorías diarias (TDEE)", "Energía que gastas al día según tu actividad.",
        `<div class="tool-row">
          ${field("Sexo", `<select id="tdee-sexo"><option value="male">Masculino</option><option value="female">Femenino</option></select>`)}
          ${field("Edad", `<input id="tdee-edad" type="number" value="35" min="14" max="100">`)}
          ${field("Peso (kg)", `<input id="tdee-peso" type="number" value="70">`)}
          ${field("Altura (cm)", `<input id="tdee-altura" type="number" value="170">`)}
          ${field("Actividad", actSelect("tdee-act"))}
          <button class="btn primary" onclick="calcTDEE()">Calcular</button>
        </div>`, "tdee-out")}

      ${toolCard("reloj", "Zonas de frecuencia cardiaca", "Rangos de pulso para entrenar (fórmula de Tanaka).",
        `<div class="tool-row">
          ${field("Edad", `<input id="fc-edad" type="number" value="35" min="14" max="100">`)}
          <button class="btn primary" onclick="calcFC()">Calcular</button>
        </div>`, "fc-out")}

      ${toolCard("reloj", "Hora de acostarte", "Basado en ciclos de sueño de ~90 minutos.",
        `<div class="tool-row">
          ${field("¿A qué hora te levantas?", `<input id="sleep-wake" type="time" value="07:00">`)}
          <button class="btn primary" onclick="calcSueno()">Calcular</button>
        </div>`, "sleep-out")}

      ${toolCard("agua", "Ingesta de agua diaria", "Estimación según tu peso y ejercicio.",
        `<div class="tool-row">
          ${field("Peso (kg)", `<input id="agua-peso" type="number" value="70">`)}
          ${field("Bloques de ejercicio (30 min)", `<input id="agua-ej" type="number" value="1" min="0" max="10">`)}
          <button class="btn primary" onclick="calcAgua()">Calcular</button>
        </div>`, "agua-out")}

      ${toolCard("regla", "Índice cintura-altura", "Indicador de grasa abdominal y riesgo cardiovascular.",
        `<div class="tool-row">
          ${field("Cintura (cm)", `<input id="ca-cintura" type="number" value="85">`)}
          ${field("Altura (cm)", `<input id="ca-altura" type="number" value="170">`)}
          <button class="btn primary" onclick="calcCintura()">Calcular</button>
        </div>`, "ca-out")}
    </div>

    <div class="disclaimer-inline">Estas calculadoras ofrecen estimaciones educativas con fórmulas poblacionales; no son un diagnóstico. Ante cualquier duda o valor fuera de rango, consulta a un profesional sanitario.</div>
  `;
}

const val = (id) => { const e = document.getElementById(id); return e ? e.value : ""; };
function showOut(id, html) { const e = document.getElementById(id); if (e) { e.innerHTML = html; e.classList.add("show"); } }
function scaleHTML(segs, idx) {
  return `<div class="to-scale">${segs.map((s, i) => `<div class="to-seg" style="${i === idx ? "background:var(--brand);color:#12130f;font-weight:800" : ""}">${s}</div>`).join("")}</div>`;
}

function calcIMC() {
  const p = +val("imc-peso"), h = +val("imc-altura") / 100;
  if (!p || !h) return;
  const bmi = p / (h * h);
  let cat, idx;
  if (bmi < 18.5) { cat = "Bajo peso"; idx = 0; }
  else if (bmi < 25) { cat = "Peso normal"; idx = 1; }
  else if (bmi < 30) { cat = "Sobrepeso"; idx = 2; }
  else { cat = "Obesidad"; idx = 3; }
  showOut("imc-out", `<div class="to-big">${bmi.toFixed(1)} <span style="font-size:14px;color:var(--text-dim)">kg/m²</span></div>
    <div class="to-cat">${cat}</div>
    ${scaleHTML(["Bajo peso", "Normal", "Sobrepeso", "Obesidad"], idx)}
    <div class="to-note">Clasificación de la OMS. El IMC no distingue masa muscular de grasa: interprétalo junto a otros indicadores.</div>`);
}
function calcTDEE() {
  const sexo = val("tdee-sexo"), edad = +val("tdee-edad"), peso = +val("tdee-peso"), alt = +val("tdee-altura"), act = +val("tdee-act");
  if (!edad || !peso || !alt) return;
  const bmr = 10 * peso + 6.25 * alt - 5 * edad + (sexo === "male" ? 5 : -161);
  const tdee = Math.round(bmr * act);
  showOut("tdee-out", `<div class="to-big">${tdee} <span style="font-size:14px;color:var(--text-dim)">kcal/día</span></div>
    <div class="to-cat">Para mantener tu peso</div>
    <div class="to-note">Perder grasa: ~${tdee - 500} kcal/día · Ganar músculo: ~${tdee + 300} kcal/día. Estimación con la fórmula de Mifflin-St Jeor; ajústala según tu evolución real.</div>`);
}
function calcFC() {
  const edad = +val("fc-edad");
  if (!edad) return;
  const max = Math.round(208 - 0.7 * edad);
  const z = (a, b) => `${Math.round(max * a)}–${Math.round(max * b)} lpm`;
  showOut("fc-out", `<div class="to-big">${max} <span style="font-size:14px;color:var(--text-dim)">lpm máx.</span></div>
    <div class="to-note" style="margin-top:2px">Fórmula de Tanaka (208 − 0,7 × edad).</div>
    <div style="display:grid;gap:5px;margin-top:10px;font-size:13px">
      <div><b style="color:var(--brand)">Zona 2 · base aeróbica:</b> ${z(0.6, 0.7)}</div>
      <div>Zona 3 · aeróbico: ${z(0.7, 0.8)}</div>
      <div>Zona 4 · umbral: ${z(0.8, 0.9)}</div>
      <div>Zona 5 · máximo: ${z(0.9, 1)}</div>
    </div>`);
}
function calcSueno() {
  const wake = val("sleep-wake");
  if (!wake) return;
  const [hh, mm] = wake.split(":").map(Number);
  const base = new Date(); base.setHours(hh, mm, 0, 0);
  const fmt = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const times = [6, 5, 4].map((c) => ({ c, t: fmt(new Date(base.getTime() - (c * 90 + 15) * 60000)) }));
  showOut("sleep-out", `<div class="to-cat">Para despertar a las ${wake}, acuéstate a:</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
      ${times.map((x) => `<div style="text-align:center;padding:9px 14px;background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius)">
        <div class="to-big" style="font-size:20px">${x.t}</div>
        <div class="to-note" style="margin:2px 0 0">${x.c} ciclos · ${x.c * 1.5} h</div></div>`).join("")}
    </div>
    <div class="to-note">Ciclos de ~90 min más 15 min para conciliar el sueño. La mayoría de adultos necesita entre 7 y 9 horas.</div>`);
}
function calcAgua() {
  const peso = +val("agua-peso"), ej = +val("agua-ej") || 0;
  if (!peso) return;
  const ml = Math.round(peso * 35 + ej * 350);
  showOut("agua-out", `<div class="to-big">${(ml / 1000).toFixed(1)} <span style="font-size:14px;color:var(--text-dim)">litros/día</span></div>
    <div class="to-note">≈ ${ml} ml (35 ml/kg + 350 ml por cada bloque de 30 min de ejercicio). Incluye el agua de alimentos y otras bebidas. Aumenta la ingesta con calor, fiebre o esfuerzo intenso.</div>`);
}
function calcCintura() {
  const c = +val("ca-cintura"), h = +val("ca-altura");
  if (!c || !h) return;
  const r = c / h;
  let cat, idx;
  if (r < 0.5) { cat = "Saludable"; idx = 0; }
  else if (r < 0.6) { cat = "Riesgo elevado"; idx = 1; }
  else { cat = "Riesgo alto"; idx = 2; }
  showOut("ca-out", `<div class="to-big">${r.toFixed(2)}</div><div class="to-cat">${cat}</div>
    ${scaleHTML(["Saludable", "Elevado", "Alto"], idx)}
    <div class="to-note">Índice cintura-altura. Objetivo general: mantener la cintura por debajo de la mitad de tu estatura.</div>`);
}

/* ---------- BIBLIOTECA DE EJERCICIOS ---------- */
function viewEjercicios() {
  const chips = [`<button class="ex-filter active" data-grupo="">Todos</button>`]
    .concat(GYM_GRUPOS.map((g) => `<button class="ex-filter" data-grupo="${g.id}">${g.n}</button>`)).join("");
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Ejercicios</div>
    <section class="guide-hero">
      <div class="gh-pad">
        <div class="gh-type">Kinesiología · Preparación física</div>
        <h1>Biblioteca de ejercicios</h1>
        <p class="gh-lema" style="font-style:normal;color:var(--text-dim)">1.324 ejercicios con <b>animación del movimiento</b> e instrucciones en español. Filtra por lo que tienes: las combinaciones sin resultados desaparecen.</p>
        <div class="gh-byline"><span>Ligada a la guía de <a href="#/area/fuerza">Fuerza y Movilidad</a> y a <a href="#/entrenar">Entrenar</a></span></div>
      </div>
    </section>

    <div class="field" style="max-width:360px;margin-bottom:12px"><label>Buscar</label>
      <input id="exSearch" type="search" placeholder="plank, press, zancada…"></div>
    <div class="caps-head">Grupo muscular</div>
    <div class="ex-filters" id="exFilters">${chips}</div>
    <div class="caps-head">Material (se adapta a lo elegido)</div>
    <div class="ex-filters" id="exEquip"></div>
    <div id="exResults"></div>
  `;
}

function exCard(e) {
  const media = e.gif
    ? `<img src="${e.gif}" alt="${e.name}" loading="lazy">`
    : `<div class="ex-ph">${svgIcon(MOTIF.fuerza, 54, "dim")}</div>`;
  const musc = [...new Set([e.target, ...(e.sec || [])].filter(Boolean).map((m) => esWord(MG_ES, m)))];
  const tags = musc.slice(0, 3).map((m) => `<span class="ex-tag">${m}</span>`).join("")
    + (e.equipo ? `<span class="ex-tag eq">${esWord(EQUIP_ES, e.equipo)}</span>` : "");
  const pasos = (e.pasos || []).map((p, i) => `<div class="cs"><span class="n">${i + 1}</span><span>${p}</span></div>`).join("");
  return `<div class="ex-card reveal">
    <div class="ex-media">${media}<span class="ex-badge">GIF</span></div>
    <div class="ex-body">
      <div class="ex-name">${e.name}</div>
      ${tags ? `<div class="ex-tags">${tags}</div>` : ""}
      ${pasos ? `<details class="ex-inst"><summary>Cómo hacerlo</summary><div class="ex-desc"><div class="cheat-steps">${pasos}</div></div></details>` : ""}
    </div>
  </div>`;
}
let exState = { grupo: "", q: "", equipo: [] };
function initEjercicios() {
  const bar = document.getElementById("exFilters");
  if (!bar) return;
  exState = { grupo: "", q: "", equipo: [] };
  bar.querySelectorAll(".ex-filter").forEach((btn) => btn.addEventListener("click", () => {
    bar.querySelectorAll(".ex-filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    exState.grupo = btn.dataset.grupo || "";
    exState.equipo = [];
    loadEjercicios();
  }));
  const search = document.getElementById("exSearch");
  let t;
  search?.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => { exState.q = search.value.trim(); loadEjercicios(); }, 200);
  });
  loadEjercicios();
}
async function loadEjercicios() {
  const box = document.getElementById("exResults");
  if (!box) return;
  box.innerHTML = `<div class="loader"><div class="spin"></div><div style="margin-top:10px">Cargando ejercicios…</div></div>`;
  try {
    const params = new URLSearchParams({ catalog: "1", limit: "48" });
    if (exState.grupo) params.set("grupo", exState.grupo);
    if (exState.q) params.set("q", exState.q);
    if (exState.equipo.length) params.set("equipo", exState.equipo.join(","));
    const res = await fetch(`${API.gym}?${params.toString()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items = data.items || [];
    const eqBar = document.getElementById("exEquip");
    if (eqBar) {
      const counts = data.equipo_counts || {};
      items.forEach((e) => { if (!counts[e.equipo]) counts[e.equipo] = (counts[e.equipo] || 0) + 1; });
      const chips = Object.keys(counts).sort().map((eq) => {
        const on = exState.equipo.indexOf(eq) >= 0;
        return `<button class="ex-filter ${on ? "active" : ""}" data-eq="${eq}">${esWord(EQUIP_ES, eq)} · ${counts[eq]}</button>`;
      }).join("");
      eqBar.innerHTML = chips || `<span class="tr-muted">Sin material compatible con este filtro.</span>`;
      eqBar.querySelectorAll("[data-eq]").forEach((btn) => btn.addEventListener("click", () => {
        const eq = btn.dataset.eq;
        const i = exState.equipo.indexOf(eq);
        if (i >= 0) exState.equipo.splice(i, 1); else exState.equipo.push(eq);
        loadEjercicios();
      }));
    }
    if (!items.length) { box.innerHTML = `<div class="disclaimer-inline">No hay ejercicios para esta combinación. Quita un filtro: las opciones se recortan para no dejarte en cero.</div>`; return; }
    box.innerHTML = `<div class="ex-grid">${items.map(exCard).join("")}</div>
      <div class="disclaimer-inline">${data.total} ejercicios (dataset local: ${data.count || 1324} con GIF). Animaciones de <b>Gym Visual</b> vía <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">hasaneyldrm/exercises-dataset</a> (MIT). <a href="#/entrenar">Añádelos a tu plan →</a></div>`;
    initReveal();
  } catch (err) {
    box.innerHTML = `<div class="notfound"><h3 class="font-head" style="margin:0 0 8px">No se pudieron cargar los ejercicios</h3>
      <p style="color:var(--text-dim)">Ejecuta el proyecto con <b>python server.py</b> para habilitar la biblioteca (sirve el dataset local de ejercicios).</p>
      <p class="api-note">Detalle técnico: ${err.message}</p></div>`;
  }
}

/* ---------- NOTICIAS / INVESTIGACIÓN ---------- */
const NEWS_TEMAS = [
  { id: "general", n: "General" }, { id: "cardio", n: "Corazón" }, { id: "nutricion", n: "Nutrición" },
  { id: "sueno", n: "Sueño" }, { id: "mente", n: "Mente" }, { id: "fuerza", n: "Fitness" },
  { id: "longevidad", n: "Longevidad" }, { id: "clinicas", n: "Clínicas" },
];
let newsFuente = "es", newsTema = "general";

function newsCard(it) {
  const fuente = it.fuente || "ScienceDaily";
  const etiqueta = it.fuente ? "Noticia" : "Investigación";
  return `<a class="news-row" href="${it.link}" target="_blank" rel="noopener">
    <div class="news-ico">${svgIcon(UI_ICON.noticia, 22, "dim")}</div>
    <div class="news-main">
      <div class="news-title">${it.title}</div>
      ${it.summary ? `<div class="news-excerpt">${it.summary}…</div>` : ""}
      <div class="news-meta"><span class="tag">${etiqueta}</span><span>${fuente}</span>${it.fecha ? `<span>·</span><span>${it.fecha}</span>` : ""}<span>·</span><span>Fuente ↗</span></div>
    </div>
  </a>`;
}
function viewNoticias() {
  const chips = NEWS_TEMAS.map((t, i) => `<button class="ex-filter ${i === 0 ? "active" : ""}" data-tema="${t.id}">${t.n}</button>`).join("");
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Noticias</div>
    <section class="guide-hero">
      <div class="gh-pad">
        <div class="gh-type">Actualidad · Investigación en salud</div>
        <h1>Noticias e investigación en salud</h1>
        <p class="gh-lema" style="font-style:normal;color:var(--text-dim)">Actualidad en <b>español</b> de medios y clínicas de renombre (Google Noticias) o investigación internacional (ScienceDaily), actualizada a diario.</p>
      </div>
    </section>
    <div class="caps-head">Fuente</div>
    <div class="ex-filters" id="newsFuente">
      <button class="ex-filter active" data-fuente="es">Español · medios y clínicas</button>
      <button class="ex-filter" data-fuente="research">Investigación · ScienceDaily (EN)</button>
    </div>
    <div class="caps-head">Tema</div>
    <div class="ex-filters" id="newsFilters">${chips}</div>
    <div id="newsResults"></div>
  `;
}
function initNoticias() {
  newsFuente = "es"; newsTema = "general";
  const fbar = document.getElementById("newsFuente");
  fbar?.querySelectorAll("[data-fuente]").forEach((b) => b.addEventListener("click", () => {
    fbar.querySelectorAll("[data-fuente]").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); newsFuente = b.dataset.fuente;
    loadNoticias(newsTema, "newsResults", 15, newsFuente);
  }));
  const bar = document.getElementById("newsFilters");
  bar?.querySelectorAll("[data-tema]").forEach((b) => b.addEventListener("click", () => {
    bar.querySelectorAll("[data-tema]").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); newsTema = b.dataset.tema;
    loadNoticias(newsTema, "newsResults", 15, newsFuente);
  }));
  loadNoticias("general", "newsResults", 15, "es");
}
async function loadNoticias(tema, containerId, limit, fuente) {
  fuente = fuente || "es";
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = `<div class="loader"><div class="spin"></div><div style="margin-top:10px">Cargando noticias…</div></div>`;
  try {
    const res = await fetch(`${API.noticias}?tema=${tema}&fuente=${fuente}&limit=${limit || 12}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items = data.items || [];
    if (!items.length) { box.innerHTML = `<div class="disclaimer-inline">No hay noticias disponibles en este momento.</div>`; return; }
    const disc = fuente === "research"
      ? "Titulares de <b>ScienceDaily</b> (notas de prensa de universidades y centros de investigación), en inglés; enlazan a la fuente original. Divulgación científica, no consejo médico."
      : "Actualidad en español agregada por <b>Google Noticias</b> desde distintos medios y clínicas; enlaza a la fuente original. Divulgación, no consejo médico.";
    box.innerHTML = `<div class="panel"><div class="news-list">${items.map(newsCard).join("")}</div></div>
      <div class="disclaimer-inline">${disc}</div>`;
  } catch (err) {
    box.innerHTML = `<div class="notfound"><h3 class="font-head" style="margin:0 0 8px">No se pudieron cargar las noticias</h3>
      <p style="color:var(--text-dim)">Ejecuta el proyecto con <b>python server.py</b> (usa un proxy que lee los RSS y evita el CORS).</p>
      <p class="api-note">Detalle técnico: ${err.message}</p></div>`;
  }
}

/* ---------- ARTÍCULOS ---------- */
function viewArticulos() {
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Artículos</div>
    <h2 class="section-title">Artículos y guías rápidas</h2>
    <p class="section-sub">Contenido educativo revisado por nuestros especialistas, organizado por área clínica.</p>
    <div class="panel"><div class="news-list">${DB.articulos.map(articleRow).join("")}</div></div>
  `;
}

function viewArticulo(id) {
  const art = articulo(id);
  if (!art) return viewNotFound();
  const a = area(art.area);
  const e = esp(art.autor);
  const cuerpo = art.cuerpo.map((p) => `<p>${p}</p>`).join("");
  const relacionados = DB.articulos.filter((x) => x.area === art.area && x.id !== id).slice(0, 3)
    .map((x) => `<a class="chip" href="#/articulo/${x.id}">${x.titulo}</a>`).join("");
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span><a href="#/articulos">Artículos</a><span class="sep">›</span>${art.etiqueta}</div>
    <article class="guide-hero">
      ${coverHTML(a)}
      <div class="gh-pad">
        <span class="tag fc-tag">${art.etiqueta}</span>
        <h1 style="margin-top:8px">${art.titulo}</h1>
        <div class="gh-byline">
          <span>Por <b>${e.nombre}</b></span><span>·</span>
          <span><a href="#/area/${a.id}">${a.nombre}</a></span><span>·</span><span>${art.fecha}</span>
        </div>
      </div>
    </article>
    <div class="prose" style="max-width:760px;margin-top:16px">${cuerpo}</div>
    <div class="strat-tip" style="max-width:760px"><strong>Nota:</strong> este artículo es de carácter educativo. Para decisiones sobre tu salud, consulta a un profesional sanitario.</div>
    ${relacionados ? `<div class="caps-head">Relacionados</div><div style="display:flex;flex-wrap:wrap;gap:8px">${relacionados}</div>` : ""}
    <div style="margin-top:18px"><a class="btn" href="#/area/${a.id}">Ver la guía completa de ${a.nombre} →</a></div>
  `;
}

/* ---------- MIS RECOMENDACIONES (API real) ---------- */
function viewRecomendaciones() {
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Mis recomendaciones</div>
    <h2 class="section-title">Mis recomendaciones de salud</h2>
    <p class="section-sub">Cribados, vacunas y consejos preventivos indicados para tu perfil, con datos
    <b>oficiales</b> de MyHealthfinder (ODPHP · health.gov, gobierno de EE. UU.), en español.</p>

    <form class="tool-form" id="recForm">
      <div class="field"><label for="edad">Edad</label><input id="edad" type="number" min="0" max="120" value="35" required /></div>
      <div class="field"><label for="sexo">Sexo biológico</label>
        <select id="sexo"><option value="male">Masculino</option><option value="female">Femenino</option></select></div>
      <div class="field" id="embField"><label for="embarazo">¿Embarazo?</label>
        <select id="embarazo"><option value="0">No</option><option value="1">Sí</option></select></div>
      <button class="btn primary" type="submit">Ver recomendaciones</button>
    </form>
    <p class="api-note">Fuente en vivo: <b>odphp.health.gov/myhealthfinder</b> (API pública v4). Orientada a las guías de EE. UU.; utilízala como referencia general y confírmala con tu profesional sanitario.</p>
    <div id="recResults"></div>
  `;
}

async function fetchRecomendaciones() {
  const edad = val("edad"), sexo = val("sexo"), emb = val("embarazo");
  const box = document.getElementById("recResults");
  box.innerHTML = `<div class="loader"><div class="spin"></div><div style="margin-top:10px">Consultando recomendaciones oficiales…</div></div>`;
  const params = new URLSearchParams({ age: edad, sex: sexo, lang: "es" });
  if (sexo === "female" && emb === "1") params.set("pregnant", "1");
  const url = `${API.base}?${params.toString()}`;
  const urlDirecto = `${API.directo}?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const resources = data?.Result?.Resources?.All?.Resource || [];
    const heading = stripHtml(data?.Result?.MyHFHeading || "");
    if (!resources.length) { box.innerHTML = `<div class="disclaimer-inline">No se han encontrado recomendaciones específicas para ese perfil. Prueba con otra edad.</div>`; return; }
    const cards = resources.map((r) => {
      const cat = r.MyHFCategory || r.Categories || "Salud preventiva";
      const title = r.MyHFTitle || r.Title || "Recomendación";
      let snippet = "";
      const secs = r.Sections?.section || [];
      if (secs.length) snippet = stripHtml(secs[0].Content || secs[0].Description || "").slice(0, 190);
      const link = r.AccessibleVersion || r.MyHFLinkUrl || "#";
      return `<div class="rec-card">
        <span class="tag rc-cat">${cat}</span>
        <div class="rc-title">${title}</div>
        ${snippet ? `<div class="rc-snippet">${snippet}…</div>` : ""}
        <a class="rc-link" href="${link}" target="_blank" rel="noopener">Leer en health.gov ↗</a>
      </div>`;
    }).join("");
    box.innerHTML = `<div class="caps-head">${resources.length} recomendaciones para tu perfil</div>
      ${heading ? `<p class="prose" style="color:var(--text-dim);margin-bottom:14px">${heading}</p>` : ""}
      <div class="rec-grid">${cards}</div>
      <div class="disclaimer-inline">Datos oficiales de MyHealthfinder (ODPHP · health.gov), basados en el USPSTF, el ACIP-CDC y la HRSA. Son recomendaciones generales de EE. UU.; tu profesional local puede adaptarlas a tu contexto.</div>`;
  } catch (err) {
    box.innerHTML = `<div class="notfound">
      <h3 style="margin:0 0 8px" class="font-head">No se pudo conectar con la API en vivo</h3>
      <p style="color:var(--text-dim);margin:0 0 10px">Para la consulta en vivo, ejecuta el proyecto con <b>python server.py</b> (incluye el proxy que evita el CORS). Si has abierto el archivo directamente, usa el enlace oficial:</p>
      <a class="btn primary" href="${urlDirecto}" target="_blank" rel="noopener">Abrir la consulta en health.gov ↗</a>
      <p class="api-note" style="margin-top:10px">Detalle técnico: ${err.message}</p>
    </div>`;
  }
}
function stripHtml(html) { const t = document.createElement("div"); t.innerHTML = html; return (t.textContent || t.innerText || "").replace(/\s+/g, " ").trim(); }

/* ---------- SUBIR PORTADAS ---------- */
function uploadCover(areaId) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/png,image/jpeg,image/webp";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) { alert("La imagen supera los 6 MB. Elige una más ligera."); return; }
    const btn = document.querySelector(".upload-btn");
    const rd = new FileReader();
    rd.onload = async () => {
      if (btn) btn.textContent = "Subiendo…";
      try {
        const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ area: areaId, name: f.name, data: rd.result }) });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "HTTP " + res.status);
        COVERS[areaId] = j.url + "?t=" + Date.now();
        router();
      } catch (e) {
        if (btn) btn.textContent = "Cambiar portada";
        alert("No se pudo subir la imagen.\n\nEjecuta el proyecto con \"python server.py\" para habilitar la subida (el modo archivo local no lo permite).\n\nDetalle: " + e.message);
      }
    };
    rd.readAsDataURL(f);
  };
  inp.click();
}

/* ---------- CHEATSHEET GLOBAL ---------- */
function viewCheatsheet() {
  const cards = DB.areas.map((a) => {
    const items = a.objetivos.map((oid) => { const o = obj(oid); return `<li><b><a href="#/objetivo/${oid}">${o.titulo}</a>:</b> ${o.pasos[0]}</li>`; }).join("");
    return `<div class="cheat-card"><h3>${a.nombre}</h3><ul>${items}</ul></div>`;
  }).join("");
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Cheatsheet</div>
    <h2 class="section-title">Cheatsheet global</h2>
    <p class="section-sub">Una acción clave por estrategia. Cada título enlaza a su cheat sheet completa.</p>
    <div class="cheat-grid">${cards}</div>
  `;
}

/* ---------- ESPECIALISTAS ---------- */
function viewEspecialistas() {
  const cards = Object.entries(DB.especialistas).map(([id, e]) => {
    const areas = DB.areas.filter((a) => a.especialistas.includes(id));
    const links = areas.map((a) => `<a class="chip" href="#/area/${a.id}">${a.nombre}</a>`).join("");
    return `<div class="esp-card">
      <div class="e-ico">${svgIcon(MED_GLYPH, 30, "dim")}</div>
      <div class="e-name">${e.nombre}</div><div class="e-desc">${e.desc}</div>
      ${links ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center">${links}</div>` : ""}</div>`;
  }).join("");
  return `
    <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span>Especialidades</div>
    <h2 class="section-title">Especialidades</h2>
    <p class="section-sub">Las áreas profesionales que respaldan cada guía. Para casos concretos, consulta siempre con un profesional.</p>
    <div class="esp-grid">${cards}</div>
  `;
}

function viewNotFound() {
  return `<div class="notfound"><h2 style="margin:0 0 6px">404 · Página no encontrada</h2>
    <p style="color:var(--text-dim)">Esta página no existe.</p>
    <a class="btn primary" href="#/">← Volver al inicio</a></div>`;
}

/* ============================================================
   ROUTER
   ============================================================ */
function router() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, anchor] = raw.split("#");
  const parts = path.split("/").filter(Boolean);
  const route = parts[0] || "";
  const param = parts[1];
  let html, needsFetch = false, needsTierInit = false, needsEjInit = false, needsNewsInit = false, needsTrain = false;
  switch (route) {
    case "": html = viewHome(); break;
    case "areas": html = viewAreas(); break;
    case "area": html = viewArea(param); break;
    case "objetivo": html = viewObjetivo(param); break;
    case "entrenar": html = TrainUI.render(parts.slice(1)); needsTrain = true; break;
    case "ejercicios": html = viewEjercicios(); needsEjInit = true; break;
    case "noticias": html = viewNoticias(); needsNewsInit = true; break;
    case "tierlist": html = viewTierList(); needsTierInit = true; break;
    case "herramientas": html = viewHerramientas(); break;
    case "articulos": html = viewArticulos(); break;
    case "articulo": html = viewArticulo(param); break;
    case "recomendaciones": html = viewRecomendaciones(); needsFetch = true; break;
    case "cheatsheet": html = viewCheatsheet(); break;
    case "especialistas": html = viewEspecialistas(); break;
    default: html = viewNotFound();
  }
  app.innerHTML = html;
  app.classList.remove("animate"); void app.offsetWidth; app.classList.add("animate");
  setActiveNav(route);
  startTipRotator();
  initCarousels();
  initReveal();
  document.getElementById("topnav")?.classList.remove("open");

  if (needsFetch) {
    document.getElementById("recForm")?.addEventListener("submit", (e) => { e.preventDefault(); fetchRecomendaciones(); });
    toggleEmb();
    document.getElementById("sexo")?.addEventListener("change", toggleEmb);
  }
  if (needsTierInit) initTierFilters();
  if (needsEjInit) initEjercicios();
  if (needsNewsInit) initNoticias();
  if (needsTrain) TrainUI.mount();
  if (route === "") loadNoticias("general", "homeNews", 5, "es");
  if (route === "area" && area(param)) loadNoticias(param, "areaNews", 4, "es");

  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  else window.scrollTo(0, 0);
}

function toggleEmb() {
  const sexo = val("sexo");
  const f = document.getElementById("embField");
  if (f) f.style.display = sexo === "female" ? "flex" : "none";
}

function setActiveNav(route) {
  const map = { "": "#/", areas: "#/areas", area: "#/areas", objetivo: "#/areas",
    entrenar: "#/entrenar",
    ejercicios: "#/ejercicios", noticias: "#/noticias", tierlist: "#/tierlist", herramientas: "#/herramientas",
    articulos: "#/articulos", articulo: "#/articulos",
    recomendaciones: "#/recomendaciones", cheatsheet: "#/cheatsheet", especialistas: "#/especialistas" };
  document.querySelectorAll(".topnav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === map[route]));
}

/* ---------- Carrusel ---------- */
function initCarousels() {
  document.querySelectorAll(".carousel").forEach((car) => {
    const track = car.querySelector(".car-track");
    if (!track) return;
    const slides = [...track.children];
    const dotsWrap = car.querySelector(".car-dots");
    car.querySelector(".car-prev")?.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth, behavior: "smooth" }));
    car.querySelector(".car-next")?.addEventListener("click", () => track.scrollBy({ left: track.clientWidth, behavior: "smooth" }));
    const page = () => Math.round(track.scrollLeft / track.clientWidth);

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.className = "car-dot" + (i === 0 ? " active" : "");
        b.addEventListener("click", () => track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" }));
        dotsWrap.appendChild(b);
      });
      const upd = () => { const p = page(); [...dotsWrap.children].forEach((d, i) => d.classList.toggle("active", i === p)); };
      track.addEventListener("scroll", () => { clearTimeout(track._t); track._t = setTimeout(upd, 90); });
    }

    if (car.dataset.autoplay) {
      let iv;
      const start = () => { iv = setInterval(() => {
        if (page() >= slides.length - 1) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
      }, 5500); };
      const stop = () => clearInterval(iv);
      car.addEventListener("mouseenter", stop);
      car.addEventListener("mouseleave", start);
      start();
    }
  });
}

/* ---------- Reveal al hacer scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach((e, i) => { e.style.transitionDelay = Math.min(i * 40, 240) + "ms"; io.observe(e); });
}

/* ---------- Recomendación rotativa ---------- */
let tipTimer = null;
function startTipRotator() {
  clearInterval(tipTimer);
  const el = document.getElementById("tipRotator");
  if (!el) return;
  let i = 0;
  tipTimer = setInterval(() => {
    i = (i + 1) % DB.hoy.tips.length;
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = DB.hoy.tips[i]; el.style.opacity = 1; }, 250);
  }, 4500);
}

/* ---------- Búsqueda ---------- */
function buildSearchIndex() {
  const idx = [];
  DB.areas.forEach((a) => idx.push({ tipo: "Área", nombre: a.nombre, area: a.id, href: `#/area/${a.id}` }));
  Object.entries(DB.objetivos).forEach(([id, o]) => idx.push({ tipo: "Estrategia", nombre: o.titulo, area: o.area, href: `#/objetivo/${id}` }));
  DB.articulos.forEach((art) => idx.push({ tipo: "Artículo", nombre: art.titulo, area: art.area, href: `#/articulo/${art.id}` }));
  Object.entries(DB.especialistas).forEach(([, e]) => idx.push({ tipo: "Especialidad", nombre: e.nombre, area: null, href: `#/especialistas` }));
  idx.push({ tipo: "Herramientas", nombre: "Calculadoras de salud (IMC, calorías, sueño)", area: null, href: "#/herramientas" });
  idx.push({ tipo: "Entrenar", nombre: "Plan semanal y sesión guiada", area: "fuerza", href: "#/entrenar" });
  idx.push({ tipo: "Entrenar", nombre: "Peso corporal y objetivo", area: "fuerza", href: "#/entrenar/peso" });
  idx.push({ tipo: "Entrenar", nombre: "PRs, 1RM y mapa muscular", area: "fuerza", href: "#/entrenar/stats" });
  idx.push({ tipo: "Ejercicios", nombre: "Biblioteca de ejercicios por grupo muscular", area: "fuerza", href: "#/ejercicios" });
  return idx;
}
const SEARCH_INDEX = buildSearchIndex();

function initSearch() {
  const input = document.getElementById("search");
  const box = document.getElementById("searchResults");
  if (!input) return;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    if (!q) { box.classList.remove("show"); return; }
    const hits = SEARCH_INDEX.filter((it) => norm(it.nombre).includes(q)).slice(0, 8);
    box.innerHTML = hits.length
      ? hits.map((h) => `<a href="${h.href}"><span>${h.area ? glyph(h.area, 16) : ""}</span><span>${h.nombre}</span><span class="sr-tag">${h.tipo}</span></a>`).join("")
      : `<a>Sin resultados</a>`;
    box.classList.add("show");
  });
  input.addEventListener("blur", () => setTimeout(() => box.classList.remove("show"), 180));
  input.addEventListener("focus", () => { if (input.value.trim()) box.classList.add("show"); });
}

document.getElementById("navToggle")?.addEventListener("click", () => {
  document.getElementById("topnav")?.classList.toggle("open");
});

/* ---------- Init ---------- */
async function loadCovers() {
  try {
    const r = await fetch("assets/img/areas/manifest.json", { cache: "no-store" });
    if (r.ok) { const m = await r.json(); COVERS = m.areas || {}; }
  } catch (e) { /* sin portadas subidas */ }
}
window.addEventListener("hashchange", router);
initTheme();
loadCovers().finally(() => { router(); initSearch(); });
