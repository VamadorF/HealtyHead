"use strict";
/**
 * Vercel: GET /api/noticias
 * Proxy RSS (Google Noticias / ScienceDaily) para evitar CORS.
 */
const NEWS_FEEDS = {
  general: "health_medicine",
  cardio: "health_medicine/heart_disease",
  nutricion: "health_medicine/diet_and_weight_loss",
  sueno: "health_medicine/sleep_disorders",
  mente: "mind_brain",
  fuerza: "health_medicine/fitness",
  longevidad: "health_medicine/healthy_aging",
};

const GNEWS_QUERIES = {
  general: "salud",
  cardio: "salud cardiovascular corazón",
  nutricion: "nutrición alimentación saludable",
  sueno: "sueño insomnio descanso salud",
  mente: "salud mental bienestar psicológico",
  fuerza: "ejercicio entrenamiento fuerza salud",
  longevidad: "longevidad envejecimiento saludable",
  clinicas: '"Clínica Mayo" OR "Johns Hopkins" OR "Cleveland Clinic" OR "Clínica Universidad de Navarra" salud',
};

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const cache = {};
const TTL_MS = 15 * 60 * 1000;

function paramsFromReq(req) {
  const raw = req.url || "";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return new URLSearchParams(q);
}

function cleanHtml(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const re = new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function parseRss(raw, withSummary) {
  const items = [];
  const re = /<item\b[\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(raw))) {
    const block = m[0];
    let title = cleanHtml(tag(block, "title"));
    const src = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);
    const fuente = src ? cleanHtml(src[1]) : "";
    if (fuente && title.endsWith(" - " + fuente)) title = title.slice(0, -(fuente.length + 3)).trim();
    const pub = cleanHtml(tag(block, "pubDate"));
    let fecha = "";
    const d = pub ? new Date(pub) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      fecha = y + "/" + mo + "/" + da;
    }
    items.push({
      title: title,
      link: cleanHtml(tag(block, "link")),
      summary: withSummary ? cleanHtml(tag(block, "description")).slice(0, 230) : "",
      fecha: fecha,
      fuente: fuente,
    });
  }
  return items;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const params = paramsFromReq(req);
  const fuente = params.get("fuente") || "es";
  const tema = params.get("tema") || "general";
  const limit = Math.min(parseInt(params.get("limit") || "12", 10) || 12, 30);
  const key = fuente + ":" + tema;
  const now = Date.now();
  try {
    const hit = cache[key];
    let items;
    let label;
    if (hit && now - hit.at < TTL_MS) {
      items = hit.items;
      label = hit.label;
    } else {
      let url;
      let withSummary;
      if (fuente === "research") {
        const path = NEWS_FEEDS[tema] || NEWS_FEEDS.general;
        url = "https://www.sciencedaily.com/rss/" + path + ".xml";
        label = "ScienceDaily";
        withSummary = true;
      } else {
        const q = GNEWS_QUERIES[tema] || GNEWS_QUERIES.general;
        url = "https://news.google.com/rss/search?" + new URLSearchParams({
          q: q, hl: "es-419", gl: "MX", ceid: "MX:es",
        }).toString();
        label = "Google Noticias";
        withSummary = false;
      }
      const upstream = await fetch(url, { headers: { "User-Agent": BROWSER_UA } });
      if (!upstream.ok) throw new Error("HTTP " + upstream.status);
      items = parseRss(await upstream.text(), withSummary);
      cache[key] = { at: now, items: items, label: label };
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ source: label, fuente: fuente, tema: tema, items: items.slice(0, limit) }));
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
  }
};
