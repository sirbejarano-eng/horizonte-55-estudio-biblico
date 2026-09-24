"use client";

import { useEffect, useState } from "react";
import { copyText, getNote, MAX_NOTE_LENGTH, saveNote } from "@/lib/storage";

// Notas del capítulo, guardadas solo en este dispositivo y con el mismo formato que la versión actual.
export default function ChapterNotes({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [value, setValue] = useState("");
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("Guardado localmente en este dispositivo");

  useEffect(() => {
    setValue(getNote(bookId, chapter));
    setFailed(false);
    setMessage("Guardado localmente en este dispositivo");
  }, [bookId, chapter]);

  function onChange(text: string) {
    setValue(text);
    const ok = saveNote(bookId, chapter, text);
    setFailed(!ok);
    setMessage(ok ? "Guardado localmente en este dispositivo" : "No se pudo guardar la nota en este dispositivo. Copia el texto para no perderlo.");
  }

  return (
    <section className="notes-panel" aria-labelledby="notes-title">
      <p className="eyebrow">Notas</p>
      <h2 id="notes-title">Notas</h2>
      <textarea
        className="chapter-notes"
        id="chapterNotes"
        rows={6}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Escribe tus observaciones, preguntas o referencias..."
        aria-labelledby="notes-title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="notes-footer">
        <p className="notes-status" role="status">{message}</p>
        {failed && (
          <button className="secondary-button" type="button" onClick={async () => { await copyText(value); setMessage("Nota copiada al portapapeles"); }}>
            Copiar nota
          </button>
        )}
      </div>
    </section>
  );
}
