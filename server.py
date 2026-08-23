#!/usr/bin/env python3
"""
Healthyhead — servidor local.

Sirve la web estática Y hace de proxy a la API real de MyHealthfinder
(ODPHP · health.gov). El proxy resuelve el problema de CORS: como la
web y la API quedan en el mismo origen (tu localhost), el navegador
permite las peticiones de "Mis recomendaciones".

Uso:
    python server.py
Luego abre:  http://127.0.0.1:8899

No requiere instalar nada (solo la librería estándar de Python 3).
"""

import base64
import email.utils
import html
import json
import os
import re
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8899
HOST = "127.0.0.1"
UPSTREAM = "https://odphp.health.gov/myhealthfinder/api/v4/myhealthfinder.json"
ALLOWED = {"age", "sex", "lang", "pregnant", "tobaccoUse", "sexualActivity"}

WGER = "https://wger.de/api/v2/exerciseinfo/"
WGER_ALLOWED = {"category", "muscles", "equipment", "limit", "offset"}

# Noticias de salud / investigación (RSS de ScienceDaily, por temática)
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
NEWS_FEEDS = {
    "general": "health_medicine",
    "cardio": "health_medicine/heart_disease",
    "nutricion": "health_medicine/diet_and_weight_loss",
    "sueno": "health_medicine/sleep_disorders",
    "mente": "mind_brain",
    "fuerza": "health_medicine/fitness",
    "longevidad": "health_medicine/healthy_aging",
}
NEWS_CACHE = {}          # "fuente:tema" -> (timestamp, [items], label)
NEWS_TTL = 900           # 15 min

