// Planes de lectura (fase 4, bloque 2). Cada plan es una lista de días; cada día, una lista de
// capítulos. La estructura se calcula SIEMPRE con el mismo catálogo (ONBV) para que el día 12 sea
// el mismo en español, inglés y alemán: el avance se comparte entre idiomas como el resto de marcas.
// El avance se guarda solo en este dispositivo.

import { localGet, localRemove, localSet } from "./local-storage";

export const READING_PLANS_KEY = "horizonte55-reading-plans";
export const PLANS_EVENT = "h55-plans-changed";

export const PLAN_IDS = ["bible-year", "nt-90", "gospels-30", "psalms-proverbs-31"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export type Reading = [book: string, chapter: number];
export type PlanDays = Reading[][];

// Claves de traducción del nombre y la descripción de cada plan.
export const PLAN_TEXT = {
  "bible-year": { name: "planBibleYear", desc: "planBibleYearDesc" },
  "nt-90": { name: "planNt90", desc: "planNt90Desc" },
  "gospels-30": { name: "planGospels30", desc: "planGospels30Desc" },
  "psalms-proverbs-31": { name: "planPsalmsProverbs", desc: "planPsalmsProverbsDesc" },
} as const satisfies Record<PlanId, { name: string; desc: string }>;

export const PLAN_LENGTH: Record<PlanId, number> = { "bible-year": 365, "nt-90": 90, "gospels-30": 30, "psalms-proverbs-31": 31 };

// Libros con el número de versículos de cada capítulo (para repartir la lectura de forma pareja).
export type BookShape = { id: string; verses: number[] };

// Reparte una secuencia de capítulos en `days` días de extensión parecida (por versículos, no por
// capítulos: el Salmo 119 pesa más que el 117). Cada día recibe al menos un capítulo.
function balance(chapters: { reading: Reading; weight: number }[], days: number): PlanDays {
  const total = chapters.reduce((sum, item) => sum + item.weight, 0);
  const result: PlanDays = [];
  let index = 0;
  let accumulated = 0;
  for (let day = 0; day < days; day++) {
    const remainingDays = days - day;
    const target = (total * (day + 1)) / days;
    const list: Reading[] = [];
    while (index < chapters.length) {
      const left = chapters.length - index;
      if (list.length > 0 && left <= remainingDays - 1) break; // dejar al menos uno para cada día restante
      const next = accumulated + chapters[index].weight;
      // Añadir mientras acerque el total al objetivo del día.
      if (list.length > 0 && Math.abs(next - target) > Math.abs(accumulated - target)) break;
      list.push(chapters[index].reading);
      accumulated = next;
      index++;
    }
    result.push(list);
  }
  // Lo que quede (por redondeo) va al último día.
  while (index < chapters.length) result[result.length - 1].push(chapters[index++].reading);
  return result;
}

const sequence = (books: BookShape[]) =>
  books.flatMap((book) => book.verses.map((count, i) => ({ reading: [book.id, i + 1] as Reading, weight: Math.max(count, 1) })));

export function buildPlans(books: BookShape[]): Record<PlanId, PlanDays> {
  const byId = Object.fromEntries(books.map((book) => [book.id, book]));
  const newTestament = books.slice(39);
  const gospels = ["mateo", "marcos", "lucas", "juan"].map((id) => byId[id]).filter(Boolean);
  const psalmsProverbs: PlanDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const psalms: Reading[] = day <= 30 ? Array.from({ length: 5 }, (_, k) => ["salmos", 5 * i + k + 1] as Reading) : [];
    return [...psalms, ["proverbios", day] as Reading];
  });
  return {
    "bible-year": balance(sequence(books), PLAN_LENGTH["bible-year"]),
    "nt-90": balance(sequence(newTestament), PLAN_LENGTH["nt-90"]),
    "gospels-30": balance(sequence(gospels), PLAN_LENGTH["gospels-30"]),
    "psalms-proverbs-31": psalmsProverbs,
  };
}

// ---------- Avance (localStorage) ----------

// { plan: { start: "2026-09-25", done: { "12": "2026-10-06" } } } — día (1…n) → fecha en que se marcó.
export type PlanProgress = { start: string; done: Record<string, string> };
export type PlansStore = Partial<Record<PlanId, PlanProgress>>;

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Días de calendario entre dos fechas "AAAA-MM-DD" (sin problemas de horario de verano).
export function daysBetween(from: string, to: string) {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function getPlans(): PlansStore {
  const result = localGet(READING_PLANS_KEY);
  if (!result.ok || !result.value) return {};
  try {
    const saved = JSON.parse(result.value);
    return isObject(saved) ? (saved as PlansStore) : {};
  } catch {
    return {};
  }
}

function save(store: PlansStore) {
  const result = !Object.keys(store).length
    ? localRemove(READING_PLANS_KEY)
    : localSet(READING_PLANS_KEY, JSON.stringify(store));
  if (!result.ok) return false;
  window.dispatchEvent(new Event(PLANS_EVENT));
  return true;
}

export function startPlan(id: PlanId, date = today()) {
  const store = getPlans();
  store[id] = { start: date, done: {} };
  return save(store);
}

export function leavePlan(id: PlanId) {
  const store = getPlans();
  delete store[id];
  return save(store);
}

export function setDayDone(id: PlanId, day: number, done: boolean, date = today()) {
  const store = getPlans();
  const plan = store[id];
  if (!plan) return false;
  const next = { ...plan.done };
  if (done) next[String(day)] = date;
  else delete next[String(day)];
  store[id] = { ...plan, done: next };
  return save(store);
}

// Estado de un plan: siguiente día sin leer, día que tocaría según la fecha de inicio y diferencia.
export function planStatus(id: PlanId, plan: PlanProgress, now = today()) {
  const length = PLAN_LENGTH[id];
  const doneCount = Object.keys(plan.done).length;
  let next = 1;
  while (next <= length && plan.done[String(next)]) next++;
  const scheduled = Math.min(length, Math.max(1, daysBetween(plan.start, now) + 1));
  return {
    length,
    doneCount,
    percent: Math.round((doneCount / length) * 100),
    next: next > length ? null : next, // null = plan terminado
    scheduled,
    // Días atrasados: los anteriores a hoy que siguen sin leer (la lectura de hoy aún no cuenta como retraso).
    behind: Math.max(0, scheduled - 1 - doneCount),
    ahead: Math.max(0, doneCount - scheduled),
  };
}

// Días seguidos con alguna lectura marcada (en cualquier plan), contando hasta hoy o hasta ayer.
export function streak(store: PlansStore = getPlans(), now = today()) {
  const dates = new Set(Object.values(store).flatMap((plan) => Object.values(plan?.done ?? {})));
  if (!dates.size) return 0;
  const [y, m, d] = now.split("-").map(Number);
  const cursor = new Date(y, m - 1, d);
  if (!dates.has(today(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(today(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

// Validación para la copia de seguridad.
export function isValidPlans(value: unknown): value is PlansStore {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([id, plan]) =>
    (PLAN_IDS as readonly string[]).includes(id) && isObject(plan) && typeof plan.start === "string" && DATE.test(plan.start) && isObject(plan.done) &&
    Object.entries(plan.done).every(([day, date]) => {
      const n = Number(day);
      return Number.isInteger(n) && String(n) === day && n >= 1 && n <= PLAN_LENGTH[id as PlanId] && typeof date === "string" && DATE.test(date);
    }),
  );
}
