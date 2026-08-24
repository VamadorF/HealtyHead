/* ============================================================
   HEALTHYHEAD — Catálogo de ejercicios
   Carga el dataset local (data/gym_exercises.json) y filtra
   en el cliente. Así la biblioteca funciona en Vercel / hosting
   estático, sin python server.py. Misma forma de respuesta que /api/gym.
   Funciona en navegador y en Node (tests + funciones Vercel).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GymCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATIC_URLS = ["data/gym_exercises.json", "/data/gym_exercises.json"];
  const API_URL = "/api/gym?catalog=1&limit=1400";

  let cache = null;
  let loading = null;

  function asInt(value, fallback, max) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    const v = n < 0 ? 0 : n;
    return max == null ? v : Math.min(v, max);
  }

  function catalogFields(item) {
    return {
      id: item.id,
      name: item.name,
      grupo: item.grupo,
      equipo: item.equipo,
      target: item.target,
      sec: item.sec || [],
      gif: item.gif,
      pasos: item.pasos || [],
    };
  }

  function query(items, params) {
    const p = params || {};
    const grupo = p.grupo || "";
    const equipo = p.equipo || "";
    const q = String(p.q || "").trim().toLowerCase();
    const catalog = p.catalog === true || p.catalog === 1 || p.catalog === "1";
    const idsRaw = p.ids || "";
    const ids = new Set(String(idsRaw).split(",").map((x) => x.trim()).filter(Boolean));
    const limit = asInt(p.limit, 24, 1400);
    const offset = asInt(p.offset, 0, null);

    let filtered = items || [];
    if (ids.size) filtered = filtered.filter((x) => ids.has(x.id));
    if (grupo) filtered = filtered.filter((x) => x.grupo === grupo);
    if (equipo) {
      const wanted = new Set(String(equipo).split(",").map((e) => e.trim()).filter(Boolean));
      filtered = filtered.filter((x) => wanted.has(x.equipo));
    }
    if (q) {
      filtered = filtered.filter((x) =>
        String(x.name || "").toLowerCase().indexOf(q) >= 0
        || String(x.target || "").toLowerCase().indexOf(q) >= 0
        || String(x.equipo || "").toLowerCase().indexOf(q) >= 0);
    }

    const equipoCounts = {};
    filtered.forEach((x) => {
      if (x.equipo) equipoCounts[x.equipo] = (equipoCounts[x.equipo] || 0) + 1;
    });

    const projected = catalog ? filtered.map(catalogFields) : filtered.slice();
    const equipos = Array.from(new Set((items || []).map((x) => x.equipo).filter(Boolean))).sort();

    return {
      total: projected.length,
      items: projected.slice(offset, offset + limit),
      equipos: equipos,
      equipo_counts: equipoCounts,
      count: (items || []).length,
    };
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function loadAll() {
    if (cache && cache.length) return cache;
    if (loading) return loading;
    loading = (async () => {
      let lastErr = null;
      for (let i = 0; i < STATIC_URLS.length; i++) {
        try {
          const data = await fetchJson(STATIC_URLS[i]);
          if (Array.isArray(data) && data.length) {
            cache = data;
            return cache;
          }
        } catch (err) {
          lastErr = err;
        }
      }
      try {
        const payload = await fetchJson(API_URL);
        const items = payload && payload.items;
        if (Array.isArray(items) && items.length) {
          cache = items;
          return cache;
        }
      } catch (err) {
        lastErr = err;
      }
      throw lastErr || new Error("HTTP 404");
    })();
    try {
      return await loading;
    } finally {
      loading = null;
    }
  }

  async function fetchGym(params) {
    const items = await loadAll();
    return query(items, params);
  }

  function setCatalog(items) {
    cache = Array.isArray(items) ? items : [];
    return cache;
  }

  function getCatalog() {
    return cache || [];
  }

  return {
    query: query,
    loadAll: loadAll,
    fetchGym: fetchGym,
    setCatalog: setCatalog,
    getCatalog: getCatalog,
  };
});
