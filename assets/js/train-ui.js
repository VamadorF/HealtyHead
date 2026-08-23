/* ============================================================
   HEALTHYHEAD — UI de entrenamiento
   ============================================================ */
const TrainUI = (() => {
  let catalog = [];
  let wakeSentinel = null;
  let restTimer = null;
  let workTimer = null;
  let restLeft = 0;
  let workElapsed = 0;
  let workCtx = null;
  let picker = null;
  let calc1 = { w: 80, r: 5 };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  async function ensureCatalog() {
    if (catalog.length) return catalog;
    try {
      const r = await fetch("/api/gym?catalog=1&limit=1400");
      if (r.ok) {
        const data = await r.json();
        catalog = data.items || [];
      }
    } catch (e) { /* fallback abajo */ }
    if (!catalog.length) {
      try {
        const r = await fetch("data/gym_exercises.json");
        if (r.ok) catalog = await r.json();
      } catch (e2) { catalog = []; }
    }
    return catalog;
  }

  function lib() { return Train.allExercises(catalog); }

  function subnav(active) {
    const links = [
      ["", "Hoy"], ["plan", "Plan"], ["sesion", "Sesión"], ["peso", "Peso"],
      ["stats", "Estadísticas"], ["biblioteca", "Biblioteca"], ["compartir", "Compartir"], ["ajustes", "Ajustes"],
    ];
    return `<nav class="tr-subnav">${links.map(([id, n]) =>
      `<a href="#/entrenar${id ? "/" + id : ""}" class="${active === id ? "active" : ""}">${n}</a>`).join("")}</nav>`;
  }

  function wrap(active, inner) {
    return `
      <div class="crumbs"><a href="#/">Inicio</a><span class="sep">›</span><a href="#/entrenar">Entrenar</a></div>
      ${subnav(active)}
      ${inner}`;
  }

  function render(parts) {
    Train.load();
    const p = (parts && parts[0]) || "";
    const id = parts && parts[1];
    if (p === "plan") return wrap("plan", viewPlan());
    if (p === "rutina") return wrap("plan", viewRoutine(id));
    if (p === "sesion") return wrap("sesion", viewSession(id));
    if (p === "peso") return wrap("peso", viewWeight());
    if (p === "stats") return wrap("stats", viewStats());
    if (p === "biblioteca") return wrap("biblioteca", viewLibrary());
    if (p === "compartir") return wrap("compartir", viewShare());
    if (p === "ajustes") return wrap("ajustes", viewSettings());
    return wrap("", viewDash());
  }

  function viewDash() {
    const s = Train.getState();
    const week = Train.weekDates();
    const today = week.find((d) => d.isToday) || week[0];
    const routine = today.routineId ? Train.getRoutine(today.routineId) : null;
    const nWo = s.workouts.length;
    const last = s.weighIns[s.weighIns.length - 1];
    const hm = Train.heatmap(new Date().getFullYear());
    const trained = hm.cells.filter((c) => c.minutes > 0).length;
    return `
      <section class="guide-hero">
        <div class="gh-pad">
          <div class="gh-type">Entrenamiento · Fuerza y movilidad</div>
          <h1>Tu semana, tus series, tu progreso</h1>
          <p class="gh-lema" style="font-style:normal;color:var(--text-dim)">Planifica, entrena con guía y mira cómo evolucionan tus marcas. La biblioteca tiene <b>${catalog.length || "1.324"}</b> ejercicios con demostración animada.</p>
        </div>
      </section>
      <div class="tr-dash">
        <div class="tr-card">
          <h3>Hoy · ${today.name} ${Train.formatDateES(today.iso)}</h3>
          ${routine ? `<p>Toca <b>${esc(routine.name)}</b> · ${routine.items.length} ejercicios</p>
            <div class="tr-actions"><a class="btn primary" href="#/entrenar/sesion">Empezar sesión de hoy</a>
            <a class="btn" href="#/entrenar/plan">Reprogramar</a></div>`
          : `<p class="tr-muted">No hay rutina asignada a hoy. Asigna una en el plan semanal o empieza una sesión libre.</p>
            <div class="tr-actions"><a class="btn primary" href="#/entrenar/plan">Planificar la semana</a>
            <button class="btn" onclick="TrainUI.freeSession()">Sesión libre</button></div>`}
        </div>
        <div class="tr-card">
          <h3>Resumen</h3>
          <div class="tr-kpi">
            <span><b>${nWo}</b>entrenos guardados</span>
            <span><b>${trained}</b>días activos este año</span>
            <span><b>${last ? Train.trimNum(last.kg) + " kg" : "—"}</b>último peso</span>
          </div>
          <div class="tr-actions">
            <a class="btn" href="#/entrenar/peso">Registrar peso</a>
            <a class="btn" href="#/entrenar/stats">PRs y mapa muscular</a>
          </div>
        </div>
      </div>
      <div class="caps-head">Esta semana</div>
      ${weekStrip(week)}
      ${s.routines.length ? "" : `<div class="tr-empty" style="margin-top:14px">Aún no tienes rutinas.
        <div class="tr-actions" style="justify-content:center"><button class="btn primary" onclick="TrainUI.seedTemplate()">Crear plantilla Full body</button>
        <a class="btn" href="#/entrenar/plan">Crear rutina vacía</a></div></div>`}
    `;
  }

  function weekStrip(week) {
    return `<div class="tr-week">${week.map((d) => {
      const r = d.routineId ? Train.getRoutine(d.routineId) : null;
      const moved = d.override && d.override.from;
      const vacated = d.override && d.override.vacated;
      return `<div class="tr-day ${d.isToday ? "today" : ""} ${vacated ? "vacated" : ""}">
        <div class="td-name">${d.name}${d.isToday ? " · hoy" : ""}</div>
        <div class="td-iso">${Train.formatDateES(d.iso)}</div>
        <div>${r ? `<b>${esc(r.name)}</b>` : "<span class='tr-muted'>Descanso</span>"}</div>
        ${moved ? `<div class="tr-moved">Movido desde ${Train.formatDateES(d.override.from)}</div>` : ""}
        ${vacated ? `<div class="tr-moved">Reprogramado a ${Train.formatDateES(d.override.to)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  function viewPlan() {
    const s = Train.getState();
    const week = Train.weekDates();
    const optsFor = (selected) => `<option value="">— Descanso —</option>` + s.routines.map((r) =>
      `<option value="${esc(r.id)}" ${r.id === selected ? "selected" : ""}>${esc(r.name)}</option>`).join("");
    return `
      <h2 class="section-title">Plan semanal</h2>
      <p class="section-sub">Una rutina por día. Reprogramar mueve solo esa fecha: el plan base no cambia.</p>
      <div class="tr-actions" style="margin-top:0">
        <button class="btn primary" onclick="TrainUI.newRoutine()">Nueva rutina</button>
        <button class="btn" onclick="TrainUI.seedTemplate()">Plantilla Full body</button>
      </div>
      <div class="caps-head">Esta semana</div>
      <div class="tr-week">${week.map((d) => {
        const r = d.routineId ? Train.getRoutine(d.routineId) : null;
        return `<div class="tr-day ${d.isToday ? "today" : ""}">
          <div class="td-name">${d.name}</div>
          <div class="td-iso">${d.iso}</div>
          <label class="tr-muted">Plan base</label>
          <select onchange="TrainUI.setDay('${d.key}', this.value)">${optsFor(s.weeklyPlan[d.key])}</select>
          <div>${r ? `<a href="#/entrenar/rutina/${esc(d.routineId)}">${esc(r.name)}</a>` : "<span class='tr-muted'>Sin sesión</span>"}</div>
          ${d.override ? `<div class="tr-moved">${d.override.vacated ? "Vacío (movido)" : "Excepción este día"}</div>
            <button class="btn" onclick="TrainUI.clearOv('${d.iso}')">Quitar excepción</button>` : ""}
          <button class="btn" onclick="TrainUI.askReschedule('${d.iso}')">Mover este día</button>
        </div>`;
      }).join("")}</div>
      <p class="tr-muted" style="margin-top:10px">El desplegable edita el plan recurrente. «Mover este día» crea una excepción (enfermedad, sesión perdida) y deja el plan base intacto.</p>
      <div class="caps-head">Rutinas</div>
      <div class="tr-list">${s.routines.length ? s.routines.map((r) =>
        `<div class="tr-itemrow">
          <div style="flex:1"><b><a href="#/entrenar/rutina/${esc(r.id)}">${esc(r.name)}</a></b>
            <div class="tr-muted">${r.items.length} ejercicios · ${Train.PROGRESSION_TYPES[r.progression?.type]?.name || "Lineal"}</div></div>
          <a class="btn" href="#/entrenar/rutina/${esc(r.id)}">Editar</a>
          <button class="btn" onclick="TrainUI.delRoutine('${esc(r.id)}')">Borrar</button>
        </div>`).join("") : `<div class="tr-empty">No hay rutinas todavía.</div>`}
    `;
  }

  function viewRoutine(id) {
    const r = Train.getRoutine(id);
    if (!r) return `<div class="tr-empty">Rutina no encontrada. <a href="#/entrenar/plan">Volver al plan</a></div>`;
    const s = Train.getState();
    const preview = Train.routinePreviewMuscles(r, catalog);
    const progOpts = Object.keys(Train.PROGRESSION_TYPES).map((k) =>
      `<option value="${k}" ${r.progression?.type === k ? "selected" : ""}>${Train.PROGRESSION_TYPES[k].name}</option>`).join("");
    return `
      <h2 class="section-title">${esc(r.name)}</h2>
      <p class="section-sub">Añade ejercicios de la biblioteca o crea los tuyos. El mapa de la derecha muestra qué pega esta rutina.</p>
      <div class="tr-row">
        ${field("Nombre", `<input id="rn-name" value="${esc(r.name)}">`)}
        ${field("Regla de progresión", `<select id="rn-prog">${progOpts}</select>`)}
        ${field("Incremento (kg)", `<input id="rn-inc" type="number" step="0.5" value="${r.progression?.increment || s.settings.defaultIncrement}">`)}
        ${field("Rango reps (doble)", `<input id="rn-min" type="number" value="${r.progression?.minReps || 8}" style="width:70px"> – <input id="rn-max" type="number" value="${r.progression?.maxReps || 12}" style="width:70px">`)}
        <button class="btn primary" onclick="TrainUI.saveRoutineMeta('${esc(r.id)}')">Guardar regla</button>
      </div>
      <p class="tr-muted">${esc(Train.PROGRESSION_TYPES[r.progression?.type]?.desc || "")}</p>
      <div class="tr-actions">
        <button class="btn primary" onclick="TrainUI.openPicker('${esc(r.id)}')">Añadir ejercicio</button>
        <button class="btn" onclick="TrainUI.openCustom('${esc(r.id)}')">Ejercicio personalizado</button>
      </div>
      <div class="tr-list" style="margin-top:12px">${r.items.length ? r.items.map((it, i) => routineItemRow(r, it, i)).join("")
        : `<div class="tr-empty">Rutina vacía. Añade ejercicios de la biblioteca (1.324 con GIF) o crea uno propio.</div>`}</div>
      <div class="caps-head">Vista previa muscular</div>
      ${muscleMaps(preview, s.settings.bodyFigure)}
    `;
  }

  function field(label, inner) {
    return `<div class="field"><label>${label}</label>${inner}</div>`;
  }

  function routineItemRow(r, it, i) {
    const overrides = `<option value="inherit" ${!it.progressionOverride ? "selected" : ""}>Heredar rutina</option>`
      + Object.keys(Train.PROGRESSION_TYPES).map((k) =>
        `<option value="${k}" ${it.progressionOverride?.type === k ? "selected" : ""}>${Train.PROGRESSION_TYPES[k].name}</option>`).join("");
    const next = r.items[i + 1];
    return `<div class="tr-itemrow ${it.supersetGroup ? "ss" : ""}">
      <div style="flex:1;min-width:180px">
        <b>${esc(it.name)}</b>
        ${it.supersetGroup ? `<span class="tr-badge gold">Superserie</span>` : ""}
        ${it.logType === "timed" ? `<span class="tr-badge">Tiempo</span>` : ""}
        ${it.logType === "cardio" ? `<span class="tr-badge">Cardio</span>` : ""}
        ${it.isBodyweight ? `<span class="tr-badge">Peso corporal</span>` : ""}
        ${it.perSide ? `<span class="tr-badge">Por lado</span>` : ""}
        <div class="tr-muted">${it.targetSets} series · ${
          it.logType === "timed" ? (it.targetTime + " s") :
          it.logType === "cardio" ? Train.formatDuration(it.targetTime || 600) :
          (it.targetReps + " reps")}${it.perSide ? " (" + (it.targetReps / 2) + " por lado)" : ""} · descanso ${it.restSec || 0}s</div>
      </div>
      <label class="tr-muted">Series <input type="number" min="1" max="10" value="${it.targetSets}" onchange="TrainUI.patchItem('${esc(r.id)}','${esc(it.id)}',{targetSets:+this.value})"></label>
      ${it.logType === "timed" || it.logType === "cardio"
        ? `<label class="tr-muted">Tiempo (s) <input type="number" value="${it.targetTime || 30}" onchange="TrainUI.patchItem('${esc(r.id)}','${esc(it.id)}',{targetTime:+this.value})"></label>`
        : `<label class="tr-muted">Reps <input type="number" value="${it.targetReps}" onchange="TrainUI.patchItem('${esc(r.id)}','${esc(it.id)}',{targetReps:+this.value})"></label>`}
      <label class="tr-muted">Descanso (s) <input type="number" value="${it.restSec || 0}" onchange="TrainUI.patchItem('${esc(r.id)}','${esc(it.id)}',{restSec:+this.value})"></label>
      <label class="tr-muted">Regla <select onchange="TrainUI.setItemRule('${esc(r.id)}','${esc(it.id)}',this.value)">${overrides}</select></label>
      ${it.beltEligible ? `<label class="tr-muted"><input type="checkbox" ${it.dipBelt ? "checked" : ""} onchange="TrainUI.patchItem('${esc(r.id)}','${esc(it.id)}',{dipBelt:this.checked})"> Cinturón / lastre</label>` : ""}
      ${next && !it.supersetGroup ? `<button class="btn" onclick="TrainUI.makeSS('${esc(r.id)}','${esc(it.id)}','${esc(next.id)}')">Superserie con el siguiente</button>` : ""}
      ${it.supersetGroup ? `<button class="btn" onclick="TrainUI.breakSS('${esc(r.id)}','${esc(it.supersetGroup)}')">Separar</button>` : ""}
      <button class="btn" onclick="TrainUI.removeItem('${esc(r.id)}','${esc(it.id)}')">Quitar</button>
    </div>`;
  }

  function viewSession(date) {
    const s = Train.getState();
    let ses = s.activeSession;
    const iso = date || Train.todayISO();
    if (!ses) {
      const rid = Train.scheduledRoutineId(iso);
      const r = rid ? Train.getRoutine(rid) : null;
      return `
        <h2 class="section-title">Sesión guiada</h2>
        <p class="section-sub">La app sabe qué día es y arranca la rutina de hoy. Primero pide el peso corporal; luego rellena los pesos de la última vez.</p>
        <div class="tr-card">
          <h3>${r ? esc(r.name) : "No hay rutina hoy"}</h3>
          <p class="tr-muted">${r ? r.items.length + " ejercicios preparados con objetivos ya calculados." : "Puedes entrenar en vacío o asignar una rutina al plan."}</p>
          <div class="tr-actions">
            <button class="btn primary" onclick="TrainUI.begin('${iso}')">${r ? "Empezar sesión" : "Sesión libre (vacía)"}</button>
            <a class="btn" href="#/entrenar/plan">Cambiar el plan</a>
          </div>
        </div>`;
    }
    const effortOn = s.settings.effortScale !== "off";
    const items = ses.items || [];
    return `
      <h2 class="section-title">${esc(ses.routineName)} · ${Train.formatDateES(ses.date)}</h2>
      <p class="tr-muted">Peso de hoy: <b>${ses.bodyWeightKg != null ? Train.trimNum(ses.bodyWeightKg) + " kg" : "pendiente"}</b>
        · Esfuerzo: ${effortOn ? s.settings.effortScale.toUpperCase() : "oculto"}</p>
      ${!items.length ? `<div class="tr-empty">Sesión vacía. No hay ejercicios que registrar. Termina para no perder el tiempo de actividad, o añade ejercicios al plan.</div>` : ""}
      <div class="tr-items">${items.map((it, ii) => sessionExercise(it, ii, effortOn, s.settings.effortScale)).join("")}</div>
      <div class="tr-actions">
        <button class="btn primary" onclick="TrainUI.finish()">Terminar y guardar</button>
        <button class="btn" onclick="TrainUI.discard()">Descartar</button>
      </div>
      <div id="trTimers"></div>
      ${ses.finishedPreview ? "" : ""}
    `;
  }

  function sessionExercise(it, ii, effortOn, scale) {
    const media = it.gif
      ? `<img src="${esc(it.gif)}" alt="${esc(it.name)}" loading="lazy">`
      : `<div class="ex-ph">${it.description ? esc(it.description) : "Sin animación"}</div>`;
    const showW = !(it.isBodyweight && !it.dipBelt) && it.logType === "reps";
    const timed = it.logType === "timed";
    const cardio = it.logType === "cardio";
    return `<div class="tr-ex ${it.supersetGroup ? "ss" : ""}">
      <div class="tr-ex-h">${media}
        <div class="tr-ex-meta">
          <h4>${esc(it.name)} ${it.supersetGroup ? `<span class="tr-badge gold">Superserie · descanso solo al terminar el par</span>` : ""}</h4>
          <div>${it.logType === "reps" && it.perSide ? `<span class="tr-badge">Por lado</span>` : ""}
            ${it.isBodyweight && !it.dipBelt ? `<span class="tr-badge">Sin peso</span>` : ""}
            ${it.dipBelt ? `<span class="tr-badge gold">Lastre</span>` : ""}
            ${timed ? `<span class="tr-badge">Temporizador de trabajo</span>` : ""}
            ${cardio ? `<span class="tr-badge">Tiempo + velocidad</span>` : ""}</div>
          <div class="tr-why">${esc(it.target?.reason || "")}${it.target?.perSideLabel ? " · Objetivo: " + it.target.perSideLabel : ""}</div>
        </div>
      </div>
      <table class="tr-table"><thead><tr>
        <th>#</th>
        ${showW ? "<th>Peso</th>" : ""}
        ${it.dipBelt ? "<th>Lastre (kg)</th>" : ""}
        ${timed ? "<th>Tiempo (s)</th>" : cardio ? "<th>Tiempo (s)</th><th>Velocidad</th>" : "<th>Reps</th>"}
        ${it.perSide ? "<th></th>" : ""}
        ${effortOn ? `<th>${scale.toUpperCase()}</th>` : ""}
        <th></th>
      </tr></thead><tbody>
        ${(it.sets || []).map((st, si) => `<tr class="${st.completed ? "done" : ""}">
          <td>${si + 1}${it.target?.amrap && si === it.sets.length - 1 ? " <span class='tr-badge gold'>AMRAP</span>" : ""}</td>
          ${showW || it.dipBelt ? `<td><input type="number" step="0.5" value="${st.weight ?? ""}" onchange="TrainUI.setCell(${ii},${si},'weight',this.value)"></td>` : ""}
          ${timed ? `<td><input type="number" value="${st.timeSec ?? ""}" onchange="TrainUI.setCell(${ii},${si},'timeSec',this.value)">
            <button class="btn" onclick="TrainUI.toggleWork(${ii},${si})">Trabajo</button></td>` : ""}
          ${cardio ? `<td><input type="number" value="${st.timeSec ?? ""}" onchange="TrainUI.setCell(${ii},${si},'timeSec',this.value)"></td>
            <td><input type="text" placeholder="km/h o min/km" value="${esc(st.speed ?? "")}" onchange="TrainUI.setCell(${ii},${si},'speed',this.value)"></td>` : ""}
          ${!timed && !cardio ? `<td>${it.isBodyweight && !it.dipBelt
            ? `<span class="tr-step"><button onclick="TrainUI.stepRep(${ii},${si},-1)">−</button>
                <input type="number" value="${st.reps ?? ""}" onchange="TrainUI.setCell(${ii},${si},'reps',this.value)">
                <button onclick="TrainUI.stepRep(${ii},${si},1)">+</button></span>`
            : `<input type="number" value="${st.reps ?? ""}" onchange="TrainUI.setCell(${ii},${si},'reps',this.value)">`}</td>` : ""}
          ${it.perSide ? `<td class="tr-muted">${st.reps ? (Number(st.reps) / 2) + " por lado" : ""}</td>` : ""}
          ${effortOn ? `<td><input type="number" min="0" max="10" step="0.5" value="${st.effort ?? ""}" onchange="TrainUI.setCell(${ii},${si},'effort',this.value)"></td>` : ""}
          <td><button class="btn ${st.completed ? "primary" : ""}" onclick="TrainUI.toggleSet(${ii},${si})">${st.completed ? "Hecha" : "Registrar"}</button>
            ${st.isPR ? `<span class="tr-pr">PR</span>` : ""}</td>
        </tr>`).join("")}
      </tbody></table>
    </div>`;
  }

  function viewWeight() {
    const s = Train.getState();
    const goal = s.settings.bodyWeightGoal;
    const segs = Train.chartSegments(s.weighIns, goal);
    const last = s.weighIns[s.weighIns.length - 1];
    return `
      <h2 class="section-title">Peso corporal</h2>
      <p class="section-sub">Gráfica interactiva con línea de objetivo. Las subidas y bajadas se colorean según te acercan o te alejan de esa meta.</p>
      <div class="tr-row">
        ${field("Peso de hoy (kg)", `<input id="bw-kg" type="number" step="0.1" value="${last ? last.kg : 70}">`)}
        ${field("Fecha", `<input id="bw-date" type="date" value="${Train.todayISO()}">`)}
        ${field("Objetivo (kg)", `<input id="bw-goal" type="number" step="0.1" value="${goal ?? ""}" placeholder="Opcional">`)}
        <button class="btn primary" onclick="TrainUI.saveWeight()">Guardar</button>
      </div>
      <div class="tr-card" style="margin-top:14px">
        ${s.weighIns.length < 2 ? `<div class="tr-empty">Registra al menos dos pesajes para ver la evolución.${goal == null ? " Aún no hay objetivo: la línea se dibujará en color neutro." : ""}</div>` : weightChartSVG(s.weighIns, goal)}
        <div class="tr-muted" style="margin-top:8px">Verde: te acercas al objetivo. Ámbar: te alejas. Sin objetivo, la curva usa el color de marca.</div>
      </div>
      <div class="caps-head">Historial</div>
      <div class="tr-list">${s.weighIns.slice().reverse().map((w, i, arr) => {
        const prev = s.weighIns[s.weighIns.length - 2 - i];
        const tone = prev ? Train.weighInTowardGoal(prev.kg, w.kg, goal) : "neutral";
        const cls = tone === "toward" ? "tr-toward" : tone === "away" ? "tr-away" : "";
        const delta = prev ? (w.kg - prev.kg) : 0;
        return `<div class="tr-itemrow"><div style="flex:1">${Train.formatDateES(w.date)}</div>
          <b>${Train.trimNum(w.kg)} kg</b>
          <span class="${cls}">${prev ? ((delta > 0 ? "+" : "") + Train.trimNum(delta) + " kg") : "—"}</span>
          <button class="btn" onclick="TrainUI.delWeight('${esc(w.id)}')">Borrar</button></div>`;
      }).join("") || `<div class="tr-empty">Sin pesajes.</div>`}
    `;
  }

  function weightChartSVG(weighIns, goal) {
    const pts = weighIns.slice().sort((a, b) => a.date.localeCompare(b.date));
    const W = 720, H = 240, p = { l: 44, r: 16, t: 16, b: 28 };
    const xs = pts.map((_, i) => i);
    const ys = pts.map((p0) => p0.kg).concat(goal != null ? [Number(goal)] : []);
    const minY = Math.min.apply(null, ys) - 1;
    const maxY = Math.max.apply(null, ys) + 1;
    const x = (i) => p.l + (xs.length < 2 ? (W - p.l - p.r) / 2 : i * (W - p.l - p.r) / (xs.length - 1));
    const y = (kg) => p.t + (maxY - kg) * (H - p.t - p.b) / (maxY - minY || 1);
    const segs = Train.chartSegments(pts, goal);
    const colors = { toward: "#6aa98a", away: "#c98d63", neutral: "#5a9e88" };
    let paths = segs.map((sg, i) => {
      const a = pts.indexOf(sg.from), b = pts.indexOf(sg.to);
      return `<line x1="${x(a)}" y1="${y(sg.from.kg)}" x2="${x(b)}" y2="${y(sg.to.kg)}" stroke="${colors[sg.tone]}" stroke-width="3"/>`;
    }).join("");
    const dots = pts.map((pt, i) =>
      `<circle cx="${x(i)}" cy="${y(pt.kg)}" r="4.5" fill="#5a9e88">
        <title>${pt.date}: ${Train.trimNum(pt.kg)} kg</title></circle>`).join("");
    const goalLine = goal != null
      ? `<line x1="${p.l}" y1="${y(Number(goal))}" x2="${W - p.r}" y2="${y(Number(goal))}" stroke="#c3a256" stroke-dasharray="6 4"/>
         <text x="${W - p.r}" y="${y(Number(goal)) - 6}" text-anchor="end" fill="#c3a256" font-size="11">Objetivo ${Train.trimNum(goal)}</text>`
      : "";
    return `<svg class="tr-chart" viewBox="0 0 ${W} ${H}" role="img">${goalLine}${paths}${dots}
      <text x="8" y="${y(maxY) + 4}" fill="#969ca7" font-size="11">${Train.trimNum(maxY)}</text>
      <text x="8" y="${y(minY)}" fill="#969ca7" font-size="11">${Train.trimNum(minY)}</text></svg>`;
  }

  function viewStats() {
    const s = Train.getState();
    const period = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("hh-muscle-period")) || "week";
    const range = Train.periodRange(period);
    const work = Train.muscleWork(s.workouts, catalog, range.from, range.to);
    const prs = Train.exercisePRs(catalog);
    const hm = Train.heatmap(new Date().getFullYear());
    return `
      <h2 class="section-title">PRs, estadísticas y evolución</h2>
      <p class="section-sub">1RM estimado del mejor set elegible (máximo 12 reps). El esfuerzo RIR/RPE no entra en esta cuenta.</p>
      <div class="tr-card">
        <h3>Calculadora de 1RM (sets no hechos)</h3>
        <div class="tr-row">
          ${field("Peso (kg)", `<input id="orm-w" type="number" value="${calc1.w}">`)}
          ${field("Reps", `<input id="orm-r" type="number" value="${calc1.r}">`)}
          <button class="btn primary" onclick="TrainUI.calcORM()">Estimar</button>
        </div>
        <div id="orm-out" class="tr-muted" style="margin-top:8px">No se estima por encima de 12 repeticiones.</div>
      </div>
      <div class="caps-head">Mejores 1RM</div>
      <div class="tr-list">${prs.length ? prs.map((p) => `
        <div class="tr-itemrow">
          <div style="flex:1"><b>${esc(p.name)}</b>
            <div class="tr-muted">Mejor set: ${esc(p.best.label)} · 1RM ≈ ${Train.trimNum(p.best.estimate)} kg</div>
            ${p.history.length > 1 ? `<svg viewBox="0 0 160 36" width="160" height="36">${spark(p.history)}</svg>` : ""}
          </div>
        </div>`).join("") : `<div class="tr-empty">Todavía no hay sets elegibles (1–12 reps con peso).</div>`}
      <div class="caps-head">Mapa muscular</div>
      <div class="tr-row">
        ${["week", "month", "all"].map((k) => {
          const lab = { week: "Semana", month: "Mes", all: "Todo el tiempo" }[k];
          return `<button class="ex-filter ${period === k ? "active" : ""}" onclick="TrainUI.setPeriod('${k}')">${lab}</button>`;
        }).join("")}
        <span class="tr-muted">Figura: ${s.settings.bodyFigure === "female" ? "mujer" : "hombre"} (se cambia en Ajustes)</span>
      </div>
      ${muscleMaps(work, s.settings.bodyFigure)}
      <p class="tr-muted">Sin trabajar en este periodo: ${work.unused.length ? work.unused.join(", ") : "ninguno"}.</p>
      <div class="caps-head">Actividad ${hm.year}</div>
      <p class="section-sub">Cada casilla es un día; el tono depende del tiempo entrenando.</p>
      ${heatmapHTML(hm)}
    `;
  }

  function spark(hist) {
    const max = Math.max.apply(null, hist.map((h) => h.estimate));
    const min = Math.min.apply(null, hist.map((h) => h.estimate));
    const pts = hist.map((h, i) => {
      const x = hist.length < 2 ? 80 : i * 150 / (hist.length - 1);
      const y = 30 - ((h.estimate - min) / (max - min || 1)) * 24;
      return x + "," + y;
    }).join(" ");
    return `<polyline fill="none" stroke="#5a9e88" stroke-width="2" points="${pts}"/>`;
  }

  function heatmapHTML(hm) {
    const first = Train.parseISO(hm.year + "-01-01");
    const pad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const blanks = Array.from({ length: pad }, () => "<i title=''></i>").join("");
    const cells = hm.cells.map((c) => {
      let n = 0;
      if (c.minutes > 0) n = 1;
      if (c.minutes >= 20) n = 2;
      if (c.minutes >= 45) n = 3;
      if (c.minutes >= 75) n = 4;
      return `<i data-n="${n}" title="${c.date}: ${c.minutes} min"></i>`;
    }).join("");
    return `<div class="tr-card"><div class="tr-heat">${blanks}${cells}</div></div>`;
  }

  function muscleMaps(work, figure) {
    return `<div class="tr-maps">
      <div class="tr-card"><h3>Frente</h3>${bodySVG("front", work, figure)}</div>
      <div class="tr-card"><h3>Espalda</h3>${bodySVG("back", work, figure)}</div>
    </div>`;
  }

  function shade(work, id) {
    const max = work.max || 0;
    const v = (work.scores && work.scores[id]) || 0;
    if (!max || !v) return "var(--panel-2)";
    const t = Math.min(1, v / max);
    const a = (0.18 + t * 0.82).toFixed(2);
    return `rgba(90,158,136,${a})`;
  }

  function bodySVG(side, work, figure) {
    const f = figure === "female";
    const hip = f ? 1.08 : 0.94;
    const sh = f ? 0.92 : 1.06;
    const fill = (id) => shade(work, id);
    const title = (id) => {
      const m = Train.MUSCLES.find((x) => x.id === id);
      const v = work.scores[id] || 0;
      return `${m ? m.es : id}: ${Math.round(v)}`;
    };
    if (side === "front") {
      return `<svg class="tr-svg" viewBox="0 0 200 420">
        <ellipse class="m" cx="100" cy="28" rx="${18 * sh}" ry="20" fill="${fill("neck")}"><title>${title("neck")}</title></ellipse>
        <rect class="m" x="${100 - 16 * sh}" y="46" width="${32 * sh}" height="18" rx="4" fill="${fill("neck")}"><title>${title("neck")}</title></rect>
        <ellipse class="m" cx="${58 * sh + 10}" cy="88" rx="${22 * sh}" ry="16" fill="${fill("delts")}"><title>${title("delts")}</title></ellipse>
        <ellipse class="m" cx="${142 - (sh - 1) * 20}" cy="88" rx="${22 * sh}" ry="16" fill="${fill("delts")}"><title>${title("delts")}</title></ellipse>
        <rect class="m" x="${72}" y="78" width="56" height="48" rx="8" fill="${fill("pectorals")}"><title>${title("pectorals")}</title></rect>
        <rect class="m" x="${48}" y="100" width="18" height="46" rx="8" fill="${fill("biceps")}"><title>${title("biceps")}</title></rect>
        <rect class="m" x="${134}" y="100" width="18" height="46" rx="8" fill="${fill("biceps")}"><title>${title("biceps")}</title></rect>
        <rect class="m" x="${44}" y="144" width="14" height="40" rx="6" fill="${fill("forearms")}"><title>${title("forearms")}</title></rect>
        <rect class="m" x="${142}" y="144" width="14" height="40" rx="6" fill="${fill("forearms")}"><title>${title("forearms")}</title></rect>
        <rect class="m" x="78" y="128" width="44" height="46" rx="6" fill="${fill("abs")}"><title>${title("abs")}</title></rect>
        <rect class="m" x="68" y="132" width="12" height="40" rx="4" fill="${fill("obliques")}"><title>${title("obliques")}</title></rect>
        <rect class="m" x="120" y="132" width="12" height="40" rx="4" fill="${fill("obliques")}"><title>${title("obliques")}</title></rect>
        <rect class="m" x="${88 - (hip - 1) * 8}" y="176" width="${24 * hip}" height="18" rx="6" fill="${fill("hip-flexors")}"><title>${title("hip-flexors")}</title></rect>
        <rect class="m" x="${58}" y="196" width="${32 * hip}" height="90" rx="14" fill="${fill("quads")}"><title>${title("quads")}</title></rect>
        <rect class="m" x="${110}" y="196" width="${32 * hip}" height="90" rx="14" fill="${fill("quads")}"><title>${title("quads")}</title></rect>
        <rect class="m" x="86" y="210" width="28" height="50" rx="8" fill="${fill("adductors")}"><title>${title("adductors")}</title></rect>
        <ellipse class="m" cx="100" cy="70" rx="22" ry="10" fill="${fill("cardio")}" opacity=".35"><title>${title("cardio")}</title></ellipse>
      </svg>`;
    }
    return `<svg class="tr-svg" viewBox="0 0 200 420">
      <ellipse class="m" cx="100" cy="28" rx="${18 * sh}" ry="20" fill="${fill("neck")}"><title>${title("neck")}</title></ellipse>
      <rect class="m" x="74" y="50" width="52" height="22" rx="6" fill="${fill("traps")}"><title>${title("traps")}</title></rect>
      <ellipse class="m" cx="58" cy="88" rx="${22 * sh}" ry="16" fill="${fill("delts")}"><title>${title("delts")}</title></ellipse>
      <ellipse class="m" cx="142" cy="88" rx="${22 * sh}" ry="16" fill="${fill("delts")}"><title>${title("delts")}</title></ellipse>
      <rect class="m" x="70" y="74" width="60" height="36" rx="8" fill="${fill("upper-back")}"><title>${title("upper-back")}</title></rect>
      <path class="m" d="M70 108 L100 170 L130 108 Z" fill="${fill("lats")}"><title>${title("lats")}</title></path>
      <rect class="m" x="82" y="150" width="36" height="28" rx="6" fill="${fill("lower-back")}"><title>${title("lower-back")}</title></rect>
      <rect class="m" x="48" y="100" width="18" height="46" rx="8" fill="${fill("triceps")}"><title>${title("triceps")}</title></rect>
      <rect class="m" x="134" y="100" width="18" height="46" rx="8" fill="${fill("triceps")}"><title>${title("triceps")}</title></rect>
      <rect class="m" x="${70}" y="178" width="${60 * hip}" height="36" rx="12" fill="${fill("glutes")}"><title>${title("glutes")}</title></rect>
      <rect class="m" x="58" y="216" width="32" height="80" rx="12" fill="${fill("hamstrings")}"><title>${title("hamstrings")}</title></rect>
      <rect class="m" x="110" y="216" width="32" height="80" rx="12" fill="${fill("hamstrings")}"><title>${title("hamstrings")}</title></rect>
      <rect class="m" x="62" y="300" width="26" height="50" rx="10" fill="${fill("calves")}"><title>${title("calves")}</title></rect>
      <rect class="m" x="112" y="300" width="26" height="50" rx="10" fill="${fill("calves")}"><title>${title("calves")}</title></rect>
      <rect class="m" x="46" y="148" width="14" height="36" rx="6" fill="${fill("forearms")}"><title>${title("forearms")}</title></rect>
      <rect class="m" x="140" y="148" width="14" height="36" rx="6" fill="${fill("forearms")}"><title>${title("forearms")}</title></rect>
    </svg>`;
  }

  function viewLibrary() {
    const s = Train.getState();
    const q = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("hh-lib-q")) || "";
    const grupo = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("hh-lib-g")) || "";
    const selected = ((typeof sessionStorage !== "undefined" && sessionStorage.getItem("hh-lib-eq")) || "").split(",").filter(Boolean);
    const owned = s.settings.equipment || [];
    let pool = lib();
    if (owned.length) pool = Train.filterByOwned(pool, owned);
    const pack = Train.equipmentOptions(pool, selected, { grupo: grupo || undefined, search: q || undefined, owned: owned });
    const chipsG = [{ id: "", n: "Todos" }].concat(Object.keys(Train.GROUP_ES).map((k) => ({ id: k, n: Train.GROUP_ES[k] })));
    return `
      <h2 class="section-title">Biblioteca de ejercicios</h2>
      <p class="section-sub">${pool.length} ejercicios disponibles${owned.length ? " con tu material" : ""} · ${catalog.length} en el dataset Gym Visual con GIF. Las combinaciones de filtros siempre tienen resultados.</p>
      <div class="tr-row">
        ${field("Buscar", `<input id="lib-q" value="${esc(q)}" placeholder="nombre, músculo…" oninput="TrainUI.libQ(this.value)">`)}
      </div>
      <div class="ex-filters" style="margin-top:10px">${chipsG.map((g) =>
        `<button class="ex-filter ${grupo === g.id ? "active" : ""}" onclick="TrainUI.libG('${g.id}')">${g.n}</button>`).join("")}</div>
      <div class="caps-head">Material (solo opciones con resultados)</div>
      <div class="ex-filters">${pack.equipment.map((e) =>
        `<button class="ex-filter ${e.selected ? "active" : ""}" onclick="TrainUI.libEq('${esc(e.id)}')">${esc(e.name)} · ${e.count}</button>`).join("")
        || "<span class='tr-muted'>Sin coincidencias. Quita filtros.</span>"}</div>
      <div class="ex-grid">${pack.items.slice(0, 48).map((e) => {
        const c = Train.classifyExercise(e);
        return `<div class="ex-card">
          <div class="ex-media">${e.gif ? `<img src="${esc(e.gif)}" alt="${esc(e.name)}" loading="lazy">` : `<div class="ex-ph">${esc(e.description || "Descripción")}</div>`}
            ${e.gif ? `<span class="ex-badge">GIF</span>` : `<span class="ex-badge">Custom</span>`}</div>
          <div class="ex-body"><div class="ex-name">${esc(e.name)}</div>
            <div class="ex-tags">
              <span class="ex-tag">${esc(Train.GROUP_ES[e.grupo] || e.grupo || e.bodyPart || "")}</span>
              <span class="ex-tag eq">${esc(Train.EQUIPMENT_ES[e.equipo] || e.equipo || "")}</span>
              ${c.logType !== "reps" ? `<span class="ex-tag">${c.logType}</span>` : ""}
              ${c.perSide ? `<span class="ex-tag">por lado</span>` : ""}
            </div></div></div>`;
      }).join("")}</div>
      <p class="tr-muted">${pack.items.length} resultados. Se muestran los primeros 48; afina la búsqueda para el resto.</p>
    `;
  }

  function viewShare() {
    return `
      <h2 class="section-title">Compartir un plan</h2>
      <p class="section-sub">Exporta rutinas y el horario semanal en un archivo pequeño. No incluye entrenos ni pesajes. Importar hace un <b>merge</b>: nunca pisa el plan que ya tienes.</p>
      <div class="tr-actions">
        <button class="btn primary" onclick="TrainUI.downloadPlan()">Descargar JSON</button>
        <button class="btn" onclick="TrainUI.printPlan()">Imprimir / PDF limpio</button>
        <label class="btn">Importar merge<input type="file" accept="application/json" hidden onchange="TrainUI.importPlan(this)"></label>
      </div>
      <pre id="tr-export" class="tr-card" style="margin-top:14px;white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(Train.exportPlan(), null, 2))}</pre>
    `;
  }

  function viewSettings() {
    const s = Train.getState().settings;
    const owned = s.equipment || [];
    const eqs = Object.keys(Train.EQUIPMENT_ES);
    return `
      <h2 class="section-title">Ajustes de entrenamiento</h2>
      <div class="tr-card">
        <label><input type="checkbox" ${s.wakeLock ? "checked" : ""} onchange="TrainUI.setSet({wakeLock:this.checked})"> Mantener la pantalla despierta durante la sesión</label>
        <p class="tr-muted">Se activa al empezar un entreno y se libera al terminar. Si el navegador no soporta Wake Lock, el ajuste se guarda igualmente.</p>
      </div>
      <div class="tr-card" style="margin-top:10px">
        <div class="field"><label>Columna de esfuerzo por serie</label>
          <select onchange="TrainUI.setSet({effortScale:this.value})">
            <option value="off" ${s.effortScale === "off" ? "selected" : ""}>Desactivada (por defecto)</option>
            <option value="rir" ${s.effortScale === "rir" ? "selected" : ""}>RIR</option>
            <option value="rpe" ${s.effortScale === "rpe" ? "selected" : ""}>RPE</option>
          </select>
        </div>
        <p class="tr-muted">Cada serie guarda la escala con la que se registró. La progresión y el 1RM no leen este valor.</p>
      </div>
      <div class="tr-card" style="margin-top:10px">
        <div class="field"><label>Figura del mapa muscular</label>
          <select onchange="TrainUI.setSet({bodyFigure:this.value})">
            <option value="male" ${s.bodyFigure === "male" ? "selected" : ""}>Hombre</option>
            <option value="female" ${s.bodyFigure === "female" ? "selected" : ""}>Mujer</option>
          </select>
        </div>
        ${field("Objetivo de peso (kg)", `<input type="number" step="0.1" value="${s.bodyWeightGoal ?? ""}" onchange="TrainUI.setSet({bodyWeightGoal:this.value===''?null:+this.value})">`)}
        ${field("Techo de reps a peso corporal", `<input type="number" value="${s.bwRepCeiling}" onchange="TrainUI.setSet({bwRepCeiling:+this.value})">`)}
        <p class="tr-muted">Al superar este techo se añade una serie en vez de una repetición, hasta que el consejo honesto es lastre o una variación más difícil.</p>
        ${field("Incremento por defecto (kg)", `<input type="number" step="0.5" value="${s.defaultIncrement}" onchange="TrainUI.setSet({defaultIncrement:+this.value})">`)}
        ${field("Descanso por defecto (s)", `<input type="number" value="${s.defaultRest}" onchange="TrainUI.setSet({defaultRest:+this.value})">`)}
      </div>
      <div class="caps-head">Material que tienes</div>
      <p class="section-sub">La biblioteca solo mostrará ejercicios que puedas hacer con esta lista. Déjala vacía para verlo todo.</p>
      <div class="ex-filters">${eqs.map((e) =>
        `<button class="ex-filter ${owned.indexOf(e) >= 0 ? "active" : ""}" onclick="TrainUI.toggleEquip('${esc(e)}')">${esc(Train.EQUIPMENT_ES[e])}</button>`).join("")}</div>
    `;
  }

  function refresh() {
    if (typeof router === "function") router();
  }

  async function mount() {
    const before = catalog.length;
    await ensureCatalog();
    const s = Train.getState();
    if (s.activeSession) {
      await setWake(true);
      drawTimers();
      if (!s.activeSession.bodyWeightAsked) askBodyWeight();
    } else {
      await setWake(false);
    }
    if (!before && catalog.length && /entrenar/.test(location.hash || "")) {
      refresh();
    }
  }

  async function setWake(on) {
    const enabled = Train.getState().settings.wakeLock;
    if (!on || !enabled) {
      if (wakeSentinel) {
        try { await wakeSentinel.release(); } catch (e) { /* noop */ }
        wakeSentinel = null;
      }
      return;
    }
    if (!("wakeLock" in navigator)) return;
    try {
      wakeSentinel = await navigator.wakeLock.request("screen");
      wakeSentinel.addEventListener("release", () => { wakeSentinel = null; });
    } catch (e) { /* navegador lo denegó */ }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Train.getState().activeSession) setWake(true);
  });

  function setDay(key, id) { Train.assignDay(key, id || null); refresh(); }
  function clearOv(iso) { Train.clearOverride(iso); refresh(); }

  function askReschedule(fromISO) {
    const to = prompt("Mover el entreno del " + fromISO + " a (AAAA-MM-DD). El plan semanal base no cambia.", Train.todayISO());
    if (!to) return;
    Train.reschedule(fromISO, to);
    refresh();
  }

  function newRoutine() {
    const name = prompt("Nombre de la rutina", "Nueva rutina");
    if (!name) return;
    const r = Train.upsertRoutine({ name: name });
    location.hash = "#/entrenar/rutina/" + r.id;
  }

  async function seedTemplate() {
    await ensureCatalog();
    Train.applyTemplate("fullbody", catalog);
    refresh();
  }

  function delRoutine(id) {
    if (!confirm("¿Borrar esta rutina del plan?")) return;
    Train.deleteRoutine(id);
    refresh();
  }

  function saveRoutineMeta(id) {
    const r = Train.getRoutine(id);
    if (!r) return;
    r.name = document.getElementById("rn-name").value.trim() || r.name;
    r.progression = r.progression || {};
    r.progression.type = document.getElementById("rn-prog").value;
    r.progression.increment = +document.getElementById("rn-inc").value || 2.5;
    r.progression.minReps = +document.getElementById("rn-min").value || 8;
    r.progression.maxReps = +document.getElementById("rn-max").value || 12;
    Train.upsertRoutine(r);
    refresh();
  }

  function patchItem(rid, iid, patch) {
    const r = Train.getRoutine(rid);
    const it = r.items.find((x) => x.id === iid);
    if (!it) return;
    Object.assign(it, patch);
    if (it.perSide && patch.targetReps) it.targetReps = Train.applyPerSide(patch.targetReps, true);
    Train.upsertRoutine(r);
    refresh();
  }

  function setItemRule(rid, iid, type) {
    const r = Train.getRoutine(rid);
    const it = r.items.find((x) => x.id === iid);
    if (!it) return;
    it.progressionOverride = type === "inherit" ? null : { type: type };
    Train.upsertRoutine(r);
    refresh();
  }

  function makeSS(rid, a, b) {
    const r = Train.getRoutine(rid);
    Train.pairSuperset(r, a, b);
    Train.upsertRoutine(r);
    refresh();
  }

  function breakSS(rid, gid) {
    const r = Train.getRoutine(rid);
    Train.clearSuperset(r, gid);
    Train.upsertRoutine(r);
    refresh();
  }

  function removeItem(rid, iid) {
    const r = Train.getRoutine(rid);
    r.items = r.items.filter((x) => x.id !== iid);
    Train.upsertRoutine(r);
    refresh();
  }

  function openPicker(rid) {
    picker = { rid: rid, q: "", grupo: "", eq: [] };
    drawPicker();
  }

  function drawPicker() {
    if (!picker) return;
    const owned = Train.getState().settings.equipment || [];
    let pool = lib();
    if (owned.length) pool = Train.filterByOwned(pool, owned);
    const pack = Train.equipmentOptions(pool, picker.eq, { grupo: picker.grupo || undefined, search: picker.q || undefined });
    const old = document.getElementById("tr-picker");
    if (old) old.remove();
    const box = document.createElement("div");
    box.id = "tr-picker";
    box.className = "tr-modal-bg";
    box.innerHTML = `<div class="tr-modal">
      <h3>Añadir ejercicio · ${pack.items.length} resultados</h3>
      <div class="tr-row">
        ${field("Buscar", `<input id="pk-q" value="${esc(picker.q)}" placeholder="prensa, dominada, plank…">`)}
      </div>
      <div class="ex-filters" style="margin:8px 0">${[{ id: "", n: "Todos" }].concat(Object.keys(Train.GROUP_ES).map((k) => ({ id: k, n: Train.GROUP_ES[k] }))).map((g) =>
        `<button class="ex-filter ${picker.grupo === g.id ? "active" : ""}" data-g="${g.id}">${g.n}</button>`).join("")}</div>
      <div class="ex-filters">${pack.equipment.map((e) =>
        `<button class="ex-filter ${e.selected ? "active" : ""}" data-eq="${esc(e.id)}">${esc(e.name)} · ${e.count}</button>`).join("")}</div>
      <div class="tr-pick-grid">${pack.items.slice(0, 40).map((e) =>
        `<button class="tr-pick" data-id="${esc(e.id)}">${e.gif ? `<img src="${esc(e.gif)}" alt="" loading="lazy">` : `<div class="ex-ph">${esc(e.description || "Custom")}</div>`}<b>${esc(e.name)}</b></button>`).join("")}</div>
      <div class="tr-actions"><button class="btn" id="pk-close">Cerrar</button></div>
    </div>`;
    document.body.appendChild(box);
    box.querySelector("#pk-q").addEventListener("input", (ev) => { picker.q = ev.target.value; drawPicker(); const inp = document.getElementById("pk-q"); if (inp) { inp.focus(); inp.setSelectionRange(picker.q.length, picker.q.length); } });
    box.querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => { picker.grupo = b.getAttribute("data-g"); drawPicker(); }));
    box.querySelectorAll("[data-eq]").forEach((b) => b.addEventListener("click", () => {
      const id = b.getAttribute("data-eq");
      const i = picker.eq.indexOf(id);
      if (i >= 0) picker.eq.splice(i, 1); else picker.eq.push(id);
      drawPicker();
    }));
    box.querySelectorAll(".tr-pick").forEach((b) => b.addEventListener("click", () => addPicked(b.getAttribute("data-id"))));
    box.querySelector("#pk-close").addEventListener("click", () => { box.remove(); picker = null; });
    box.addEventListener("click", (e) => { if (e.target === box) { box.remove(); picker = null; } });
  }

  function addPicked(id) {
    const ex = Train.findExercise(id, catalog);
    if (!ex || !picker) return;
    const r = Train.getRoutine(picker.rid);
    r.items.push(Train.makeRoutineItem(ex));
    Train.upsertRoutine(r);
    document.getElementById("tr-picker")?.remove();
    picker = null;
    refresh();
  }

  function openCustom(rid) {
    const name = prompt("Nombre del ejercicio");
    if (!name) return;
    const body = prompt("Parte del cuerpo (pectorals, lats, quads, abs…)", "quads");
    if (!body) return;
    const desc = prompt("Descripción opcional (en vez de animación)", "") || "";
    try {
      const ex = Train.addCustomExercise({ name: name, bodyPart: body, description: desc });
      const r = Train.getRoutine(rid);
      r.items.push(Train.makeRoutineItem(ex));
      Train.upsertRoutine(r);
      refresh();
    } catch (e) { alert(e.message); }
  }

  async function begin(iso) {
    await ensureCatalog();
    Train.startSession(iso, catalog);
    await setWake(true);
    location.hash = "#/entrenar/sesion";
    refresh();
  }

  function freeSession() {
    Train.startSession(Train.todayISO(), catalog);
    setWake(true);
    location.hash = "#/entrenar/sesion";
  }

  function askBodyWeight() {
    if (document.getElementById("tr-bw-modal")) return;
    const last = Train.getState().weighIns.slice(-1)[0];
    const box = document.createElement("div");
    box.id = "tr-bw-modal";
    box.className = "tr-modal-bg";
    box.innerHTML = `<div class="tr-modal">
      <h3>Peso corporal de hoy</h3>
      <p class="tr-muted">Se pide al empezar la sesión. También queda en tu gráfica de peso.</p>
      <div class="tr-row">${field("kg", `<input id="ses-bw" type="number" step="0.1" value="${last ? last.kg : ""}">`)}
        <button class="btn primary" id="ses-bw-ok">Continuar</button>
        <button class="btn" id="ses-bw-skip">Omitir</button></div>
    </div>`;
    document.body.appendChild(box);
    const done = (kg) => {
      Train.patchSession((ses) => {
        ses.bodyWeightAsked = true;
        ses.bodyWeightKg = kg;
      });
      box.remove();
      refresh();
    };
    box.querySelector("#ses-bw-ok").onclick = () => {
      const v = document.getElementById("ses-bw").value;
      done(v === "" ? null : +v);
    };
    box.querySelector("#ses-bw-skip").onclick = () => done(null);
  }

  function setCell(ii, si, key, val) {
    Train.patchSession((ses) => {
      const st = ses.items[ii].sets[si];
      if (key === "speed") st.speed = val;
      else st[key] = val === "" ? "" : +val;
      const it = ses.items[ii];
      if (it.perSide && key === "reps" && st.reps) st.reps = Train.applyPerSide(st.reps, true);
    });
    refresh();
  }

  function stepRep(ii, si, dir) {
    Train.patchSession((ses) => {
      const it = ses.items[ii];
      const st = it.sets[si];
      const step = it.perSide ? 2 : 1;
      const cur = Number(st.reps) || 0;
      st.reps = Math.max(0, cur + dir * step);
    });
    refresh();
  }

  function partnerIndex(ses, ii) {
    const g = ses.items[ii].supersetGroup;
    if (!g) return -1;
    return ses.items.findIndex((it, j) => j !== ii && it.supersetGroup === g);
  }

  function toggleSet(ii, si) {
    const s = Train.getState();
    let prMsg = null;
    Train.patchSession((ses) => {
      const it = ses.items[ii];
      const st = it.sets[si];
      st.completed = !st.completed;
      if (st.completed) {
        const cand = {
          weight: st.weight, reps: st.reps, timeSec: st.timeSec,
        };
        const pr = Train.detectPR(it.exerciseId, cand, s.workouts.concat([{
          date: ses.date,
          items: ses.items.map((x, xi) => ({
            exerciseId: x.exerciseId,
            sets: x.sets.filter((y, yi) => x !== it || yi !== si).filter((y) => y.completed),
          })),
        }]), it.logType);
        st.isPR = !!pr;
        if (pr) prMsg = pr.message;
        st.effortScale = s.settings.effortScale === "off" ? st.effortScale : s.settings.effortScale;
      } else {
        st.isPR = false;
      }
    });
    const ses = Train.getState().activeSession;
    const it = ses.items[ii];
    if (it.sets[si].completed) {
      const pj = partnerIndex(ses, ii);
      const pairPending = pj >= 0 && !(ses.items[pj].sets[si] && ses.items[pj].sets[si].completed);
      if (it.supersetGroup && pairPending) {
        /* descanso solo después del par */
      } else if (it.restSec > 0) {
        startRest(it.restSec);
      }
    }
    if (prMsg) toast(prMsg);
    refresh();
  }

  function startRest(sec) {
    clearInterval(restTimer);
    restLeft = sec;
    restTimer = setInterval(() => {
      restLeft -= 1;
      if (restLeft <= 0) { clearInterval(restTimer); restTimer = null; }
      drawTimers();
    }, 1000);
    drawTimers();
  }

  function toggleWork(ii, si) {
    if (workTimer && workCtx && workCtx.ii === ii && workCtx.si === si) {
      clearInterval(workTimer);
      workTimer = null;
      Train.patchSession((ses) => { ses.items[ii].sets[si].timeSec = workElapsed; });
      workCtx = null;
      refresh();
      return;
    }
    clearInterval(workTimer);
    workElapsed = 0;
    workCtx = { ii: ii, si: si };
    workTimer = setInterval(() => { workElapsed += 1; drawTimers(); }, 1000);
    drawTimers();
  }

  function drawTimers() {
    const box = document.getElementById("trTimers");
    if (!box) return;
    let html = "";
    if (restTimer) html += `<div class="tr-timer"><div><div class="tr-muted">Descanso</div><div class="tt-big">${Train.formatDuration(restLeft)}</div></div>
      <button class="btn" onclick="TrainUI.skipRest()">Saltar</button></div>`;
    if (workTimer) html += `<div class="tr-timer work"><div><div class="tr-muted">Trabajo · pulsa de nuevo para guardar el tiempo sostenido</div><div class="tt-big">${Train.formatDuration(workElapsed)}</div></div></div>`;
    box.innerHTML = html;
  }

  function skipRest() {
    clearInterval(restTimer);
    restTimer = null;
    drawTimers();
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "tr-card";
    t.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:90;border-color:var(--gold)";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  function finish() {
    const ses = Train.getState().activeSession;
    const work = Train.sessionMuscles(ses, catalog);
    const w = Train.finishSession();
    setWake(false);
    clearInterval(restTimer); restTimer = null;
    clearInterval(workTimer); workTimer = null;
    location.hash = "#/entrenar/stats";
    setTimeout(() => {
      const host = document.getElementById("app");
      if (!host) return;
      const note = document.createElement("div");
      note.className = "tr-card";
      note.style.marginBottom = "12px";
      note.innerHTML = `<h3>Acabas de entrenar · ${w ? Train.formatDuration(w.durationSec) : ""}</h3>
        <p class="tr-muted">Músculos tocados ahora mismo:</p>${muscleMaps(work, Train.getState().settings.bodyFigure)}`;
      host.insertBefore(note, host.querySelector(".tr-subnav")?.nextSibling || host.firstChild);
    }, 40);
  }

  function discard() {
    if (!confirm("¿Descartar la sesión en curso?")) return;
    Train.discardSession();
    setWake(false);
    location.hash = "#/entrenar";
  }

  function saveWeight() {
    const kg = +document.getElementById("bw-kg").value;
    const date = document.getElementById("bw-date").value;
    const goal = document.getElementById("bw-goal").value;
    Train.addWeighIn(kg, date);
    Train.updateSettings({ bodyWeightGoal: goal === "" ? null : +goal });
    refresh();
  }

  function delWeight(id) { Train.removeWeighIn(id); refresh(); }

  function calcORM() {
    calc1.w = +document.getElementById("orm-w").value;
    calc1.r = +document.getElementById("orm-r").value;
    const est = Train.epley1RM(calc1.w, calc1.r);
    const out = document.getElementById("orm-out");
    if (!out) return;
    out.innerHTML = est == null
      ? "<b>No se estima por encima de 12 repeticiones</b> (ni con 0 reps / 0 kg)."
      : `1RM estimado (Epley): <b>${Train.trimNum(est)} kg</b> a partir de ${calc1.r} × ${Train.trimNum(calc1.w)} kg.`;
  }

  function setPeriod(k) {
    try { sessionStorage.setItem("hh-muscle-period", k); } catch (e) { /* noop */ }
    refresh();
  }

  function libQ(v) { try { sessionStorage.setItem("hh-lib-q", v); } catch (e) {} refresh(); }
  function libG(v) { try { sessionStorage.setItem("hh-lib-g", v); } catch (e) {} refresh(); }
  function libEq(id) {
    let sel = [];
    try { sel = (sessionStorage.getItem("hh-lib-eq") || "").split(",").filter(Boolean); } catch (e) {}
    const i = sel.indexOf(id);
    if (i >= 0) sel.splice(i, 1); else sel.push(id);
    try { sessionStorage.setItem("hh-lib-eq", sel.join(",")); } catch (e) {}
    refresh();
  }

  function setSet(patch) { Train.updateSettings(patch); refresh(); }

  function toggleEquip(id) {
    const s = Train.getState();
    const eq = s.settings.equipment.slice();
    const i = eq.indexOf(id);
    if (i >= 0) eq.splice(i, 1); else eq.push(id);
    Train.updateSettings({ equipment: eq });
    refresh();
  }

  function downloadPlan() {
    const blob = new Blob([JSON.stringify(Train.exportPlan(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "healthyhead-plan.json";
    a.click();
  }

  function printPlan() {
    const plan = Train.exportPlan();
    const s = Train.getState();
    const days = Train.DAYS.map((d) => {
      const rid = plan.weeklyPlan[d.key];
      const r = s.routines.find((x) => x.id === rid);
      return `<tr><td>${d.name}</td><td>${r ? esc(r.name) : "Descanso"}</td></tr>`;
    }).join("");
    const routines = s.routines.map((r) =>
      `<h3>${esc(r.name)}</h3><ol>${r.items.map((it) =>
        `<li>${esc(it.name)} — ${it.targetSets} × ${it.logType === "timed" ? (it.targetTime + "s") : (it.targetReps + " reps")}${it.supersetGroup ? " (superserie)" : ""}</li>`).join("")}</ol>`).join("");
    const w = window.open("", "_blank");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Plan Healthyhead</title>
      <style>body{font:14px/1.5 Georgia,serif;padding:28px;color:#222}h1,h3{margin:0 0 8px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}</style></head><body>
      <h1>Plan semanal</h1><p>Solo rutinas y horario. Sin entrenos ni pesajes.</p>
      <table><thead><tr><th>Día</th><th>Rutina</th></tr></thead><tbody>${days}</tbody></table>
      ${routines}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  async function importPlan(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const added = Train.mergePlan(data);
      alert("Merge listo. Rutinas nuevas: " + added.routines + " · ejercicios custom: " + added.custom + " · días rellenados (solo huecos): " + added.days + ". Nada se ha sobrescrito.");
      refresh();
    } catch (e) {
      alert("No se pudo importar: " + e.message);
    }
  }

  return {
    render, mount, setDay, clearOv, askReschedule, newRoutine, seedTemplate, delRoutine,
    saveRoutineMeta, patchItem, setItemRule, makeSS, breakSS, removeItem, openPicker, openCustom,
    begin, freeSession, setCell, stepRep, toggleSet, toggleWork, skipRest, finish, discard,
    saveWeight, delWeight, calcORM, setPeriod, libQ, libG, libEq, setSet, toggleEquip,
    downloadPlan, printPlan, importPlan, muscleMaps, catalogSize: () => catalog.length,
  };
})();
