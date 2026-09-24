import { loadBooks, getReadingPosition, getCompletedChapters, navigateTo, totalChapters, totalCompleted, escapeHtml } from './core.js?v=32';
import { renderError, renderShell } from './shell.js?v=15';
import { t, localizedBookTitle } from './i18n.js?v=35';

const app = document.getElementById('homeApp');

// La portada se pinta al instante con los textos fijos. Solo las cifras y el capítulo para
// continuar dependen del catálogo (varios MB), así que se rellenan cuando termina de cargar.
function renderFrame() {
  app.innerHTML = `<section class="home-hero"><div><p class="eyebrow hero-eyebrow">${t('studyDesk')}</p><h1>${t('heroTitle')}</h1><p>${t('heroIntro')}</p><div class="hero-actions"><a class="hero-button" href="./biblioteca.html">${t('library')}</a><a class="hero-link dark-link" href="./buscar.html">${t('searchBible')}</a></div></div><div class="hero-stats" aria-busy="true" aria-live="polite"><strong data-home="counts">66 ${t('books')} · 1189 ${t('chapters')}</strong><span data-home="progress">${t('catalogPhase')}</span></div></section><section class="home-grid"><article class="feature-panel"><p class="eyebrow">${t('reader')}</p><h2 data-home="position">${t('continueReading')}</h2><p>${t('savedLocally')}</p><button class="hero-button" type="button" disabled>${t('continueReading')}</button></article><article class="feature-panel daily-home"><p class="eyebrow">${t('timeline')}</p><h2>${t('contextTitle')}</h2><p>${t('contextIntro')}</p><a class="hero-link dark-link" href="./cronologia.html">${t('timeline')}</a></article></section>`;
}

function fillData(books) {
  const position = getReadingPosition(books) || { bookId: books[0].id, chapter: books[0].chapters[0].number };
  const book = books.find((item) => item.id === position.bookId) || books[0];
  const completed = getCompletedChapters(books);
  const stats = app.querySelector('.hero-stats');
  app.querySelector('[data-home="counts"]').textContent = `${books.length} ${t('books')} · ${totalChapters(books)} ${t('chapters')}`;
  app.querySelector('[data-home="progress"]').textContent = `${t('catalogPhase')} · ${totalCompleted(books, completed)} ${t('chaptersCompleted')}`;
  stats.removeAttribute('aria-busy');
  app.querySelector('[data-home="position"]').innerHTML = `${escapeHtml(localizedBookTitle(book))} ${position.chapter}`;
  const button = app.querySelector('.feature-panel button');
  button.disabled = false;
  button.addEventListener('click', () => navigateTo(book.id, position.chapter));
}

renderShell('home');
renderFrame();
loadBooks().then(fillData).catch((error) => renderError(app, error));
