import { loadBooks, normalizeText, navigateTo, escapeHtml } from './core.js?v=31';
import { renderError, renderShell } from './shell.js?v=14';
import { t, localizedBookTitle, getLanguage } from './i18n.js?v=34';

const RESULTS_PAGE_SIZE = 20;
const input = document.getElementById('pageSearchInput');
const results = document.getElementById('pageSearchResults');
let books = [];
let currentMatches = [];
let renderedCount = 0;

function parseReference(term) {
  const match = term.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;
  const book = books.find((item) => normalizeText(item.title).trim() === normalizeText(match[1]).trim() || normalizeText(localizedBookTitle(item)).trim() === normalizeText(match[1]).trim());
  return book ? { book, chapter: Number(match[2]), verse: match[3] ? Number(match[3]) : null } : null;
}

function pluralSuffix(count) {
  if (count === 1) return '';
  return getLanguage() === 'de' ? 'se' : 's';
}

function updateSummary(summaryElement) {
  const total = currentMatches.length;
  summaryElement.textContent = renderedCount >= total
    ? `${total} ${t('resultLabel')}${pluralSuffix(total)}`
    : `${t('showingResultsLabel')} ${renderedCount} ${t('of')} ${total} ${t('resultLabel')}${pluralSuffix(total)}`;
}

function appendNextResults(list, summaryElement, showMoreButton) {
  currentMatches.slice(renderedCount, renderedCount + RESULTS_PAGE_SIZE).forEach(({ book, chapter, verse }) => {
    const item = document.createElement('button');
    item.className = 'result-item'; item.type = 'button';
    item.innerHTML = `<span class="result-book">${escapeHtml(localizedBookTitle(book))} ${chapter.number}:${verse.number}</span><p class="result-text">${escapeHtml(verse.text)}</p>`;
    item.addEventListener('click', () => navigateTo(book.id, chapter.number, verse.number));
    list.appendChild(item);
  });
  renderedCount = Math.min(renderedCount + RESULTS_PAGE_SIZE, currentMatches.length);
  updateSummary(summaryElement);
  showMoreButton.hidden = renderedCount >= currentMatches.length;
}

function renderResults() {
  const term = normalizeText(input.value.trim());
  results.innerHTML = '';
  renderedCount = 0;
  currentMatches = [];
  if (!term) return;
  const reference = parseReference(term);
  const matches = [];
  books.forEach((book) => book.chapters.forEach((chapter) => chapter.verses.forEach((verse) => {
    const byReference = reference && book.id === reference.book.id && chapter.number === reference.chapter && (!reference.verse || verse.number === reference.verse);
    const byText = !reference && (normalizeText(verse.text).includes(term) || normalizeText(book.title).includes(term));
    if (byReference || byText) matches.push({ book, chapter, verse });
  })));
  currentMatches = matches;
  if (!matches.length) { results.innerHTML = `<div class="empty-state">${t('noResults')}</div>`; return; }
  const summary = document.createElement('p');
  summary.className = 'search-summary';
  results.appendChild(summary);
  const list = document.createElement('div');
  list.className = 'search-results-list';
  results.appendChild(list);
  const showMoreButton = document.createElement('button');
  showMoreButton.type = 'button';
  showMoreButton.className = 'secondary-button';
  showMoreButton.textContent = t('showMoreResults');
  showMoreButton.addEventListener('click', () => appendNextResults(list, summary, showMoreButton));
  results.appendChild(showMoreButton);
  appendNextResults(list, summary, showMoreButton);
}

renderShell('search');
loadBooks().then((loaded) => { books = loaded; input.addEventListener('input', renderResults); }).catch((error) => renderError(results, error));
