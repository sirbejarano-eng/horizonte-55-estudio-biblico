import { loadBooks, getCompletedChapters, navigateTo, normalizeText, totalChapters, totalCompleted, exportProgress, validateProgressImport, applyProgressImport, restoreProgressBackup, summarizeCurrentProgress, getPersistedImportBackup, escapeHtml } from './core.js?v=31';
import { renderError, renderShell } from './shell.js?v=14';
import { t, localizedBookTitle } from './i18n.js?v=34';

const grid = document.getElementById('libraryGrid');
const testamentFilter = document.getElementById('testamentFilter');
const bookFilter = document.getElementById('bookFilter');
const bookSuggestionsMenu = document.getElementById('bookSuggestionsMenu');
const exportProgressButton = document.getElementById('exportProgressButton');
const importProgressButton = document.getElementById('importProgressButton');
const importProgressInput = document.getElementById('importProgressInput');
const progressManagementStatus = document.getElementById('progressManagementStatus');
const importPreview = document.getElementById('importPreview');
const importPreviewList = document.getElementById('importPreviewList');
const importOverwriteWarning = document.getElementById('importOverwriteWarning');
const importConfirmButton = document.getElementById('importConfirmButton');
const importCancelButton = document.getElementById('importCancelButton');
let pendingImportFields = null;
let currentBooks = [];
const oldTestamentIds = [
  'genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio', 'josue', 'jueces', 'rut',
  '1-samuel', '2-samuel', '1-reyes', '2-reyes', '1-cronicas', '2-cronicas', 'esdras',
  'nehemias', 'ester', 'job', 'salmos', 'proverbios', 'eclesiastes', 'cantares',
  'isaias', 'jeremias', 'lamentaciones', 'ezequiel', 'daniel', 'oseas', 'joel', 'amos',
  'abdias', 'jonas', 'miqueas', 'nahum', 'habacuc', 'sofonias', 'hageo', 'zacarias', 'malaquias'
];

function editDistance(first, second) {
  const row = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let previous = row[0];
    row[0] = firstIndex;
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const current = row[secondIndex];
      row[secondIndex] = first[firstIndex - 1] === second[secondIndex - 1]
        ? previous
        : Math.min(previous + 1, row[secondIndex - 1] + 1, current + 1);
      previous = current;
    }
  }
  return row[second.length];
}

function matchesBookTitle(title, query) {
  const normalizedTitle = normalizeText(title).trim();
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery || normalizedTitle.includes(normalizedQuery)) return true;
  if (normalizedQuery.length < 4) return false;
  return normalizedTitle.split(/\s+/).some((word) => editDistance(word, normalizedQuery) <= 1);
}

function bookMatchScore(title, query) {
  const normalizedTitle = normalizeText(title).trim();
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) return 99;
  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedTitle.startsWith(normalizedQuery)) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 2;
  if (matchesBookTitle(title, query)) return 3;
  return 99;
}

