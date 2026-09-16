import { loadBooks, findBook, getReadingPosition, saveReadingPosition, getCompletedChapters, toggleCompleted, getNotes, saveNote, getReadingScale, saveReadingScale, copyReference, navigateTo, escapeHtml, getSpanishVersion, normalizeRv1909Opening } from './core.js?v=31';
import { renderError, renderShell } from './shell.js?v=15';
import { t, localizedBookTitle } from './i18n.js?v=35';

const app = document.getElementById('readerApp');
const params = new URLSearchParams(window.location.search);
let books;
let completed;
let notes;
let scale;
// Borrador de nota no guardada, independiente de localStorage: sobrevive a un renderReader() disparado
// por otras acciones (cambiar tamaño de texto, marcar completado) para no perder texto sin guardar.
let draftNote = null;
// Último mensaje de error mostrado en #readerStatus, para que no desaparezca si algo dispara un re-render.
let readerStatusMessage = null;

function setReaderStatus(message, { isError = false } = {}) {
  const status = app.querySelector('#readerStatus');
  if (status) status.textContent = message;
  readerStatusMessage = isError ? message : null;
}

function renderReader() {
  const position = getReadingPosition(books);
  const book = findBook(books, params.get('book') || position?.bookId);
  const chapterNumber = Number(params.get('chapter')) || position?.chapter || book.chapters[0].number;
  const chapter = book.chapters.find((item) => item.number === chapterNumber) || book.chapters[0];
  const completedChapter = completed[book.id]?.includes(chapter.number) || false;
  const chapterIndex = book.chapters.findIndex((item) => item.number === chapter.number);
  const percentage = Math.round(((chapterIndex + 1) / book.chapters.length) * 100);
  saveReadingPosition(book.id, chapter.number);
  document.documentElement.style.setProperty('--verse-font-size', `${scale}rem`);

  const chapterOptions = book.chapters.map((item) => (
    `<option value="${item.number}" ${item.number === chapter.number ? 'selected' : ''}>${t('chapter')} ${item.number}</option>`
  )).join('');
    const verses = chapter.verses.map((verse) => {
      const displayText = getSpanishVersion() === 'rv1909' ? normalizeRv1909Opening(verse.text, verse.number) : verse.text;
      return (
        `<div class="verse" id="verse-${verse.number}"><span class="verse-number">${verse.number}</span><div class="verse-content"><p class="verse-text">${escapeHtml(displayText)}</p><button class="verse-share" type="button" data-verse-number="${verse.number}" aria-label="${t('shareVerse')} ${escapeHtml(localizedBookTitle(book))} ${chapter.number}:${verse.number}">${t('shareVerse')}</button></div></div>`
      );
    }).join('');

  app.innerHTML = `
    <article class="chapter-card">
      <header class="chapter-header">
        <div>
          <p class="eyebrow chapter-book-title">${escapeHtml(localizedBookTitle(book))}</p>
          <h1 class="chapter-title">${t('chapter')} ${chapter.number}</h1>
          <div class="book-progress">
            <div class="book-progress-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
              <span class="book-progress-fill" style="width:${percentage}%"></span>
            </div>
            <span class="book-progress-label">${t('chapter')} ${chapterIndex + 1} ${t('of')} ${book.chapters.length}</span>
          </div>
        </div>
        <div class="chapter-actions">
          <button class="secondary-button" data-action="complete" aria-pressed="${completedChapter}">${completedChapter ? t('completed') : t('complete')}</button>
          <div class="reading-tools">
            <button class="text-size-button" data-action="smaller" aria-label="${t('reduceText')}">A-</button>
            <span class="text-size-label">${Math.round(scale * 100)}%</span>
            <button class="text-size-button" data-action="larger" aria-label="${t('increaseText')}">A+</button>
          </div>
          <button class="secondary-button" data-action="copy">${t('copyChapter')} ${escapeHtml(localizedBookTitle(book))} ${chapter.number}</button>
          <select class="chapter-select" aria-label="${t('chooseChapter')}">${chapterOptions}</select>
          <button class="secondary-button" data-action="previous" ${chapterIndex === 0 ? 'disabled' : ''}>${t('previous')}</button>
          <button class="secondary-button" data-action="next" ${chapterIndex === book.chapters.length - 1 ? 'disabled' : ''}>${t('next')}</button>
        </div>
      </header>
      <p class="action-status" id="readerStatus" role="status"></p>
      <div class="verses">${verses}</div>
      <section class="notes-panel">
        <p class="eyebrow">${t('notes')}</p>
        <h2>${t('notes')}</h2>
        <textarea class="chapter-notes" id="chapterNotes" rows="6" placeholder="${t('notesPlaceholder')}"></textarea>
        <div class="notes-footer">
          <p class="notes-status" id="notesStatus" role="status">${t('savedLocally')}</p>
          <button class="secondary-button" id="copyNoteButton" type="button" hidden>${t('copyNote')}</button>
        </div>
      </section>
    </article>`;

  app.querySelector('#chapterNotes').value = draftNote?.bookId === book.id && draftNote?.chapter === chapter.number
    ? draftNote.value
    : (notes[book.id]?.[chapter.number] || '');
  if (readerStatusMessage) app.querySelector('#readerStatus').textContent = readerStatusMessage;
  if (draftNote?.bookId === book.id && draftNote?.chapter === chapter.number) {
    app.querySelector('#notesStatus').textContent = t('saveErrorNotes');
    app.querySelector('#copyNoteButton').hidden = false;
  }

  const goTo = (number) => navigateTo(book.id, number);
  app.querySelector('[data-action="complete"]').addEventListener('click', () => {
    const success = toggleCompleted(completed, book.id, chapter.number);
    completed = getCompletedChapters(books);
    if (!success) setReaderStatus(t('saveErrorGeneric'), { isError: true });
    else readerStatusMessage = null;
    renderReader();
  });
  app.querySelector('[data-action="smaller"]').addEventListener('click', () => {
    scale = Math.max(0.9, Number((scale - 0.1).toFixed(1)));
    saveReadingScale(scale);
    renderReader();
  });
  app.querySelector('[data-action="larger"]').addEventListener('click', () => {
    scale = Math.min(1.3, Number((scale + 0.1).toFixed(1)));
    saveReadingScale(scale);
    renderReader();
  });
  app.querySelector('[data-action="copy"]').addEventListener('click', async () => {
    const reference = `${localizedBookTitle(book)} ${chapter.number}`;
    try {
      await copyReference(reference);
      setReaderStatus(`${reference} ${t('copied')}`);
    } catch (error) {
      setReaderStatus(t('copyErrorReference'), { isError: true });
    }
  });
  app.querySelectorAll('.verse-share').forEach((button) => {
    button.addEventListener('click', async () => {
      const verseNumber = Number(button.dataset.verseNumber);
      const verse = chapter.verses.find((item) => item.number === verseNumber);
      const reference = `${localizedBookTitle(book)} ${chapter.number}:${verse.number}`;
      const shareText = `${reference}\n${verse.text}`;
      const shareUrl = new URL(`./lectura.html?book=${encodeURIComponent(book.id)}&chapter=${chapter.number}#verse-${verse.number}`, window.location.href).href;
      try {
        if (navigator.share) {
          await navigator.share({ title: reference, text: shareText, url: shareUrl });
          setReaderStatus(t('shared'));
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareText);
          setReaderStatus(`${reference} ${t('copied')}`);
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank', 'noopener');
          setReaderStatus(t('shared'));
        }
      } catch (error) {
        if (error.name !== 'AbortError') setReaderStatus(t('shareErrorVerse'), { isError: true });
      }
    });
  });
  app.querySelector('select').addEventListener('change', (event) => goTo(Number(event.target.value)));
  app.querySelector('[data-action="previous"]').addEventListener('click', () => goTo(book.chapters[chapterIndex - 1].number));
  app.querySelector('[data-action="next"]').addEventListener('click', () => goTo(book.chapters[chapterIndex + 1].number));
  const notesField = app.querySelector('#chapterNotes');
  const notesStatus = app.querySelector('#notesStatus');
  const copyNoteButton = app.querySelector('#copyNoteButton');
  notesField.addEventListener('input', (event) => {
    const success = saveNote(notes, book.id, chapter.number, event.target.value);
    if (success) {
      draftNote = null;
      notesStatus.textContent = t('savedLocally');
      copyNoteButton.hidden = true;
    } else {
      draftNote = { bookId: book.id, chapter: chapter.number, value: event.target.value };
      notesStatus.textContent = t('saveErrorNotes');
      copyNoteButton.hidden = false;
    }
  });
  copyNoteButton.addEventListener('click', async () => {
    try {
      await copyReference(notesField.value);
      notesStatus.textContent = t('copied');
    } catch (error) {
      notesStatus.textContent = t('saveErrorNotes');
    }
  });

  highlightTargetVerse();
}

function highlightTargetVerse() {
  const hash = window.location.hash;
  if (!/^#verse-\d+$/.test(hash)) return;
  const target = app.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.add('verse-highlight');
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  window.setTimeout(() => target.classList.remove('verse-highlight'), 4000);
}

// Protege la salida de la página mientras exista un borrador de nota sin guardar.
window.addEventListener('beforeunload', (event) => {
  if (draftNote) {
    event.preventDefault();
    event.returnValue = '';
  }
});

renderShell('reader');
loadBooks().then((loaded) => {
  books = loaded;
  completed = getCompletedChapters(books);
  notes = getNotes(books);
  scale = getReadingScale();
  renderReader();
}).catch((error) => renderError(app, error));