# Noticias en español (Google Noticias RSS, por tema y por clínicas de renombre)
GNEWS_QUERIES = {
    "general": "salud",
    "cardio": "salud cardiovascular corazón",
    "nutricion": "nutrición alimentación saludable",
    "sueno": "sueño insomnio descanso salud",
    "mente": "salud mental bienestar psicológico",
    "fuerza": "ejercicio entrenamiento fuerza salud",
    "longevidad": "longevidad envejecimiento saludable",
    "clinicas": '"Clínica Mayo" OR "Johns Hopkins" OR "Cleveland Clinic" OR "Clínica Universidad de Navarra" salud',
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GYM_FILE = os.path.join(BASE_DIR, "data", "gym_exercises.json")
_GYM = None


def load_gym():
    global _GYM
    if _GYM is None:
        with open(GYM_FILE, encoding="utf-8") as fh:
            _GYM = json.load(fh)
    return _GYM


IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img", "areas")
MANIFEST = os.path.join(IMG_DIR, "manifest.json")
EXT_BY_MIME = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_UPLOAD = 6 * 1024 * 1024  # 6 MB


def clean_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def parse_rss(raw, with_summary=True):
    root = ET.fromstring(raw)
    channel = root.find("channel")
    items = []
    for it in (channel.findall("item") if channel is not None else []):
        title = clean_html(it.findtext("title"))
        src_el = it.find("source")
        fuente = src_el.text.strip() if (src_el is not None and src_el.text) else ""
        # Google Noticias añade " - Medio" al final del título
        if fuente and title.endswith(" - " + fuente):
            title = title[: -(len(fuente) + 3)].strip()
        pub = it.findtext("pubDate") or ""
        fecha = ""
        try:
            fecha = email.utils.parsedate_to_datetime(pub).strftime("%Y/%m/%d")
        except Exception:  # noqa: BLE001
            pass
        items.append({
            "title": title,
            "link": (it.findtext("link") or "").strip(),
            "summary": clean_html(it.findtext("description"))[:230] if with_summary else "",
            "fecha": fecha,
            "fuente": fuente,
        })
    return items


class Handler(SimpleHTTPRequestHandler):
    # Evita que el caché del navegador esconda cambios durante el desarrollo
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/recomendaciones":
            return self.proxy(parsed.query, UPSTREAM, ALLOWED, {"lang": "es"})
        if parsed.path == "/api/ejercicios":
            return self.proxy(parsed.query, WGER, WGER_ALLOWED, {"format": "json", "limit": "45"})
        if parsed.path == "/api/noticias":
            return self.noticias(parsed.query)
        if parsed.path == "/api/gym":
            return self.gym(parsed.query)
        return super().do_GET()

    def gym(self, query):
        params = dict(urllib.parse.parse_qsl(query))
        grupo = params.get("grupo", "")
        equipo = params.get("equipo", "")
        q = params.get("q", "").strip().lower()
        catalog = params.get("catalog") == "1"
        ids = {x for x in params.get("ids", "").split(",") if x}
        try:
            limit = min(int(params.get("limit", 24)), 1400)
        except ValueError:
            limit = 24
        try:
            offset = max(int(params.get("offset", 0)), 0)
        except ValueError:
            offset = 0
        try:
            data = load_gym()
        except Exception as exc:  # noqa: BLE001
            return self._json(500, {"error": str(exc)})
        items = data
        if ids:
            items = [x for x in items if x.get("id") in ids]
        if grupo:
            items = [x for x in items if x.get("grupo") == grupo]
        if equipo:
            wanted = {e.strip() for e in equipo.split(",") if e.strip()}
            items = [x for x in items if x.get("equipo") in wanted]
        if q:
            items = [x for x in items if q in (x.get("name") or "").lower()
                     or q in (x.get("target") or "").lower()
                     or q in (x.get("equipo") or "").lower()]
        from collections import Counter
        eq_counts = Counter(x.get("equipo") for x in items if x.get("equipo"))
        if catalog:
            items = [{
                "id": x.get("id"),
                "name": x.get("name"),
                "grupo": x.get("grupo"),
                "equipo": x.get("equipo"),
                "target": x.get("target"),
                "sec": x.get("sec") or [],
                "gif": x.get("gif"),
                "pasos": x.get("pasos") or [],
            } for x in items]
        equipos = sorted({x.get("equipo") for x in data if x.get("equipo")})
        self._json(200, {
            "total": len(items),
            "items": items[offset:offset + limit],
            "equipos": equipos,
            "equipo_counts": dict(eq_counts),
            "count": len(data),
        })

    def noticias(self, query):
        params = dict(urllib.parse.parse_qsl(query))
        fuente = params.get("fuente", "es")        # "es" (Google Noticias) | "research" (ScienceDaily)
        tema = params.get("tema", "general")
        try:
            limit = min(int(params.get("limit", 12)), 30)
        except ValueError:
            limit = 12
        key = f"{fuente}:{tema}"
        now = time.time()
        try:
            cached = NEWS_CACHE.get(key)
            if cached and now - cached[0] < NEWS_TTL:
                items, label = cached[1], cached[2]
            else:
                if fuente == "research":
                    path = NEWS_FEEDS.get(tema, NEWS_FEEDS["general"])
                    url = f"https://www.sciencedaily.com/rss/{path}.xml"
                    label, with_summary = "ScienceDaily", True
                else:
                    q = GNEWS_QUERIES.get(tema, GNEWS_QUERIES["general"])
                    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
                        {"q": q, "hl": "es-419", "gl": "MX", "ceid": "MX:es"})
                    label, with_summary = "Google Noticias", False
                req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
                with urllib.request.urlopen(req, timeout=20) as r:
                    items = parse_rss(r.read(), with_summary)
                NEWS_CACHE[key] = (now, items, label)
            self._json(200, {"source": label, "fuente": fuente, "tema": tema, "items": items[:limit]})
        except Exception as exc:  # noqa: BLE001
            self._json(502, {"error": str(exc)})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/upload":
            return self.upload()
        self.send_error(404)

    def upload(self):
        # Recibe {area, name, data:"data:image/...;base64,..."} y guarda la portada
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length <= 0 or length > MAX_UPLOAD * 1.4:
                raise ValueError("Tamaño no válido")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            area = "".join(c for c in payload.get("area", "") if c.isalnum() or c in "-_")
            data_url = payload.get("data", "")
            if not area or not data_url.startswith("data:"):
                raise ValueError("Petición incompleta")
            header, b64 = data_url.split(",", 1)
            mime = header.split(";")[0].replace("data:", "")
            ext = EXT_BY_MIME.get(mime)
            if not ext:
                raise ValueError("Formato no admitido (usa PNG, JPG o WEBP)")
            raw = base64.b64decode(b64)
            if len(raw) > MAX_UPLOAD:
                raise ValueError("La imagen supera los 6 MB")
            os.makedirs(IMG_DIR, exist_ok=True)
            # Limpia versiones previas con otra extensión
            for e in EXT_BY_MIME.values():
                old = os.path.join(IMG_DIR, f"{area}.{e}")
                if e != ext and os.path.exists(old):
                    os.remove(old)
            fname = f"{area}.{ext}"
            with open(os.path.join(IMG_DIR, fname), "wb") as fh:
                fh.write(raw)
            rel = f"assets/img/areas/{fname}"
            self._update_manifest(area, rel)
            self._json(200, {"url": rel})
        except Exception as exc:  # noqa: BLE001
            self._json(400, {"error": str(exc)})

    def _update_manifest(self, area, rel):
        data = {"areas": {}}
        if os.path.exists(MANIFEST):
            try:
                with open(MANIFEST, encoding="utf-8") as fh:
                    data = json.load(fh)
            except Exception:  # noqa: BLE001
                data = {"areas": {}}
        data.setdefault("areas", {})[area] = rel
        with open(MANIFEST, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def proxy(self, query, upstream, allowed, defaults=None):
        # Filtra solo parámetros permitidos y reenvía a la API externa
        params = {k: v for k, v in urllib.parse.parse_qsl(query) if k in allowed}
        for k, v in (defaults or {}).items():
            params.setdefault(k, v)
        url = f"{upstream}?{urllib.parse.urlencode(params)}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Healthyhead/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:  # noqa: BLE001
            payload = json.dumps({"error": str(exc), "upstream": url}).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(payload)

    def log_message(self, fmt, *args):  # silencia el log ruidoso
        pass


if __name__ == "__main__":
    print(f"Healthyhead corriendo en  http://{HOST}:{PORT}")
    print("Proxy de API real activo en /api/recomendaciones")
    print("Ctrl+C para detener.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
