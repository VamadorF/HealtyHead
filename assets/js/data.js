/* ============================================================
   HEALTHYHEAD — Base de datos de salud
   Contenido educativo. Los porcentajes de "éxito" son
   ESTIMACIONES ILUSTRATIVAS basadas en literatura general
   de salud pública y no sustituyen consejo médico.
   La sección "Mis recomendaciones" usa la API REAL de
   MyHealthfinder (ODPHP, health.gov) del gobierno de EE. UU.
   ============================================================ */

const API = {
  // Proxy (server.py en local, funciones serverless en Vercel) — mismo origen, sin CORS.
  base: "/api/recomendaciones",
  // Enlace directo a la API oficial, para el fallback y para "abrir en health.gov".
  directo: "https://odphp.health.gov/myhealthfinder/api/v4/myhealthfinder.json",
  // Biblioteca de ejercicios. El cliente carga data/gym_exercises.json; /api/gym es opcional.
  gym: "/api/gym",
  // Noticias de investigación (RSS) vía proxy (server.py o /api/noticias en Vercel).
  noticias: "/api/noticias",
};

const DB = {
  // ---------- ÁREAS DE SALUD (las "clases") ----------
  areas: [
    {
      id: "cardio",
      nombre: "Salud Cardiovascular",
      icono: "❤️",
      color: "#e0525f",
      tipo: "Sistema Vital",
      lema: "La mayor parte del riesgo cardiovascular es modificable.",
      descripcion:
        "El aparato cardiovascular distribuye oxígeno y nutrientes a todo el organismo. Su cuidado es una de las intervenciones con mayor impacto sobre la esperanza y la calidad de vida. La prevención se basa en el control de los factores de riesgo: presión arterial, perfil lipídico, glucemia, tabaquismo y actividad física regular.",
      specs: [
        { nombre: "Prevención Primaria", rol: "Antes del problema", desc: "Para quien aún no tiene enfermedad y quiere evitarla." },
        { nombre: "Control de Presión", rol: "Mantenimiento", desc: "Manejo de la hipertensión con hábitos y seguimiento." },
        { nombre: "Salud del Colesterol", rol: "Metabólico", desc: "Optimizar el perfil de lípidos (LDL, HDL, triglicéridos)." },
      ],
      objetivos: ["cardio-aerobico", "cardio-presion", "cardio-lipidos"],
      especialistas: ["esp-cardiologo", "esp-nutricionista"],
    },
    {
      id: "nutricion",
      nombre: "Nutrición y Metabolismo",
      icono: "🥗",
      color: "#5fb36b",
      tipo: "Sistema Vital",
      lema: "El patrón alimentario pesa más que cualquier alimento aislado.",
      descripcion:
        "La alimentación influye en el peso, la glucemia, el perfil lipídico y la inflamación. La evidencia respalda los patrones alimentarios completos —como el mediterráneo o los basados en vegetales— por encima de las dietas restrictivas de moda. El objetivo terapéutico es la adherencia sostenida, no la restricción perfecta.",
      specs: [
        { nombre: "Composición Corporal", rol: "Pérdida de grasa", desc: "Déficit calórico sostenible con proteína suficiente." },
        { nombre: "Control Glucémico", rol: "Metabólico", desc: "Prevenir y manejar resistencia a la insulina / prediabetes." },
        { nombre: "Alimentación Antiinflamatoria", rol: "Mantenimiento", desc: "Patrón mediterráneo, fibra y grasas saludables." },
      ],
      objetivos: ["nutri-perdida-grasa", "nutri-glucosa", "nutri-mediterranea"],
      especialistas: ["esp-nutricionista", "esp-endocrino"],
    },
    {
      id: "sueno",
      nombre: "Sueño y Recuperación",
      icono: "😴",
      color: "#6c7bd6",
      tipo: "Regeneración",
      lema: "El sueño insuficiente es un factor de riesgo, no un lujo.",
      descripcion:
        "El sueño de calidad favorece el estado de ánimo, la consolidación de la memoria, el control metabólico y la función inmunitaria. Las medidas de higiene del sueño y la terapia cognitivo-conductual para el insomnio (TCC-I) son las intervenciones de primera línea, con mayor eficacia y menos efectos adversos que los fármacos.",
      specs: [
        { nombre: "Higiene del Sueño", rol: "Fundamentos", desc: "Rutina, luz, temperatura y horarios consistentes." },
        { nombre: "Insomnio (TCC-I)", rol: "Clínico", desc: "El estándar de oro no farmacológico para el insomnio crónico." },
        { nombre: "Ritmo Circadiano", rol: "Optimización", desc: "Alinear luz, comidas y actividad con tu reloj biológico." },
      ],
      objetivos: ["sueno-higiene", "sueno-insomnio", "sueno-circadiano"],
      especialistas: ["esp-sueno", "esp-psicologo"],
    },
    {
      id: "mente",
      nombre: "Salud Mental y Estrés",
      icono: "🧠",
      color: "#c07fd8",
      tipo: "Sistema Vital",
      lema: "La salud mental se trata con intervenciones de eficacia comprobada.",
      descripcion:
        "El bienestar psicológico condiciona la adherencia al resto de hábitos de salud. La actividad física, el apoyo social, las psicoterapias basadas en la evidencia (como la terapia cognitivo-conductual) y las técnicas de regulación reducen de forma demostrada los síntomas de ansiedad y depresión.",
      specs: [
        { nombre: "Manejo del Estrés", rol: "Prevención", desc: "Regulación del sistema nervioso: respiración, naturaleza, límites." },
        { nombre: "Ansiedad", rol: "Clínico", desc: "TCC, exposición gradual y apoyo profesional." },
        { nombre: "Ánimo y Conexión", rol: "Mantenimiento", desc: "Vínculos sociales, propósito y activación conductual." },
      ],
      objetivos: ["mente-estres", "mente-ansiedad", "mente-conexion"],
      especialistas: ["esp-psicologo", "esp-psiquiatra"],
    },
    {
      id: "fuerza",
      nombre: "Fuerza y Movilidad",
      icono: "💪",
      color: "#e0913f",
      tipo: "Rendimiento",
      lema: "La fuerza muscular protege la autonomía a medida que envejecemos.",
      descripcion:
        "El entrenamiento de fuerza preserva la masa muscular y la densidad ósea, mejora el control metabólico y previene la fragilidad y las caídas asociadas a la edad. Combinado con el trabajo de movilidad, es una de las medidas más eficaces para mantener la independencia funcional.",
      specs: [
        { nombre: "Hipertrofia / Fuerza", rol: "Construcción", desc: "Sobrecarga progresiva 2-4 veces por semana." },
        { nombre: "Movilidad y Postura", rol: "Prevención", desc: "Rango de movimiento, core y salud articular." },
        { nombre: "Longevidad Funcional", rol: "Mantenimiento", desc: "Fuerza de agarre, equilibrio y potencia para toda la vida." },
      ],
      objetivos: ["fuerza-hipertrofia", "fuerza-movilidad", "fuerza-funcional"],
      especialistas: ["esp-fisio", "esp-entrenador"],
    },
    {
      id: "longevidad",
      nombre: "Longevidad y Prevención",
      icono: "🧬",
      color: "#48b7c4",
      tipo: "Meta-área",
      lema: "Sumar años de vida saludable, no solo años de vida.",
      descripcion:
        "El envejecimiento saludable combina el resto de los pilares con los chequeos preventivos, la vacunación y la reducción de conductas de riesgo. Reúne las intervenciones con mayor impacto sobre la mortalidad y sobre los años vividos con buena calidad de vida.",
      specs: [
        { nombre: "Chequeos Preventivos", rol: "Detección", desc: "Screening por edad: presión, glucosa, cáncer, visión." },
        { nombre: "Reducción de Riesgos", rol: "Prevención", desc: "Dejar de fumar, moderar alcohol, seguridad vial." },
        { nombre: "Envejecimiento Saludable", rol: "Optimización", desc: "Integrar fuerza, sueño, nutrición y conexión social." },
      ],
      objetivos: ["long-screening", "long-riesgos", "long-integral"],
      especialistas: ["esp-medico-familia", "esp-cardiologo"],
    },
  ],

  // ---------- GUÍAS COMPLETAS (estilo guía de clase de Wowhead) ----------
  guias: {
    cardio: {
      autor: "esp-cardiologo",
      actualizado: "2026/07/18",
      resumen:
        "Bienvenido a la guía cardiovascular de Healthyhead. El corazón es un músculo, y como todo músculo responde al entrenamiento y al cuidado. Esta guía te ayuda a proteger tu sistema cardiovascular en la mayoría de escenarios de la vida real, desde la prevención hasta el control de factores de riesgo.",
      overview:
        "La enfermedad cardiovascular sigue siendo la principal causa de muerte en el mundo, pero también es una de las más prevenibles. Alrededor del 80% de los eventos cardiovasculares prematuros se asocian a factores modificables: presión arterial, colesterol, glucosa, tabaquismo, actividad física y alimentación. La buena noticia es que casi todos estos factores responden a hábitos sostenidos. No necesitas ser atleta: pasar del sedentarismo a moverte con regularidad ya produce el mayor salto de beneficio.",
      beneficios: [
        "Reduce el riesgo de infarto y accidente cerebrovascular.",
        "Mejora la energía diaria y la capacidad aeróbica.",
        "Baja la presión arterial y mejora el perfil de lípidos.",
        "Protege también al cerebro: lo bueno para el corazón lo es para la mente.",
        "Cada factor que controlas suma de forma independiente.",
      ],
      precauciones: [
        "Si tienes síntomas (dolor de pecho, falta de aire inusual), consulta antes de empezar a entrenar.",
        "La presión y el colesterol pueden ser silenciosos: mídelos aunque te sientas bien.",
        "Los cambios de dieta por sí solos ajustan el LDL de forma modesta en riesgo alto.",
        "No abandones medicación sin hablar con tu médico.",
      ],
      faq: [
        { q: "¿Cuánto ejercicio necesito de verdad?", a: "La referencia es 150 minutos semanales de intensidad moderada, pero el mayor beneficio aparece al pasar de cero a algo. Empieza con caminatas de 10 minutos y sube desde ahí." },
        { q: "¿El huevo o la sal son 'el enemigo'?", a: "El patrón general importa más que un alimento aislado. El exceso de sodio (sobre todo en ultraprocesados) sí conviene reducirlo; el huevo en el contexto de una dieta equilibrada no es problema para la mayoría." },
        { q: "¿A qué edad debo revisar mi presión y colesterol?", a: "La presión, al menos una vez al año en la adultez. El colesterol, según edad y riesgo; muchas guías sugieren empezar hacia los 20-35 años y repetir cada pocos años." },
      ],
      referencias: [
        { fuente: "OMS — Enfermedades cardiovasculares", url: "https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)" },
        { fuente: "American Heart Association", url: "https://www.heart.org/en/healthy-living" },
        { fuente: "MedlinePlus — Salud del corazón", url: "https://medlineplus.gov/spanish/hearthealth.html" },
      ],
    },
    nutricion: {
      autor: "esp-nutricionista",
      actualizado: "2026/07/20",
      resumen:
        "Guía de nutrición basada en evidencia, sin dietas de moda ni promesas mágicas. Aquí aprenderás a construir un patrón alimentario que puedas sostener durante años, que es lo único que produce resultados duraderos.",
      overview:
        "La ciencia de la nutrición es menos glamorosa de lo que venden las redes: los patrones que mejor funcionan son aburridos y flexibles. El patrón mediterráneo y las dietas basadas en plantas tienen la evidencia más sólida para salud cardiovascular, metabólica y longevidad. En pérdida de grasa, no gana la dieta 'perfecta' sino la que puedes mantener: un déficit moderado con suficiente proteína vence a cualquier extremo insostenible. La regla de oro: come comida de verdad, mayormente vegetales, en cantidad razonable.",
      beneficios: [
        "Estabiliza la energía y reduce los antojos.",
        "Mejora glucosa, lípidos y presión de forma conjunta.",
        "Protege contra diabetes tipo 2 y enfermedad cardiovascular.",
        "Un buen patrón alimentario es la base sobre la que se apoyan los demás hábitos.",
      ],
      precauciones: [
        "Desconfía de cualquier dieta que elimine grupos enteros de alimentos sin razón médica.",
        "Las necesidades cambian con embarazo, enfermedad renal, diabetes u otras condiciones: personaliza con un profesional.",
        "Perder peso muy rápido suele terminar en recuperarlo (efecto rebote).",
      ],
      faq: [
        { q: "¿Debo contar calorías?", a: "No es obligatorio. Priorizar proteína, fibra y comida poco procesada regula el apetito de forma natural. Contar puede ayudar a corto plazo para aprender porciones." },
        { q: "¿Los carbohidratos engordan?", a: "El exceso de energía engorda, vengan de donde vengan. Los carbohidratos integrales (avena, legumbres, fruta) son parte de dietas muy saludables." },
        { q: "¿Necesito suplementos?", a: "La mayoría de personas cubren sus necesidades con comida. Excepciones frecuentes: vitamina D según latitud, B12 en dietas veganas, y lo que indique una analítica." },
      ],
      referencias: [
        { fuente: "Harvard — The Nutrition Source", url: "https://www.hsph.harvard.edu/nutritionsource/" },
        { fuente: "OMS — Alimentación sana", url: "https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet" },
        { fuente: "MedlinePlus — Nutrición", url: "https://medlineplus.gov/spanish/nutrition.html" },
      ],
    },
    sueno: {
      autor: "esp-sueno",
      actualizado: "2026/07/15",
      resumen:
        "El sueño es el hábito con mejor relación esfuerzo/beneficio de toda la salud. Esta guía cubre desde la higiene del sueño básica hasta la terapia cognitivo-conductual para el insomnio, el tratamiento con mejor evidencia.",
      overview:
        "Dormir no es tiempo perdido: es cuando el cerebro consolida memoria, limpia desechos metabólicos y el cuerpo se repara. La privación crónica de sueño se asocia a peor estado de ánimo, más antojos, peor control glucémico y mayor riesgo cardiovascular. La mayoría de adultos necesita 7-9 horas. Si duermes mal, empieza por la higiene del sueño; si el insomnio persiste más de un mes, la TCC-I es más eficaz y segura a largo plazo que los somníferos.",
      beneficios: [
        "Mejora el ánimo, la memoria y la concentración.",
        "Regula el apetito y el metabolismo.",
        "Refuerza el sistema inmune.",
        "Multiplica el rendimiento de tu ejercicio y tu dieta.",
      ],
      precauciones: [
        "Los ronquidos fuertes con pausas respiratorias pueden indicar apnea: consúltalo.",
        "Los somníferos pueden crear dependencia y tolerancia; úsalos solo bajo supervisión.",
        "La cafeína tiene una vida media larga: puede afectar el sueño aunque no lo notes.",
      ],
      faq: [
        { q: "¿Sirve recuperar sueño el fin de semana?", a: "Ayuda parcialmente, pero la consistencia del horario es más importante. Grandes cambios de horario desregulan tu reloj interno." },
        { q: "¿La melatonina es la solución?", a: "Es útil sobre todo para reajustar horarios (jet lag, turnos), en dosis bajas. No es un somnífero potente y no arregla la mala higiene del sueño." },
        { q: "¿Y si me despierto de madrugada?", a: "Evita mirar el reloj y no te quedes en la cama dando vueltas más de ~20 minutos: levántate, haz algo tranquilo con luz tenue y vuelve cuando tengas sueño." },
      ],
      referencias: [
        { fuente: "Sleep Foundation", url: "https://www.sleepfoundation.org/" },
        { fuente: "CDC — Sueño y salud", url: "https://www.cdc.gov/sleep/index.html" },
        { fuente: "MedlinePlus — Higiene del sueño", url: "https://medlineplus.gov/spanish/healthysleep.html" },
      ],
    },
    mente: {
      autor: "esp-psicologo",
      actualizado: "2026/07/22",
      resumen:
        "La salud mental no es un lujo ni un tema aparte: sostiene todos los demás hábitos. Esta guía reúne herramientas con evidencia para el estrés, la ansiedad y el estado de ánimo, y señala cuándo buscar ayuda profesional.",
      overview:
        "El bienestar psicológico se cuida con estrategias concretas, igual que el físico. La actividad física regular, el sueño, los vínculos sociales y las terapias basadas en evidencia (como la TCC) tienen efectos comparables a los de tratamientos médicos para casos leves y moderados. Sentir estrés o tristeza es normal; lo importante es tener herramientas para recuperarte y saber reconocer cuándo el malestar es persistente e interfiere con tu vida, momento en el que conviene pedir apoyo profesional.",
      beneficios: [
        "Reduce ansiedad y síntomas depresivos.",
        "Mejora la regulación emocional y el sueño.",
        "Fortalece relaciones y sensación de propósito.",
        "Aumenta la adherencia al resto de hábitos de salud.",
      ],
      precauciones: [
        "Si tienes pensamientos de hacerte daño, busca ayuda de inmediato: no estás solo.",
        "La autoayuda no sustituye a la terapia cuando el malestar es intenso o prolongado.",
        "Evitar lo que te causa ansiedad la refuerza a largo plazo.",
      ],
      faq: [
        { q: "¿Cuándo debo buscar ayuda profesional?", a: "Cuando el malestar dura semanas, interfiere con tu trabajo, sueño o relaciones, o cuando sientes que no puedes solo. Pedir ayuda es un signo de fortaleza, no de debilidad." },
        { q: "¿La meditación funciona?", a: "Para muchas personas reduce estrés y mejora la atención. No es mágica ni universal; pruébala como una herramienta más, no como la única." },
        { q: "¿El ejercicio ayuda con la ansiedad?", a: "Sí, con evidencia sólida. El movimiento regular actúa como un ansiolítico natural y mejora el ánimo." },
      ],
      referencias: [
        { fuente: "OMS — Salud mental", url: "https://www.who.int/es/news-room/fact-sheets/detail/mental-health-strengthening-our-response" },
        { fuente: "NIMH (National Institute of Mental Health)", url: "https://www.nimh.nih.gov/health/topics/espanol" },
        { fuente: "MedlinePlus — Salud mental", url: "https://medlineplus.gov/spanish/mentalhealth.html" },
      ],
    },
    fuerza: {
      autor: "esp-entrenador",
      actualizado: "2026/07/19",
      resumen:
        "El músculo es, literalmente, el órgano de la longevidad. Esta guía te muestra cómo ganar fuerza de forma simple y segura, y por qué entrenar la fuerza es una de las mejores decisiones que puedes tomar a cualquier edad.",
      overview:
        "A partir de los 30 años empezamos a perder masa muscular de forma gradual (sarcopenia) si no la estimulamos. El entrenamiento de fuerza revierte gran parte de ese proceso: mejora la densidad ósea, la sensibilidad a la insulina, el equilibrio y la independencia funcional. No necesitas un gimnasio elaborado ni rutinas complejas: los patrones básicos (empujar, tirar, sentadilla, bisagra de cadera) hechos con sobrecarga progresiva 2-4 veces por semana producen la mayoría de los resultados. La fuerza de agarre y la capacidad de levantarte del suelo predicen longevidad.",
      beneficios: [
        "Protege huesos y articulaciones; previene caídas y fracturas.",
        "Mejora el metabolismo y el control de la glucosa.",
        "Mantiene la independencia y la funcionalidad con la edad.",
        "Mejora postura, ánimo y confianza.",
      ],
      precauciones: [
        "La técnica primero: aprende bien antes de subir mucho peso.",
        "Progresa de forma gradual para evitar lesiones.",
        "Con condiciones articulares o cardíacas, adapta con un profesional.",
      ],
      faq: [
        { q: "¿Voy a 'ponerme demasiado grande'?", a: "No por accidente. Ganar mucho volumen muscular requiere años de trabajo específico. Para la mayoría, entrenar fuerza da un cuerpo más funcional y tonificado." },
        { q: "¿Puedo empezar a los 60 o más?", a: "Sí, y de hecho es cuando más importa. Los adultos mayores responden muy bien al entrenamiento de fuerza y ganan independencia." },
        { q: "¿Necesito proteína en polvo?", a: "No es obligatoria. Es una forma cómoda de llegar a tu proteína diaria (~1.6 g/kg), pero puedes lograrlo con comida." },
      ],
      referencias: [
        { fuente: "OMS — Actividad física", url: "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity" },
        { fuente: "CDC — Actividad física", url: "https://www.cdc.gov/physicalactivity/index.html" },
        { fuente: "MedlinePlus — Ejercicio y actividad física", url: "https://medlineplus.gov/spanish/exerciseandphysicalfitness.html" },
      ],
    },
    longevidad: {
      autor: "esp-medico-familia",
      actualizado: "2026/07/24",
      resumen:
        "La longevidad saludable no es un elixir: es la suma sostenida de buenos hábitos más prevención inteligente. Esta guía integra todos los pilares y prioriza las intervenciones con mayor retorno sobre tus años de vida saludable.",
      overview:
        "Los estudios de poblaciones longevas y la medicina preventiva coinciden en algo: no hay un truco único. Los mayores retornos vienen de no fumar, mantenerte físicamente activo y fuerte, dormir bien, comer un buen patrón, cuidar los vínculos sociales y hacerte los chequeos preventivos que corresponden a tu edad. La detección temprana (presión, glucosa, ciertos cánceres) cambia pronósticos por completo. La meta no es solo vivir más años, sino llegar a ellos con autonomía y buena calidad de vida.",
      beneficios: [
        "Extiende los años de vida saludable e independiente.",
        "Detecta problemas a tiempo, cuando son más tratables.",
        "Reduce el riesgo de las principales causas de muerte.",
        "Integra todos los pilares en un plan coherente.",
      ],
      precauciones: [
        "No caigas en modas o suplementos 'anti-edad' sin evidencia.",
        "Los cribados tienen edades y frecuencias recomendadas: ni de más ni de menos.",
        "Personaliza según tus antecedentes familiares y tu contexto.",
      ],
      faq: [
        { q: "¿Cuál es el hábito número uno?", a: "Si fumas, dejarlo. Después: mantenerte activo y fuerte. Ninguna pastilla iguala el efecto de estos dos." },
        { q: "¿Sirven los suplementos de longevidad de moda?", a: "La mayoría carece de evidencia sólida en humanos. Antes de gastar en eso, invierte en sueño, fuerza y no fumar: eso sí tiene datos." },
        { q: "¿Qué chequeos me tocan?", a: "Depende de tu edad, sexo y antecedentes. Usa la herramienta 'Mis recomendaciones' de esta web (datos oficiales) y confírmalo con tu médico." },
      ],
      referencias: [
        { fuente: "OMS — Envejecimiento y salud", url: "https://www.who.int/es/news-room/fact-sheets/detail/ageing-and-health" },
        { fuente: "MyHealthfinder (ODPHP, health.gov)", url: "https://odphp.health.gov/myhealthfinder" },
        { fuente: "MedlinePlus — Cómo envejecer bien", url: "https://medlineplus.gov/spanish/healthyaging.html" },
      ],
    },
  },

  // ---------- OBJETIVOS / ESTRATEGIAS (las "builds") ----------
  objetivos: {
    "cardio-aerobico": {
      area: "cardio", titulo: "Construir base aeróbica (Zona 2)",
      resumen: "Cardio moderado y constante para bajar el riesgo cardiovascular sin quemarte.",
      exito: 82, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "150 min/semana de actividad moderada (caminar rápido, bici, nadar).",
        "Empieza donde estás: 10 min al día ya cuentan y suman.",
        "Mantén una intensidad en la que puedas hablar pero no cantar (Zona 2).",
        "Añade 2 sesiones más intensas por semana cuando tengas base.",
      ],
      tips: "El mayor salto de beneficio ocurre al pasar de 0 a algo. No necesitas correr maratones.",
    },
    "cardio-presion": {
      area: "cardio", titulo: "Bajar la presión arterial",
      resumen: "Combinación de dieta DASH, ejercicio, sodio y control del estrés.",
      exito: 68, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Reduce sodio a <2.3 g/día (menos ultraprocesados y sal añadida).",
        "Patrón DASH: verduras, fruta, lácteos bajos en grasa, potasio.",
        "Actividad aeróbica regular + pérdida de peso si aplica.",
        "Mide tu presión en casa y comparte los datos con tu médico.",
      ],
      tips: "Perder 5 kg puede bajar la presión de forma comparable a un fármaco leve.",
    },
    "cardio-lipidos": {
      area: "cardio", titulo: "Optimizar el colesterol",
      resumen: "Fibra, grasas saludables y actividad para mejorar el perfil de lípidos.",
      exito: 61, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Aumenta fibra soluble (avena, legumbres, manzana).",
        "Cambia grasas saturadas por insaturadas (oliva, frutos secos, pescado).",
        "Muévete a diario; el ejercicio sube el HDL.",
        "Si el riesgo es alto, valora estatinas con tu médico.",
      ],
      tips: "La dieta ajusta el LDL de forma modesta; en riesgo alto, la medicación es clave.",
    },
    "nutri-perdida-grasa": {
      area: "nutricion", titulo: "Perder grasa de forma sostenible",
      resumen: "Déficit calórico moderado + proteína alta + hábitos que puedas mantener.",
      exito: 47, dificultad: "Alta", evidencia: "Media",
      pasos: [
        "Déficit moderado (~300-500 kcal/día), no dietas extremas.",
        "Prioriza proteína (1.6 g/kg) para preservar músculo y saciedad.",
        "Basa el plato en verduras y alimentos poco procesados.",
        "Sueño y estrés cuentan: regulan hambre y antojos.",
      ],
      tips: "El reto no es perder peso, es no recuperarlo. Elige un método que aguantes 5 años.",
    },
    "nutri-glucosa": {
      area: "nutricion", titulo: "Controlar la glucosa / prediabetes",
      resumen: "Programas de estilo de vida reducen fuertemente la progresión a diabetes.",
      exito: 58, dificultad: "Media", evidencia: "Muy alta",
      pasos: [
        "Pierde 5-7% del peso corporal si hay sobrepeso.",
        "150 min/semana de actividad física.",
        "Prioriza fibra y reduce bebidas azucaradas y refinados.",
        "Camina 10-15 min después de las comidas grandes.",
      ],
      tips: "El Programa de Prevención de Diabetes redujo casos ~58% solo con estilo de vida.",
    },
    "nutri-mediterranea": {
      area: "nutricion", titulo: "Adoptar patrón mediterráneo",
      resumen: "El patrón alimentario con mejor evidencia para corazón y longevidad.",
      exito: 74, dificultad: "Baja", evidencia: "Muy alta",
      pasos: [
        "Base de verduras, legumbres, fruta, cereales integrales y aceite de oliva.",
        "Pescado 2-3 veces/semana; carne roja ocasional.",
        "Frutos secos a diario, en porción moderada.",
        "Cocina en casa y come acompañado cuando puedas.",
      ],
      tips: "No es una dieta estricta, es una forma de comer. Por eso la gente la mantiene.",
    },
    "sueno-higiene": {
      area: "sueno", titulo: "Higiene del sueño sólida",
      resumen: "Los fundamentos que arreglan la mayoría de los problemas leves de sueño.",
      exito: 65, dificultad: "Baja", evidencia: "Alta",
      pasos: [
        "Horario constante de acostarte y levantarte, también fines de semana.",
        "Luz brillante de día; luz tenue y menos pantallas de noche.",
        "Habitación fresca, oscura y silenciosa.",
        "Sin cafeína después del mediodía; alcohol lejos de la cama.",
      ],
      tips: "La consistencia del horario es más potente que cualquier suplemento.",
    },
    "sueno-insomnio": {
      area: "sueno", titulo: "Vencer el insomnio (TCC-I)",
      resumen: "La terapia cognitivo-conductual para el insomnio, estándar de oro.",
      exito: 76, dificultad: "Media", evidencia: "Muy alta",
      pasos: [
        "Control de estímulos: la cama solo para dormir.",
        "Restricción del tiempo en cama para consolidar el sueño.",
        "Reestructurar pensamientos ansiosos sobre dormir.",
        "Usa una app o programa guiado de TCC-I si no hay especialista.",
      ],
      tips: "La TCC-I iguala o supera a los somníferos a largo plazo, sin dependencia.",
    },
    "sueno-circadiano": {
      area: "sueno", titulo: "Alinear tu ritmo circadiano",
      resumen: "Sincronizar luz, comidas y actividad con tu reloj interno.",
      exito: 60, dificultad: "Media", evidencia: "Media",
      pasos: [
        "Recibe luz solar en los primeros 30-60 min tras despertar.",
        "Cena al menos 2-3 h antes de dormir.",
        "Evita siestas largas o tardías.",
        "Haz ejercicio, idealmente no justo antes de acostarte.",
      ],
      tips: "La luz de la mañana es la señal más fuerte para tu reloj biológico.",
    },
    "mente-estres": {
      area: "mente", titulo: "Regular el estrés crónico",
      resumen: "Herramientas para bajar la activación del sistema nervioso.",
      exito: 63, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Respiración lenta (exhalación larga) 5 min, 1-2 veces al día.",
        "Tiempo en naturaleza cada semana.",
        "Pon límites y protege tiempo de descanso real.",
        "Movimiento diario: el ejercicio es un ansiolítico natural.",
      ],
      tips: "No busques eliminar el estrés, busca recuperarte mejor de él.",
    },
    "mente-ansiedad": {
      area: "mente", titulo: "Manejar la ansiedad",
      resumen: "La TCC y la exposición gradual son tratamientos de primera línea.",
      exito: 60, dificultad: "Alta", evidencia: "Muy alta",
      pasos: [
        "Identifica y cuestiona pensamientos catastróficos (TCC).",
        "Exposición gradual a lo que evitas, paso a paso.",
        "Rutinas de sueño y ejercicio como base.",
        "Busca apoyo profesional; no tienes que hacerlo solo.",
      ],
      tips: "Evitar lo que te da ansiedad la alimenta. Acercarte poco a poco la reduce.",
    },
    "mente-conexion": {
      area: "mente", titulo: "Fortalecer ánimo y conexión",
      resumen: "Vínculos sociales y activación conductual protegen contra la depresión.",
      exito: 66, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Agenda contacto social real cada semana.",
        "Activación conductual: haz cosas con sentido aunque no te apetezca.",
        "Movimiento y luz solar a diario.",
        "Si el ánimo bajo dura semanas, consulta a un profesional.",
      ],
      tips: "La conexión social se asocia a una mortalidad tan baja como dejar de fumar.",
    },
    "fuerza-hipertrofia": {
      area: "fuerza", titulo: "Ganar fuerza y músculo",
      resumen: "Sobrecarga progresiva sencilla, 2-4 veces por semana.",
      exito: 80, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Trabaja los grandes patrones: empujar, tirar, sentadilla, bisagra.",
        "Sobrecarga progresiva: sube peso o repeticiones con el tiempo.",
        "8-20 repeticiones por serie, cerca del fallo con buena técnica.",
        "Proteína suficiente y descanso entre sesiones.",
      ],
      tips: "Casi todos responden a la fuerza. La constancia gana a la perfección del plan.",
    },
    "fuerza-movilidad": {
      area: "fuerza", titulo: "Mejorar movilidad y postura",
      resumen: "Rango de movimiento y core para prevenir dolor y lesiones.",
      exito: 64, dificultad: "Baja", evidencia: "Media",
      pasos: [
        "Movilidad de cadera, tobillo y columna torácica.",
        "Fortalece el core (no solo abdominales: también espalda).",
        "Rompe el sedentarismo: muévete cada 30-60 min.",
        "Estira lo que está tenso, fortalece lo que está débil.",
      ],
      tips: "El mejor estiramiento es moverte a menudo durante el día.",
    },
    "fuerza-funcional": {
      area: "fuerza", titulo: "Longevidad funcional",
      resumen: "Fuerza, equilibrio y potencia para mantenerte independiente.",
      exito: 71, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Entrena equilibrio (apoyo en un pie, cambios de dirección).",
        "Incluye movimientos de potencia (subir escaleras, levantarte del suelo).",
        "Cuida la fuerza de agarre: predice longevidad.",
        "Camina a diario como base no negociable.",
      ],
      tips: "Poder levantarte del suelo sin manos a los 70 predice años de vida independiente.",
    },
    "long-screening": {
      area: "longevidad", titulo: "Chequeos preventivos por edad",
      resumen: "Detección temprana de presión, glucosa, lípidos y cánceres frecuentes.",
      exito: 85, dificultad: "Baja", evidencia: "Muy alta",
      pasos: [
        "Presión arterial: al menos una vez al año.",
        "Glucosa y lípidos según edad y riesgo.",
        "Screening de cáncer según edad (colon, mama, cérvix, etc.).",
        "Visión, audición y salud dental sin olvidarlas.",
      ],
      tips: "Detectar a tiempo cambia el pronóstico. Es la intervención con mejor relación esfuerzo/beneficio.",
    },
    "long-riesgos": {
      area: "longevidad", titulo: "Reducir riesgos mayores",
      resumen: "Dejar de fumar, moderar alcohol y seguridad: enorme retorno en años de vida.",
      exito: 55, dificultad: "Alta", evidencia: "Muy alta",
      pasos: [
        "Dejar de fumar es la decisión de salud #1 si fumas.",
        "Modera el alcohol: menos es mejor, cero no tiene riesgo.",
        "Usa cinturón y casco; evita conducir cansado.",
        "Apóyate en programas y ayuda profesional para dejar hábitos.",
      ],
      tips: "Dejar de fumar a los 40 recupera casi toda la esperanza de vida perdida.",
    },
    "long-integral": {
      area: "longevidad", titulo: "Plan de envejecimiento saludable",
      resumen: "Integrar fuerza, sueño, nutrición, mente y conexión social.",
      exito: 70, dificultad: "Media", evidencia: "Alta",
      pasos: [
        "Elige un hábito por pilar y hazlo constante antes de sumar más.",
        "Prioriza fuerza y actividad: protegen la independencia.",
        "Cuida vínculos sociales como parte de tu salud.",
        "Revisa tu plan cada temporada y ajusta.",
      ],
      tips: "Los centenarios rara vez destacan en un solo hábito; destacan en la suma sostenida.",
    },
  },

  // ---------- ESPECIALISTAS (los "class writers") ----------
  especialistas: {
    "esp-cardiologo": { nombre: "Cardiología", icono: "🩺", desc: "Corazón, presión arterial y prevención cardiovascular." },
    "esp-nutricionista": { nombre: "Nutrición", icono: "🥑", desc: "Patrones alimentarios, composición corporal y metabolismo." },
    "esp-endocrino": { nombre: "Endocrinología", icono: "⚗️", desc: "Glucosa, tiroides, hormonas y metabolismo." },
    "esp-sueno": { nombre: "Medicina del Sueño", icono: "🌙", desc: "Insomnio, apnea y ritmos circadianos." },
    "esp-psicologo": { nombre: "Psicología", icono: "💬", desc: "Terapias basadas en evidencia para estrés, ansiedad y ánimo." },
    "esp-psiquiatra": { nombre: "Psiquiatría", icono: "🧩", desc: "Diagnóstico y tratamiento de trastornos de salud mental." },
    "esp-fisio": { nombre: "Fisioterapia", icono: "🦴", desc: "Movilidad, rehabilitación y prevención de lesiones." },
    "esp-entrenador": { nombre: "Entrenamiento", icono: "🏋️", desc: "Fuerza, acondicionamiento y progresión de cargas." },
    "esp-medico-familia": { nombre: "Medicina Familiar", icono: "👪", desc: "Prevención, chequeos y visión integral de tu salud." },
  },

  // ---------- TIER LIST (estilo guía de rankings de Wowhead) ----------
  // Colores de "calidad": S=Legendario, A=Épico, B=Raro, C=Poco común.
  // trend: "up" (subiendo), "down" (bajando), "flat" (estable).
  tierlist: {
    autor: "esp-medico-familia",
    actualizado: "2026/07/26",
    version: "Temporada Verano 2026 · Patch 2026.7",
    intro:
      "Bienvenido a la Tier List de intervenciones de salud de Healthyhead para la Temporada Verano 2026. Clasificamos hábitos y estrategias según su impacto sobre la mortalidad y la calidad de vida, su respaldo científico y su relación beneficio/esfuerzo, para ayudarte a priorizar cuando no puedes hacerlo todo a la vez. Igual que en un juego, no todas las 'builds' rinden lo mismo: esta lista te dice dónde invertir tu energía primero.",
    disclaimers: [
      "Sobre tu contexto: esta lista asume a una persona adulta promedio sin una condición médica concreta. Tu situación (embarazo, enfermedad renal, cardiopatía, edad avanzada…) puede cambiar por completo las prioridades. Valora siempre tu caso —idealmente con un profesional— por encima de cualquier tier list.",
      "Sobre la constancia: la mejor intervención no es la del tier más alto, sino la que realmente vas a sostener. Una build de tier B que haces cada día le gana a una de tier S que abandonas en dos semanas.",
      "Sobre los datos: los porcentajes de éxito son estimaciones ilustrativas basadas en literatura general de salud pública, no cifras clínicas exactas. Publicamos esta lista y la actualizamos conforme evoluciona la evidencia.",
    ],
    definiciones: [
      { tier: "S", etiqueta: "Legendario", color: "#ff8000",
        def: "Intervenciones que esperamos que dominen cualquier plan de salud. Aportan un beneficio enorme sobre la mortalidad y la calidad de vida, con un coste de esfuerzo razonable, y deberían estar en casi todos los planes. Si solo puedes hacer unas pocas cosas, empieza aquí." },
      { tier: "A", etiqueta: "Épico", color: "#a335ee",
        def: "Grandes intervenciones con evidencia sólida. Sería raro un buen plan de salud que no incluya al menos una. Aportan mucho beneficio, aunque suelen exigir algo más de método o constancia que las de tier S." },
      { tier: "B", etiqueta: "Raro", color: "#3b82f6",
        def: "Intervenciones buenas que estarán en muchos planes, pero no en todos. Suelen quedar ligeramente por detrás en impacto, o necesitan apoyo (medición en casa, profesionales) para brillar del todo." },
      { tier: "C", etiqueta: "Poco común", color: "#1eff5a",
        def: "Intervenciones sólidas pero situacionales: dependen de tu contexto, tus objetivos o tu punto de partida. Muy valiosas para algunas personas y prescindibles para otras." },
      { tier: "D", etiqueta: "Sin evidencia", color: "#8b9099",
        def: "Prácticas sin respaldo científico suficiente, o cuyo efecto no supera al del placebo en ensayos controlados. No las recomendamos como tratamiento y advertimos del riesgo de retrasar una atención médica eficaz." },
    ],
    ranking: [
      { tier: "S", items: [
        { id: "long-screening", trend: "flat", porque: "La detección temprana cambia pronósticos por completo y cuesta muy poco esfuerzo. Ninguna otra intervención tiene mejor relación beneficio/esfuerzo: por eso abre la lista." },
        { id: "cardio-aerobico", trend: "up", porque: "Pasar de sedentario a activo produce el mayor salto de salud documentado. Impacta a la vez sobre corazón, cerebro, metabolismo y estado de ánimo." },
        { id: "fuerza-hipertrofia", trend: "up", porque: "El músculo protege huesos, metabolismo e independencia. Casi todo el mundo responde, a cualquier edad, y su valor no deja de revalorizarse en la literatura." },
        { id: "nutri-mediterranea", trend: "flat", porque: "El patrón alimentario con más evidencia y, sobre todo, el más sostenible. Gana su puesto por adherencia: la gente lo mantiene años." },
      ]},
      { tier: "A", items: [
        { id: "sueno-insomnio", trend: "up", porque: "La TCC-I es el tratamiento con mejor evidencia para el insomnio crónico, sin dependencia. Requiere método, lo que le impide entrar en S, pero el retorno es altísimo." },
        { id: "nutri-glucosa", trend: "flat", porque: "Los programas de estilo de vida previenen o retrasan la diabetes de forma contundente. Alto impacto sobre un problema cada vez más común." },
        { id: "long-integral", trend: "flat", porque: "Integrar todos los pilares multiplica el efecto. Pierde algo de tier solo porque exige constancia en varios frentes a la vez." },
        { id: "fuerza-funcional", trend: "up", porque: "Equilibrio, potencia y fuerza de agarre predicen la independencia en la vejez. Enorme retorno, algo más específico que la fuerza general." },
      ]},
      { tier: "B", items: [
        { id: "cardio-presion", trend: "flat", porque: "Controlar la hipertensión reduce mucho el riesgo, pero a menudo necesita medición regular y, en algunos casos, fármacos, lo que la hace menos autónoma." },
        { id: "sueno-higiene", trend: "flat", porque: "Arregla la mayoría de los problemas leves de sueño y es muy fácil de aplicar. Para un insomnio real se queda corta, y por eso no sube más." },
        { id: "mente-conexion", trend: "up", porque: "El apoyo social y la activación conductual protegen de verdad frente a la depresión. Efecto grande, pero difícil de 'recetar' con precisión." },
        { id: "fuerza-movilidad", trend: "flat", porque: "Previene dolor y lesiones y complementa muy bien a la fuerza. Un buen añadido, más que un pilar por sí solo." },
      ]},
      { tier: "C", items: [
        { id: "cardio-lipidos", trend: "flat", porque: "La dieta ajusta el LDL de forma modesta; en riesgo alto el peso lo lleva la medicación. Útil, pero muy dependiente del perfil de cada persona." },
        { id: "mente-ansiedad", trend: "flat", porque: "Tratamiento de primera línea muy eficaz, pero exigente y profundamente individual: su 'éxito poblacional' varía enormemente según el caso." },
        { id: "sueno-circadiano", trend: "flat", porque: "Optimización fina y valiosa para trabajo por turnos o jet lag, pero secundaria si aún no tienes cubiertos los básicos del sueño." },
        { id: "nutri-perdida-grasa", trend: "down", porque: "Objetivo popular pero con alta tasa de recaída a largo plazo. Baja de tier no por inútil, sino por lo difícil que resulta mantener el resultado." },
      ]},
      { tier: "D", items: [
        { nombre: "Homeopatía", trend: "flat", porque: "Las revisiones sistemáticas no encuentran efectos superiores al placebo. Diluciones sin principio activo detectable; su uso en lugar de un tratamiento eficaz puede ser perjudicial." },
        { nombre: "Naturopatía y “medicina alternativa”", trend: "flat", porque: "Etiqueta que agrupa prácticas heterogéneas sin marco de evidencia común. Algunas medidas de estilo de vida que promueve sí son útiles, pero cuando se ofrecen como sustituto de la medicina basada en pruebas, el riesgo supera al beneficio." },
        { nombre: "Dietas “detox” o depurativas", trend: "down", porque: "El hígado y los riñones ya realizan la depuración del organismo. No existe evidencia de que estos regímenes eliminen “toxinas”, y algunos causan déficits nutricionales o alteraciones electrolíticas." },
        { nombre: "Suplementos “antienvejecimiento”", trend: "flat", porque: "La mayoría carece de ensayos clínicos sólidos en humanos que demuestren beneficio sobre la longevidad. El gasto se aprovecha mejor en sueño, actividad física y dejar de fumar." },
      ]},
    ],
  },

  // ---------- ARTÍCULOS / NOTICIAS (feed estilo portada Wowhead) ----------
  articulos: [
    {
      id: "art-caminar-comidas", area: "nutricion", etiqueta: "GUÍA", destacado: true,
      titulo: "Caminar 10 minutos después de comer: el micro-hábito con gran retorno metabólico",
      fecha: "2026/07/25", autor: "esp-nutricionista",
      extracto: "Un paseo corto tras las comidas grandes suaviza el pico de glucosa y suma actividad sin apenas esfuerzo. Por qué funciona y cómo integrarlo.",
      cuerpo: [
        "Después de una comida rica en carbohidratos, la glucosa en sangre sube. En personas con resistencia a la insulina o prediabetes, ese pico repetido a lo largo de los años es problemático. Caminar suave durante 10-15 minutos justo después de comer ayuda a que los músculos usen esa glucosa, suavizando el pico.",
        "No hace falta caminar rápido ni sudar: el objetivo es movimiento ligero y continuo. Si no puedes salir, moverte por casa o hacer tareas de pie también ayuda.",
        "Lo mejor de este hábito es su bajísimo coste: se integra en la rutina que ya tienes (después de almorzar o cenar) y suma fácilmente 30 minutos de actividad diaria sin ir al gimnasio.",
      ],
    },
    {
      id: "art-fuerza-mayores", area: "fuerza", etiqueta: "EVIDENCIA", destacado: true,
      titulo: "Nunca es tarde: por qué empezar a entrenar fuerza a los 60+ cambia tu futuro",
      fecha: "2026/07/23", autor: "esp-entrenador",
      extracto: "La sarcopenia no es inevitable. Los adultos mayores que entrenan fuerza recuperan función, equilibrio e independencia. La ventana nunca se cierra.",
      cuerpo: [
        "Perdemos masa y fuerza muscular con la edad, pero el cuerpo sigue respondiendo al entrenamiento a cualquier edad. Estudios en personas de 70, 80 e incluso 90 años muestran ganancias reales de fuerza y función en pocas semanas.",
        "Lo que está en juego no es la estética: es la capacidad de levantarte de una silla, subir escaleras y no caerte. La fuerza y el equilibrio son los mejores predictores de independencia en la vejez.",
        "Empieza suave, prioriza la técnica y progresa poco a poco. Dos sesiones semanales de cuerpo completo ya producen gran parte del beneficio.",
      ],
    },
    {
      id: "art-sueno-multiplicador", area: "sueno", etiqueta: "GUÍA", destacado: true,
      titulo: "El sueño es el multiplicador: por qué arreglarlo primero potencia todo lo demás",
      fecha: "2026/07/21", autor: "esp-sueno",
      extracto: "Dormir mal sabotea tu dieta, tu entrenamiento y tu ánimo. Antes de optimizar nada, asegúrate de dormir bien.",
      cuerpo: [
        "La privación de sueño aumenta el hambre y los antojos, empeora el control de la glucosa, reduce el rendimiento físico y afecta el estado de ánimo. Es decir, socava simultáneamente varios de tus otros objetivos de salud.",
        "Por eso, si tuvieras que arreglar un solo hábito primero, el sueño es un candidato ideal: su mejora rinde en cascada sobre todo lo demás.",
        "Empieza por lo simple: horario constante, luz de día, oscuridad de noche y nada de cafeína por la tarde.",
      ],
    },
    {
      id: "art-presion-silenciosa", area: "cardio", etiqueta: "PREVENCIÓN",
      titulo: "La presión alta no duele: por eso hay que medirla",
      fecha: "2026/07/20", autor: "esp-cardiologo",
      extracto: "La hipertensión suele ser asintomática durante años mientras daña arterias, corazón y riñones. Medirla es rápido y puede salvarte la vida.",
      cuerpo: [
        "Se la llama el 'asesino silencioso' porque rara vez da síntomas hasta que ha causado daño. Muchas personas descubren que la tienen solo tras un evento grave.",
        "La buena noticia: medirla es rápido, barato e indoloro, y controlarla con hábitos y —si hace falta— medicación reduce drásticamente el riesgo de infarto e ictus.",
        "Mídela al menos una vez al año, y en casa si tu médico lo indica. Comparte los registros con tu profesional de salud.",
      ],
    },
    {
      id: "art-ansiedad-exposicion", area: "mente", etiqueta: "SALUD MENTAL",
      titulo: "Evitar lo que temes alimenta la ansiedad: el poder de la exposición gradual",
      fecha: "2026/07/18", autor: "esp-psicologo",
      extracto: "La evitación da alivio a corto plazo pero refuerza el miedo. Acercarte poco a poco, con apoyo, es lo que de verdad lo reduce.",
      cuerpo: [
        "Cuando evitamos algo que nos da ansiedad, sentimos alivio inmediato. Ese alivio es una trampa: le enseña al cerebro que el peligro era real y que evitar 'funcionó', reforzando el miedo.",
        "La terapia de exposición hace lo contrario: acercarte de forma gradual y controlada a lo que temes, permitiendo que la ansiedad baje por sí sola. Es uno de los tratamientos con mejor evidencia.",
        "No lo hagas de golpe ni solo si el miedo es intenso: un profesional puede guiar el proceso paso a paso.",
      ],
    },
    {
      id: "art-mediterranea", area: "nutricion", etiqueta: "EVIDENCIA",
      titulo: "Por qué la dieta mediterránea gana a casi todas las demás",
      fecha: "2026/07/16", autor: "esp-nutricionista",
      extracto: "No elimina grupos de alimentos, es sabrosa y tiene la evidencia más sólida en salud cardiovascular y longevidad. La clave: es sostenible.",
      cuerpo: [
        "El patrón mediterráneo —verduras, legumbres, fruta, cereales integrales, aceite de oliva, pescado y frutos secos— acumula décadas de evidencia a favor de la salud del corazón, el metabolismo y la longevidad.",
        "Su gran ventaja frente a dietas restrictivas es que la gente la mantiene: es flexible, variada y agradable. Y la adherencia a largo plazo es lo que produce resultados.",
        "No tienes que vivir en el Mediterráneo: adapta los principios a los alimentos de tu región.",
      ],
    },
    {
      id: "art-vacunas-adultos", area: "longevidad", etiqueta: "PREVENCIÓN",
      titulo: "Las vacunas no son solo para niños: qué revisar en la adultez",
      fecha: "2026/07/14", autor: "esp-medico-familia",
      extracto: "Gripe, tétanos, COVID y otras según tu edad y condiciones. Una parte sencilla y de alto retorno de la prevención.",
      cuerpo: [
        "La inmunidad y las recomendaciones cambian con la edad. Los adultos también tienen calendario: refuerzos de tétanos, vacuna anual de la gripe, y otras según edad, condiciones y país.",
        "Es una de las intervenciones preventivas con mejor relación coste-beneficio. Consulta con tu médico cuáles te corresponden.",
        "Usa la herramienta 'Mis recomendaciones' de esta web para ver, con datos oficiales, qué cribados y vacunas se sugieren para tu perfil.",
      ],
    },
    {
      id: "art-proteina-desayuno", area: "nutricion", etiqueta: "TIP",
      titulo: "Proteína en el desayuno: menos antojos el resto del día",
      fecha: "2026/07/12", autor: "esp-nutricionista",
      extracto: "Empezar el día con proteína mejora la saciedad y ayuda a controlar el picoteo. Ideas simples para lograrlo.",
      cuerpo: [
        "Los desayunos altos en azúcar y refinados disparan y luego desploman la glucosa, dejándote con hambre pronto. La proteína sacia más y por más tiempo.",
        "Opciones fáciles: huevos, yogur griego natural, requesón, legumbres, tofu o un batido con buena base proteica.",
        "No es magia, pero es una palanca sencilla para comer mejor sin fuerza de voluntad heroica.",
      ],
    },
  ],

  // ---------- "HOY EN TU SALUD" (panel estilo Today in WoW) ----------
  hoy: {
    retoSemana: {
      titulo: "Reto de la semana",
      texto: "Camina 10 minutos después de cada comida principal. Baja la glucosa post-comida y suma ~30 min de actividad al día.",
    },
    habitoDelDia: {
      titulo: "Micro-hábito de hoy",
      texto: "Recibe luz solar en los primeros 30 minutos tras despertar. Ancla tu ritmo circadiano.",
    },
    tips: [
      "Beber agua antes de cada comida ayuda a la saciedad.",
      "Dos minutos de respiración lenta bajan la frecuencia cardiaca.",
      "Levántate y muévete 2 min por cada 30 de estar sentado.",
      "Prioriza proteína en el desayuno para menos antojos.",
      "Acuéstate y despiértate a la misma hora, también el finde.",
    ],
  },
};
