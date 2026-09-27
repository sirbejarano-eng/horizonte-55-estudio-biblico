"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterPath, t, type Edition, type Lang } from "@/lib/i18n";
import { getCompleted, markCompleted, preferredEdition } from "@/lib/storage";
import {
  getPlans, leavePlan, PLAN_IDS, PLAN_LENGTH, PLAN_TEXT, planStatus, PLANS_EVENT, setDayDone, startPlan, streak,
  type PlanDays, type PlanId, type PlansStore, type Reading,
} from "@/lib/plans";
import { CheckIcon, CircleIcon, SparkIcon } from "@/components/Icons";

type Titles = Record<string, string>;

// "Génesis 36–38, Éxodo 1": capítulos seguidos del mismo libro agrupados.
export function summarize(readings: Reading[], titles: Titles) {
  const parts: string[] = [];
  for (let i = 0; i < readings.length; i++) {
    const [book, start] = readings[i];
    let end = start;
    while (i + 1 < readings.length && readings[i + 1][0] === book && readings[i + 1][1] === end + 1) end = readings[++i][1];
    parts.push(`${titles[book] ?? book} ${start === end ? start : `${start}–${end}`}`);
  }
  return parts.join(", ");
}

const formatDate = (value: string, lang: Lang) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
};

export default function PlansBrowser({ lang, plans, titles }: { lang: Lang; plans: Record<PlanId, PlanDays>; titles: Titles }) {
  const text = t(lang);
  const [store, setStore] = useState<PlansStore | null>(null);
  const [completed, setCompleted] = useState<Record<string, number[]>>({});
  const [edition, setEdition] = useState<Edition>(lang === "es" ? "onbv" : lang);
  const [confirm, setConfirm] = useState<PlanId | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setEdition(preferredEdition(lang));
    const load = () => {
      setStore(getPlans());
      setCompleted(getCompleted());
    };
    load();
    window.addEventListener(PLANS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(PLANS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [lang]);

  if (store === null) return <div className="marks-loading" aria-hidden="true" />;

  const active = PLAN_IDS.filter((id) => store[id]);
  const others = PLAN_IDS.filter((id) => !store[id]);
  const days = streak(store);
  const isDone = ([book, chapter]: Reading) => completed[book]?.includes(chapter);

  function completeDay(id: PlanId, day: number) {
    if (!setDayDone(id, day, true)) return setSaveStatus(text.saveError);
    const nextCompleted = markCompleted(plans[id][day - 1]);
    if (!nextCompleted) {
      setDayDone(id, day, false);
      return setSaveStatus(text.saveError);
    }
    setCompleted(nextCompleted);
    setSaveStatus("");
  }

  function toggleDay(id: PlanId, day: number, read: boolean) {
    if (read && !setDayDone(id, day, false)) setSaveStatus(text.saveError);
    else if (!read) completeDay(id, day);
    else setSaveStatus("");
  }

  function beginPlan(id: PlanId) {
    setSaveStatus(startPlan(id) ? "" : text.saveError);
  }

  function removePlan(id: PlanId) {
    if (leavePlan(id)) {
      setConfirm(null);
      setSaveStatus("");
    } else setSaveStatus(text.saveError);
  }

  return (
    <div className="plans">
      <p className="action-status" role="status" aria-live="polite">{saveStatus}</p>
      {active.length > 0 && (
        <section aria-labelledby="active-plans">
          <div className="plans-heading">
            <h2 id="active-plans" className="h2">{text.activePlans}</h2>
            {days > 0 && <p className="streak"><SparkIcon size={18} /> <strong>{days}</strong> {text.streakLabel}</p>}
          </div>
          {active.map((id) => {
            const plan = store[id]!;
            const status = planStatus(id, plan);
            const day = status.next;
            return (
              <article key={id} className="card plan-card is-active" aria-labelledby={`plan-${id}`}>
                <header className="plan-head">
                  <div>
                    <h3 id={`plan-${id}`} className="h3">{text[PLAN_TEXT[id].name]}</h3>
                    <p className="muted small">{text.startedOn} {formatDate(plan.start, lang)}</p>
                  </div>
                  <p className={`plan-status${status.behind > 0 && day ? " is-behind" : ""}`}>
                    {!day ? text.planComplete : status.behind > 0 ? text.behindBy.replace("{n}", String(status.behind)) : status.ahead > 0 ? text.aheadBy.replace("{n}", String(status.ahead)) : text.onTrack}
                  </p>
                </header>
                <div className="progress" role="progressbar" aria-label={text[PLAN_TEXT[id].name]} aria-valuenow={status.percent} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${status.percent}%` }} />
                </div>
                <p className="muted small">{status.doneCount} {text.of} {status.length} {text.daysLabel} · {status.percent}%</p>

                {day && (
                  <div className="plan-today">
                    <p className="eyebrow">{status.doneCount >= status.scheduled ? text.nextReading : text.todayReading} · {text.dayLabel} {day}</p>
                    <ul className="plan-readings">
                      {plans[id][day - 1].map((reading) => (
                        <li key={reading.join("-")}>
                          <Link href={chapterPath(edition, reading[0], reading[1])} className={isDone(reading) ? "is-done" : ""}>
                            {isDone(reading) ? <CheckIcon size={16} /> : <CircleIcon size={16} />} {titles[reading[0]]} {reading[1]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button type="button" className="button button-primary" onClick={() => completeDay(id, day)}>
                      <CheckIcon size={18} /> {text.markDayRead}
                    </button>
                    <p className="muted small plan-hint">{text.planCompletedChapters}</p>
                  </div>
                )}

                <details className="plan-days">
                  <summary>{text.allDays}</summary>
                  <ol>
                    {plans[id].map((readings, i) => {
                      const n = i + 1;
                      const read = Boolean(plan.done[String(n)]);
                      return (
                        <li key={n} className={`${read ? "is-read" : ""}${n === day ? " is-next" : ""}`}>
                          <button
                            type="button"
                            className="plan-day-toggle"
                            aria-pressed={read}
                            aria-label={`${text.dayLabel} ${n}: ${read ? text.unmarkDay : text.markDayRead}`}
                            onClick={() => toggleDay(id, n, read)}
                          >
                            {read ? <CheckIcon size={16} /> : null}
                          </button>
                          <span className="plan-day-n">{text.dayLabel} {n}</span>
                          <Link href={chapterPath(edition, readings[0][0], readings[0][1])}>{summarize(readings, titles)}</Link>
                        </li>
                      );
                    })}
                  </ol>
                </details>

                <div className="plan-foot">
                  {confirm === id ? (
                    <>
                      <span className="muted small">{text.confirmLeave}</span>
                      <button type="button" className="button button-ghost note-delete" onClick={() => removePlan(id)}>{text.confirmLeaveYes}</button>
                      <button type="button" className="button button-ghost" onClick={() => setConfirm(null)}>{text.cancel}</button>
                    </>
                  ) : (
                    <button type="button" className="text-button" onClick={() => setConfirm(id)}>{text.leavePlan}</button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="more-plans" className="plans-more">
          {active.length > 0 && <h2 id="more-plans" className="h2">{text.morePlans}</h2>}
          {active.length === 0 && <h2 id="more-plans" className="sr-only">{text.plansEyebrow}</h2>}
          <div className="plan-grid">
            {others.map((id) => (
              <article key={id} className="card plan-card" aria-labelledby={`plan-${id}`}>
                <p className="plan-length"><strong>{PLAN_LENGTH[id]}</strong> {text.daysLabel}</p>
                <h3 id={`plan-${id}`} className="h3">{text[PLAN_TEXT[id].name]}</h3>
                <p className="muted">{text[PLAN_TEXT[id].desc]}</p>
                <p className="muted small">{text.dayLabel} 1: {summarize(plans[id][0], titles)}</p>
                <button type="button" className="button button-outline" onClick={() => beginPlan(id)}>{text.startPlan}</button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
