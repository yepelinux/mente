import type { Settings, StepKey } from '../lib/types';

export const EMOTIONS = [
  'Ansiedad',
  'Miedo',
  'Culpa',
  'Vergüenza',
  'Enojo',
  'Tristeza',
  'Frustración',
];

// Interpretación propia de cada paso: editable desde Ajustes.
const STEP_TEXTS: Record<StepKey, { title: string; help: string }> = {
  medir: {
    title: 'Medir',
    help: '¿Qué estás sintiendo y con cuánta fuerza, de 0 a 10? ¿Qué pasó justo antes?',
  },
  exponer: {
    title: 'Exponer',
    help: 'Escribí el pensamiento tal cual aparece, sin corregirlo. Sacarlo de la cabeza ya baja el volumen.',
  },
  neutralizar: {
    title: 'Neutralizar',
    help: 'Pausa. Respirá un minuto y mirá los hechos: ¿qué pruebas hay a favor y en contra de ese pensamiento?',
  },
  transformar: {
    title: 'Transformar',
    help: 'Escribí una versión más justa y útil del pensamiento. Después volvé a medir cuánto sentís.',
  },
  entrenar: {
    title: 'Entrenar',
    help: 'La práctica corta del día. Lo que se repite se vuelve automático.',
  },
};

// Consignas propias, agrupadas en cuatro bloques (1–7, 8–14, 15–21, 22–30).
const DAY_PROMPTS = [
  // Medir y Exponer
  'Hoy solo observá: registrá al menos un momento en que tu cabeza se puso a dar vueltas.',
  'Poné nombre a la emoción principal del día. Una sola palabra alcanza.',
  'Anotá un "¿y si…?" que te haya aparecido y qué intensidad tenía.',
  'Buscá el disparador: ¿qué estabas haciendo cuando empezó el ruido mental?',
  'Registrá un pensamiento a la noche, antes de dormir, aunque sea chiquito.',
  'Mirá tus registros de la semana: ¿se repite algún tema o disparador?',
  'Escribí sin filtro durante tres minutos todo lo que te preocupa. Después elegí uno y registralo.',
  // Neutralizar
  'Antes de registrar, hacé un minuto de respiración lenta y anotá si bajó la intensidad.',
  'Para un pensamiento de hoy, escribí una prueba a favor y una en contra.',
  'Preguntate: ¿esto es un hecho o una interpretación? Registralo.',
  'Cuando aparezca la espiral, nombrala en voz baja ("estoy sobrepensando") y seguí con lo que hacías.',
  'Elegí un horario de 15 minutos para preocuparte. Fuera de ese rato, anotá y posponé.',
  'Registrá un pensamiento en el que la pausa no alcanzó. ¿Qué te hubiera ayudado?',
  'Repasá la semana: ¿qué recurso para bajar la intensidad te sirvió más?',
  // Transformar
  'Tomá un pensamiento de hoy y reescribilo como se lo dirías a un amigo.',
  'Cambiá un "siempre" o un "nunca" por algo más preciso.',
  'Para un "¿y si…?", escribí también qué harías si pasara. Tener un plan baja el miedo.',
  'Buscá una explicación alternativa para algo que interpretaste mal de otra persona.',
  'Reescribí un pensamiento de culpa separando lo que dependía de vos de lo que no.',
  'Compará la intensidad antes y después en tus registros. ¿Qué tipo de reescritura funciona mejor?',
  'Elegí tu reescritura favorita de la semana y guardala en una nota para releerla.',
  // Entrenar
  'Hacé el recorrido completo (medir, exponer, neutralizar, transformar) con un pensamiento de hoy.',
  'Practicá el recorrido en menos de dos minutos, aunque sea mental.',
  'Usá el método antes de una situación que te genera ansiedad, no después.',
  'Hoy registrá algo que salió bien y que antes te hubiera preocupado.',
  'Repetí el ejercicio del horario de preocupación y anotá si el ruido bajó.',
  'Elegí el disparador más frecuente del mes y escribí cómo lo vas a encarar la próxima vez.',
  'Hacé el recorrido completo con el pensamiento más pesado que tengas hoy.',
  'Releé tus primeros registros. ¿Qué cambió en cómo te hablás?',
  'Cierre: escribí qué te llevás de estos 30 días y qué práctica vas a sostener.',
];

export function defaultSettings(): Settings {
  return {
    planStartDate: null,
    stepTexts: structuredClone(STEP_TEXTS),
    dayPrompts: [...DAY_PROMPTS],
    lastBackupAt: null,
  };
}