function renderLibrary(books) {
  const completed = getCompletedChapters(books);
  const groups = [
    ['old-testament', books.filter((book) => oldTestamentIds.includes(book.id))],
    ['new-testament', books.filter((book) => !oldTestamentIds.includes(book.id))]
  ];
  grid.innerHTML = `<div class="library-index" aria-label="${t('libraryIndex')}"><strong>${t('libraryIndex')}</strong><a href="#old-testament">${t('oldTestament')} <span>${groups[0][1].length} ${t('books')}</span></a><a href="#new-testament">${t('newTestament')} <span>${groups[1][1].length} ${t('books')}</span></a></div><p class="library-summary">${totalCompleted(books, completed)} ${t('of')} ${totalChapters(books)} ${t('chaptersCompleted')}</p>`;
  groups.forEach(([id, group]) => {
    const section = document.createElement('section');
    section.className = 'library-section';
    section.id = id;
    const otherId = id === 'old-testament' ? 'new-testament' : 'old-testament';
    const translatedTitle = id === 'old-testament' ? t('oldTestament') : t('newTestament');
    const otherTranslatedTitle = id === 'old-testament' ? t('newTestament') : t('oldTestament');
    section.innerHTML = `<div class="library-section-heading"><div><p class="eyebrow">${id === 'old-testament' ? t('oldDescription') : t('newDescription')}</p><h2>${translatedTitle}</h2></div><div class="library-section-actions"><span>${group.length} ${t('books')}</span><a href="#${otherId}">${otherTranslatedTitle}</a></div></div><div class="library-grid-inner"></div>`;
    const inner = section.querySelector('.library-grid-inner');
    group.forEach((book) => {
      const done = completed[book.id]?.length || 0;
      const card = document.createElement('article');
      card.className = 'library-card';
      card.dataset.bookId = book.id;
      card.dataset.bookTitle = `${book.title} ${localizedBookTitle(book)}`;
      card.innerHTML = `<div><p class="eyebrow">${done}/${book.chapters.length} ${t('chapter')}</p><h3>${escapeHtml(localizedBookTitle(book))}</h3><p>${t('findBook')}</p></div><button class="hero-button" type="button">${t('openBook')}</button>`;
      card.querySelector('button').addEventListener('click', () => navigateTo(book.id));
      inner.appendChild(card);
    });
    grid.appendChild(section);
  });
}

function filterLibrary() {
  const testament = testamentFilter.value;
  const query = bookFilter.value.trim();
  document.querySelectorAll('.library-section').forEach((section) => {
    const sectionMatches = testament === 'all' || section.id === testament;
    let visibleCards = 0;
    const cards = [...section.querySelectorAll('.library-card')];
    cards.sort((first, second) => bookMatchScore(first.dataset.bookTitle, query) - bookMatchScore(second.dataset.bookTitle, query));
    const cardGrid = section.querySelector('.library-grid-inner');
    cards.forEach((card) => cardGrid.appendChild(card));
    cards.forEach((card) => {
      const matchesName = !query || bookMatchScore(card.dataset.bookTitle, query) < 99;
      const visible = sectionMatches && matchesName;
      card.hidden = !visible;
      if (visible) visibleCards += 1;
    });
    section.hidden = visibleCards === 0;
  });
  const hasResults = [...document.querySelectorAll('.library-card')].some((card) => !card.hidden);
  let emptyMessage = document.getElementById('libraryEmptyMessage');
  if (!hasResults) {
    if (!emptyMessage) {
      emptyMessage = document.createElement('p');
      emptyMessage.id = 'libraryEmptyMessage';
      emptyMessage.className = 'empty-state';
      grid.appendChild(emptyMessage);
    }
    emptyMessage.textContent = t('noBook');
  } else if (emptyMessage) {
    emptyMessage.remove();
  }
}

function renderBookSuggestions() {
  const query = bookFilter.value.trim();
  const suggestions = currentBooks.filter((book) => matchesBookTitle(book.title, query) || matchesBookTitle(localizedBookTitle(book), query));
  bookSuggestionsMenu.innerHTML = '';
  suggestions.forEach((book) => {
    const option = document.createElement('a');
    option.href = `./lectura.html?book=${encodeURIComponent(book.id)}&chapter=1`;
    option.className = 'book-suggestion';
    option.setAttribute('role', 'option');
    option.textContent = localizedBookTitle(book);
    bookSuggestionsMenu.appendChild(option);
  });
  const shouldShow = document.activeElement === bookFilter && suggestions.length > 0;
  bookSuggestionsMenu.hidden = !shouldShow;
  bookFilter.setAttribute('aria-expanded', String(shouldShow));
}

renderShell('library');

exportProgressButton.addEventListener('click', () => {
  try {
    const data = exportProgress();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horizonte55-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    progressManagementStatus.textContent = t('exportProgressDone');
  } catch (error) {
    progressManagementStatus.textContent = t('exportProgressError');
  }
});

