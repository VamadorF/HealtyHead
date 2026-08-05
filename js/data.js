// ============================================================
// HealthyHead — Base de datos del sitio
// Cifras aproximadas basadas en estudios poblacionales publicados
// (metaanálisis, ensayos clínicos). Uso educativo: NO sustituye
// la consulta con un profesional de la salud.
// ============================================================

const AREAS = [
  {
    id: "cardiologia",
    nombre: "Cardiología",
    icono: "❤️",
    color: "#e74c3c",
    rol: "Sistema cardiovascular",
    desc: "El corazón es tu 'tanque': aguanta todo el daño del estilo de vida. Las enfermedades cardiovasculares son la primera causa de muerte en el mundo, y también las más prevenibles.",
    especialistas: [
      { nombre: "Cardiólogo clínico", desc: "El especialista base: diagnóstico y tratamiento de hipertensión, insuficiencia cardíaca y control de factores de riesgo." },
      { nombre: "Electrofisiólogo", desc: "Especialista en arritmias: palpitaciones, fibrilación auricular, marcapasos." },
      { nombre: "Cardiólogo intervencionista", desc: "Cateterismos y stents: actúa cuando una arteria ya está obstruida." },
      { nombre: "Cirujano cardiovascular", desc: "Cirugía de válvulas y bypass: el 'raid boss' de las intervenciones." }
    ],
    estrategias: [
      { nombre: "Dejar de fumar", tier: "S", exito: 50, unidad: "menos riesgo coronario al año de dejarlo", desc: "La intervención individual más rentable que existe. El exceso de riesgo cardiovascular cae ~50% durante el primer año sin tabaco y sigue bajando.", fuente: "OMS / Surgeon General Report" },
      { nombre: "Controlar la presión arterial", tier: "S", exito: 38, unidad: "menos riesgo de ictus con tratamiento", desc: "Reducir la presión sistólica ~10 mmHg disminuye el riesgo de ictus en torno a un 35–40% y de eventos coronarios ~20%.", fuente: "Metaanálisis Lancet (Ettehad et al.)" },
      { nombre: "Dieta mediterránea", tier: "A", exito: 30, unidad: "menos eventos cardiovasculares mayores", desc: "Aceite de oliva, frutos secos, pescado, legumbres. El ensayo PREDIMED mostró ~30% menos infartos, ictus y muerte cardiovascular en población de riesgo.", fuente: "Ensayo PREDIMED (NEJM)" },
      { nombre: "Ejercicio aeróbico regular", tier: "S", exito: 30, unidad: "menos mortalidad cardiovascular", desc: "150 minutos semanales de actividad moderada se asocian con ~30% menos mortalidad cardiovascular frente al sedentarismo.", fuente: "Guías OMS de actividad física" },
      { nombre: "Estatinas (si tu médico las indica)", tier: "A", exito: 25, unidad: "menos eventos por cada reducción de LDL", desc: "En prevención de personas con riesgo elevado, cada ~39 mg/dL menos de colesterol LDL reduce eventos vasculares mayores ~22–25%. Siempre bajo prescripción.", fuente: "Metaanálisis CTT (Lancet)" }
    ]
  },
  {
    id: "nutricion",
    nombre: "Nutrición",
    icono: "🥗",
    color: "#2ecc71",
    rol: "Combustible y metabolismo",
    desc: "La alimentación es tu 'gestión de recursos': no hay build que funcione con mal combustible. Aquí se ganan (o pierden) la diabetes tipo 2, el colesterol y buena parte del riesgo cardiovascular.",
    especialistas: [
      { nombre: "Nutricionista / Dietista clínico", desc: "Diseña tu 'build' alimentaria: planes personalizados, educación nutricional y seguimiento." },
      { nombre: "Endocrinólogo", desc: "Especialista en metabolismo: diabetes, tiroides, obesidad y trastornos hormonales." },
      { nombre: "Nutricionista deportivo", desc: "Optimización para rendimiento: composición corporal, timing de nutrientes." }
    ],
    estrategias: [
      { nombre: "Pérdida de peso moderada si hay prediabetes", tier: "S", exito: 58, unidad: "menos progresión a diabetes tipo 2", desc: "Perder 5–7% del peso corporal con dieta y ejercicio redujo la progresión de prediabetes a diabetes un 58% en el ensayo DPP — más que el fármaco de referencia.", fuente: "Diabetes Prevention Program (NEJM)" },
      { nombre: "Reducir sodio a <5 g de sal/día", tier: "A", exito: 25, unidad: "menos eventos cardiovasculares en hipertensos", desc: "Menos sal, menos presión arterial. En personas hipertensas la reducción sostenida de sodio disminuye eventos cardiovasculares de forma significativa.", fuente: "OMS / ensayo SSaSS" },
      { nombre: "Fibra: 25–30 g diarios", tier: "A", exito: 20, unidad: "menos mortalidad global (mayor vs menor consumo)", desc: "Legumbres, avena, fruta entera, verdura. Los grandes metaanálisis asocian el consumo alto de fibra con ~15–25% menos mortalidad por todas las causas.", fuente: "Metaanálisis Lancet (Reynolds et al.)" },
      { nombre: "Limitar ultraprocesados", tier: "B", exito: 15, unidad: "menos riesgo asociado en estudios observacionales", desc: "El consumo alto de ultraprocesados se asocia con más obesidad, diabetes y mortalidad. La evidencia es observacional pero muy consistente.", fuente: "Cohortes NutriNet-Santé y otras" },
      { nombre: "Multivitamínicos sin déficit diagnosticado", tier: "C", exito: 2, unidad: "beneficio demostrado en población general sana", desc: "Si no tienes un déficit concreto, los multivitamínicos no han demostrado reducir mortalidad ni eventos. Ahorra tu oro para comida real.", fuente: "USPSTF / metaanálisis" }
    ]
  },
  {
    id: "salud-mental",
    nombre: "Salud Mental",
    icono: "🧠",
    color: "#9b59b6",
    rol: "Mente y emociones",
    desc: "Tu 'barra de maná'. Depresión y ansiedad son de los problemas de salud más prevalentes del mundo — y de los más tratables. Pedir ayuda no es debuff: es la estrategia óptima.",
    especialistas: [
      { nombre: "Psicólogo clínico", desc: "Terapias basadas en evidencia (TCC y otras): la línea principal para ansiedad, depresión e insomnio." },
      { nombre: "Psiquiatra", desc: "Médico especialista: diagnóstico, tratamiento farmacológico y casos moderados-graves." },
      { nombre: "Médico de familia", desc: "Primera línea de detección: puede iniciar tratamiento y derivar al especialista adecuado." }
    ],
    estrategias: [
      { nombre: "Terapia cognitivo-conductual (TCC) para depresión", tier: "S", exito: 55, unidad: "de pacientes con respuesta significativa", desc: "La terapia con más evidencia acumulada. En depresión leve-moderada, alrededor de la mitad o más de los pacientes responden significativamente.", fuente: "Metaanálisis Cuijpers et al." },
      { nombre: "Tratamiento combinado (terapia + fármaco)", tier: "A", exito: 65, unidad: "de respuesta en depresión moderada-grave", desc: "En depresión moderada-grave, combinar psicoterapia y antidepresivos supera a cada uno por separado. Siempre con seguimiento médico.", fuente: "Metaanálisis en World Psychiatry" },
      { nombre: "Ejercicio como coadyuvante antidepresivo", tier: "A", exito: 40, unidad: "de reducción media de síntomas depresivos", desc: "El ejercicio regular tiene un efecto antidepresivo comparable a tratamientos de primera línea en depresión leve-moderada. Gratis y sin lista de espera.", fuente: "Metaanálisis BMJ 2024" },
      { nombre: "Mindfulness (MBCT) para prevenir recaídas", tier: "B", exito: 30, unidad: "menos recaídas depresivas vs. control", desc: "La terapia cognitiva basada en mindfulness reduce el riesgo de recaída en personas con depresión recurrente.", fuente: "Metaanálisis JAMA Psychiatry" }
    ]
  },
  {
    id: "sueno",
    nombre: "Sueño",
    icono: "😴",
    color: "#3498db",
    rol: "Regeneración y descanso",
    desc: "Tu 'regeneración fuera de combate'. Dormir 7–9 horas repara cuerpo y cerebro; dormir crónicamente poco sube el riesgo de casi todo: accidentes, obesidad, depresión y enfermedad cardiovascular.",
    especialistas: [
      { nombre: "Especialista en medicina del sueño", desc: "Unidades del sueño: estudios polisomnográficos y diagnóstico de trastornos." },
      { nombre: "Neumólogo", desc: "El experto en apnea del sueño: ronquidos con pausas respiratorias, somnolencia diurna." },
      { nombre: "Psicólogo especializado en TCC-i", desc: "Terapia cognitivo-conductual para insomnio: el tratamiento de primera línea, por delante de las pastillas." }
    ],
    estrategias: [
      { nombre: "TCC-i para insomnio crónico", tier: "S", exito: 75, unidad: "de pacientes mejoran de forma clínicamente relevante", desc: "El tratamiento de elección para el insomnio crónico: 70–80% mejora, con efectos más duraderos que los hipnóticos y sin efectos secundarios.", fuente: "Guías AASM / metaanálisis" },
      { nombre: "CPAP para apnea del sueño", tier: "S", exito: 70, unidad: "de reducción de somnolencia con buen uso", desc: "En apnea moderada-grave, el CPAP elimina la mayoría de las pausas respiratorias y mejora drásticamente la somnolencia y calidad de vida.", fuente: "Guías AASM" },
      { nombre: "Horario regular de sueño", tier: "A", exito: 40, unidad: "mejora media de eficiencia del sueño", desc: "Acostarse y levantarse a la misma hora (sí, también el fin de semana) estabiliza el ritmo circadiano. La regularidad predice salud tanto como la duración.", fuente: "Estudios de cohorte UK Biobank" },
      { nombre: "Luz natural por la mañana", tier: "B", exito: 30, unidad: "mejora en latencia de sueño en estudios", desc: "10–30 minutos de luz exterior al despertar adelantan el reloj biológico y facilitan dormirse por la noche.", fuente: "Estudios de cronobiología" },
      { nombre: "Pantallas y cafeína tarde", tier: "B", exito: 25, unidad: "mejora al retirarlas en personas sensibles", desc: "La cafeína tiene una vida media de ~5 horas: un café a las 18:00 s