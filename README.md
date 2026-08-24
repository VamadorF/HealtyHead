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

> También puedes abrir `index.html` directamente. La **biblioteca de ejercicios**
> carga `data/gym_exercises.json` en el cliente (funciona en Vercel y en cualquier
> hosting estático). **"Mis recomendaciones"** y **Noticias** sí necesitan un
> proxy para evitar CORS: `python server.py` en local, o las funciones de
> `/api` si despliegas en Vercel.

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
api/                # Funciones serverless para Vercel (/api/gym, noticias, recomendaciones)
data/gym_exercises.json  # Dataset local de la biblioteca (1.324 ejercicios)
assets/css/styles.css
assets/js/data.js        # "Base de datos": áreas, guías, builds, artículos, tiers
assets/js/gym-catalog.js # Carga y filtro del dataset (sin depender de Python)
assets/js/app.js         # Router SPA + render + integración con la API
vercel.json              # Cabeceras y empaquetado del dataset para Vercel
```

## Despliegue en Vercel

El sitio es estático: Vercel sirve `index.html`, `assets/` y `data/`. La biblioteca
de ejercicios **no necesita Python**; lee `data/gym_exercises.json` en el navegador
y, además, existe `api/gym.js` por si alguien llama a `/api/gym`.

Las rutas `/api/noticias` y `/api/recomendaciones` son funciones serverless (proxy
RSS y MyHealthfinder). Tras un deploy, abre `#/ejercicios` y confirma que aparecen
los GIF; un 404 en `/api/gym` ya no deja la biblioteca en blanco.

## Aviso

Contenido **educativo**, no consejo médico. Los porcentajes de éxito son estimaciones
ilustrativas basadas en literatura general de salud pública. Consulta siempre a un
profesional de la salud para decisiones sobre tu bienestar.