importProgressButton.addEventListener('click', () => importProgressInput.click());

function resetImportPreview() {
  pendingImportFields = null;
  importPreview.hidden = true;
  importPreviewList.innerHTML = '';
  importOverwriteWarning.hidden = true;
}

function describeField(field, entry) {
  if (field === 'readingPosition') return t('importSummaryPosition');
  if (field === 'completedChapters') return `${t('importSummaryCompleted')} (${entry.clear ? 0 : entry.count})`;
  if (field === 'chapterNotes') return `${t('importSummaryNotes')} (${entry.clear ? 0 : entry.count})`;
  return t('importSummaryScale');
}

function showImportPreview(fields) {
  const current = summarizeCurrentProgress();
  pendingImportFields = fields;
  importPreviewList.innerHTML = '';
  let willOverwrite = false;
  Object.entries(fields).forEach(([field, entry]) => {
    const item = document.createElement('li');
    item.textContent = describeField(field, entry);
    importPreviewList.appendChild(item);
    if (field !== 'readingScale' && current[field]) willOverwrite = true;
  });
  importOverwriteWarning.hidden = !willOverwrite;
  importPreview.hidden = false;
  progressManagementStatus.textContent = '';
}

importProgressInput.addEventListener('change', async () => {
  const file = importProgressInput.files[0];
  importProgressInput.value = '';
  if (!file) return;
  resetImportPreview();
  const text = await file.text();
  const result = validateProgressImport(text, currentBooks);
  if (!result.valid) {
    progressManagementStatus.textContent = result.errors.map((code) => t(code)).join(' ');
    return;
  }
  showImportPreview(result.fields);
});

importCancelButton.addEventListener('click', () => resetImportPreview());

function offerUndo(backup) {
  document.getElementById('importUndoButton')?.remove();
  const undoButton = document.createElement('button');
  undoButton.id = 'importUndoButton';
  undoButton.type = 'button';
  undoButton.className = 'secondary-button';
  undoButton.textContent = t('undoImport');
  undoButton.addEventListener('click', () => {
    const restored = restoreProgressBackup(backup);
    progressManagementStatus.textContent = t(restored ? 'importUndoDone' : 'undoErrorGeneric');
    undoButton.remove();
    renderLibrary(currentBooks);
  });
  progressManagementStatus.after(undoButton);
}

importConfirmButton.addEventListener('click', () => {
  const fields = pendingImportFields;
  resetImportPreview();
  const result = applyProgressImport(fields);
  if (!result.success) {
    progressManagementStatus.textContent = t(result.atomic ? 'importProgressError' : 'importErrorRollbackFailed');
    return;
  }
  progressManagementStatus.textContent = t('importProgressDone');
  renderLibrary(currentBooks);
  offerUndo(result.backup);
});

const persistedBackup = getPersistedImportBackup();
if (persistedBackup) offerUndo(persistedBackup.backup);

loadBooks().then((books) => {
  currentBooks = books;
  testamentFilter.options[0].textContent = t('allBooks');
  testamentFilter.options[1].textContent = t('oldTestament');
  testamentFilter.options[2].textContent = t('newTestament');
  bookFilter.placeholder = t('searchBookPlaceholder');
  bookSuggestionsMenu.setAttribute('aria-label', t('searchBook'));
  renderLibrary(books);
  testamentFilter.addEventListener('change', filterLibrary);
  bookFilter.addEventListener('input', () => { filterLibrary(); renderBookSuggestions(); });
  bookFilter.addEventListener('focus', renderBookSuggestions);
  bookFilter.addEventListener('blur', () => window.setTimeout(() => { bookSuggestionsMenu.hidden = true; bookFilter.setAttribute('aria-expanded', 'false'); }, 150));
}).catch((error) => renderError(grid, error));
