"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { DownloadIcon, UploadIcon } from "@/components/Icons";
import {
  applyProgressImport, downloadProgress, getPersistedImportBackup, restoreProgressBackup, summarizeCurrentProgress,
  validateProgressImport, type Backup, type ChapterCounts, type Field, type Fields,
} from "@/lib/progress";

// Copia de seguridad del progreso y las notas: exportar a un archivo JSON, importar con vista previa
// y deshacer la última importación. Nada sale del dispositivo: el archivo lo guarda la propia persona.
export default function ProgressManager({ lang, counts }: { lang: Lang; counts: ChapterCounts }) {
  const text = t(lang);
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<Fields | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [undo, setUndo] = useState<Backup | null>(null);

  useEffect(() => setUndo(getPersistedImportBackup()), []);

  const notify = () => window.dispatchEvent(new Event("h55-progress-changed"));

  function describe(field: Field, entry: NonNullable<Fields[Field]>) {
    if (field === "readingPosition") return text.importSummaryPosition;
    if (field === "completedChapters") return `${text.importSummaryCompleted} (${entry.clear ? 0 : entry.count})`;
    if (field === "chapterNotes") return `${text.importSummaryNotes} (${entry.clear ? 0 : entry.count})`;
    return text.importSummaryScale;
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPending(null);
    const result = validateProgressImport(await file.text(), counts);
    if (!result.valid) {
      setStatus(result.errors.map((code) => text[code]).join(" "));
      return;
    }
    const current = summarizeCurrentProgress();
    setOverwrite((Object.keys(result.fields) as Field[]).some((field) => current[field]));
    setPending(result.fields);
    setStatus("");
  }

  function confirm() {
    if (!pending) return;
    const result = applyProgressImport(pending);
    setPending(null);
    if (!result.success) {
      setStatus(result.atomic ? text.importProgressError : text.importErrorRollbackFailed);
      return;
    }
    setStatus(text.importProgressDone);
    setUndo(result.backup);
    notify();
  }

  function undoImport() {
    if (!undo) return;
    setStatus(restoreProgressBackup(undo) ? text.importUndoDone : text.undoErrorGeneric);
    setUndo(null);
    notify();
  }

  return (
    <section className="card backup" aria-labelledby="backup-title">
      <div>
        <p className="eyebrow">{text.progressManagement}</p>
        <h2 id="backup-title" className="h3">{text.backupTitle}</h2>
        <p className="muted small">{text.progressManagementHint}</p>
      </div>
      <div className="button-row">
        <button
          className="button button-outline"
          type="button"
          onClick={() => {
            try {
              downloadProgress();
              setStatus(text.exportProgressDone);
            } catch {
              setStatus(text.exportProgressError);
            }
          }}
        >
          <DownloadIcon size={18} /> {text.exportProgress}
        </button>
        <button className="button button-outline" type="button" onClick={() => input.current?.click()}><UploadIcon size={18} /> {text.importProgress}</button>
        <input
          ref={input}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onFile(file);
          }}
        />
      </div>
      {pending && (
        <div className="import-preview">
          <p className="eyebrow">{text.importPreviewTitle}</p>
          <ul className="import-preview-list">
            {(Object.entries(pending) as [Field, NonNullable<Fields[Field]>][]).map(([field, entry]) => (
              <li key={field}>{describe(field, entry)}</li>
            ))}
          </ul>
          {overwrite && <p className="import-overwrite-warning">{text.importOverwriteWarning}</p>}
          <div className="button-row">
            <button className="button button-primary" type="button" onClick={confirm}>{text.importConfirm}</button>
            <button className="button button-ghost" type="button" onClick={() => setPending(null)}>{text.importCancel}</button>
          </div>
        </div>
      )}
      <p className="action-status" role="status">{status}</p>
      {undo && <button className="button button-ghost" type="button" onClick={undoImport}>{text.undoImport}</button>}
    </section>
  );
}
