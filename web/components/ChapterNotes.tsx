"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { copyText, getNote, MAX_NOTE_LENGTH, saveNote } from "@/lib/storage";
import { CheckIcon, NoteIcon } from "@/components/Icons";

// Notas del capítulo, guardadas solo en este dispositivo y con el mismo formato que la versión anterior.
// Son las mismas en todos los idiomas: una nota de Juan 3 aparece también en John 3 y Johannes 3.
export default function ChapterNotes({ lang, bookId, chapter }: { lang: Lang; bookId: string; chapter: number }) {
  const text = t(lang);
  const [value, setValue] = useState("");
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState(text.savedLocally);

  useEffect(() => {
    setValue(getNote(bookId, chapter));
    setFailed(false);
    setMessage(text.savedLocally);
  }, [bookId, chapter, text.savedLocally]);

  function onChange(next: string) {
    setValue(next);
    const ok = saveNote(bookId, chapter, next);
    setFailed(!ok);
    setMessage(ok ? text.savedLocally : text.notesSaveError);
  }

  return (
    <section className="notes" aria-labelledby="notes-title">
      <div className="notes-head">
        <span className="notes-icon"><NoteIcon /></span>
        <h2 id="notes-title" className="h3">{text.notes}</h2>
      </div>
      <textarea
        className="notes-field"
        id="chapterNotes"
        rows={5}
        maxLength={MAX_NOTE_LENGTH}
        placeholder={text.notesPlaceholder}
        aria-labelledby="notes-title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="notes-foot">
        <p className={`notes-status${failed ? " is-error" : ""}`} role="status">
          {!failed && <CheckIcon size={14} />} {message}
        </p>
        {failed && (
          <button className="button button-ghost" type="button" onClick={async () => { await copyText(value); setMessage(text.noteCopied); }}>
            {text.copyNote}
          </button>
        )}
      </div>
    </section>
  );
}
