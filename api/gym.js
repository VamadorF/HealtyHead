"use strict";
/**
 * Vercel: GET /api/gym
 * Misma respuesta que server.py para que el deploy estático no dé 404.
 */
const fs = require("fs");
const path = require("path");
const GymCatalog = require("../assets/js/gym-catalog.js");

let catalog = null;

function loadCatalog() {
  if (!catalog) {
    const file = path.join(__dirname, "..", "data", "gym_exercises.json");
    catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return catalog;
}

function paramsFromReq(req) {
  const raw = req.url || "";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return Object.fromEntries(new URLSearchParams(q));
}

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  try {
    const data = GymCatalog.query(loadCatalog(), paramsFromReq(req));
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
  }
};
