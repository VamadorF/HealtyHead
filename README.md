# 💚 Healthyhead

La base de datos de salud estilo **Wowhead**, en español. Guías por área de salud,
"builds" de hábitos, tier lists por evidencia, artículos y **recomendaciones oficiales
en vivo** según tu perfil.

## Cómo arrancarlo

Necesitas Python 3 (nada más, sin instalar dependencias):

```bash
python server.py
```

Luego abre **http://127.0.0.1:8899** en tu navegador.

> También puedes abrir `index.html` directamente, pero entonces la sección
> **"Mis recomendaciones"** no podrá consultar la API en vivo (por CORS). El
> `server.py` incluye un pequeño proxy que resuelve ese problema.

## Qué incluye

- **Áreas de salud** (las "clases"): Cardiovascular, Nutrición, Sueño, Salud Mental,
  Fuerza y Longevidad — cada una con una **guía completa** (overview, beneficios/precauciones,
  cheat sheet, builds, FAQ y referencias reales a OMS, CDC, Mayo Clinic, MedlinePlus…).
- **Builds de hábitos**: estrategias con pasos y su **% de éxito estimado** en la población.
- **Tier List** con colores de calidad tipo Wowhead (S Legendario, A Épico, B Raro, C Poco común).
- **Artículos** educativos escritos por los especialistas.
- **Mis recomendaciones** 🎯: consulta en vivo cribados y vacunas sugeridos para tu edad y
  sexo usando la **API real de MyHealthfinder** (ODPHP · health.gov), en español.
- **Cheatsheet global** y directorio de **especialistas**.

## Estructura

```
index.html          # Shell + navegación
server.py           # Servidor estático + proxy a la API real (evita CORS)
assets/css/styles.css
assets/js/data.js    # "Base de datos": áreas, guías, builds, artículos, tiers
assets/js/app.js     # Router SPA + render + integración con la API
```

## Aviso

Contenido **educativo**, no consejo médico. Los porcentajes de éxito son estimaciones
ilustrativas basadas en literatura general de salud pública. Consulta siempre a un
profesional de la salud para decisiones sobre tu bienestar.
