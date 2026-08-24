"use strict";
/**
 * Vercel: GET /api/recomendaciones
 * Proxy a MyHealthfinder (ODPHP · health.gov) para evitar CORS.
 */
const UPSTREAM = "https://odphp.health.gov/myhealthfinder/api/v4/myhealthfinder.json";
const ALLOWED = ["age", "sex", "lang", "pregnant", "tobaccoUse", "sexualActivity"];

function paramsFromReq(req) {
  const raw = req.url || "";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return new URLSearchParams(q);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const incoming = paramsFromReq(req);
  const params = new URLSearchParams();
  ALLOWED.forEach((k) => {
    if (incoming.has(k)) params.set(k, incoming.get(k));
  });
  if (!params.has("lang")) params.set("lang", "es");
  const url = UPSTREAM + "?" + params.toString();
  try {
    const upstream = await fetch(url, { headers: { "User-Agent": "Healthyhead/1.0" } });
    const body = await upstream.text();
    res.statusCode = upstream.ok ? 200 : 502;
    res.end(body);
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: String(err && err.message ? err.message : err), upstream: url }));
  }
};
