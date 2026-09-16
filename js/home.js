import { loadBooks, getReadingPosition, getCompletedChapters, navigateTo, totalChapters, totalCompleted, escapeHtml } from './core.js?v=31';
import { renderError, renderShell } from './shell.js?v=15';
import { t, localizedBookTitle } from './i18n.js?v=35';

const app = document.getElementById('homeApp');

function renderHome(books) {
  const position = getReadingPosition(books) || { bookId: books[0].id, chapter: books[0].chapters[0].number };
  const book = books.find((item) => item.id === position.bookId) || books[0];
  const completed = getCompletedChapters(books);
  app.innerHTML = `<section class="home-hero"><div><p class="eyebrow hero-eyebrow">${t('studyDesk')}</p><h1>${t('heroTitle')}</h1><p>${t('heroIntro')}</p><div class="hero-actions"><a class="hero-button" href="./biblioteca.html">${t('library')}</a><a class="hero-link dark-link" href="./buscar.html">${t('searchBible')}</a></div></div><div class="hero-stats"><strong>${books.length} ${t('books')} · ${totalChapters(books)} ${t('chapters')}</strong><span>${t('catalogPhase')} · ${totalCompleted(books, completed)} ${t('chaptersCompleted')}</span></div></section><section class="home-grid"><article class="feature-panel"><p class="eyebrow">${t('reader')}</p><h2>${escapeHtml(localizedBookTitle(book))} ${position.chapter}</h2><p>${t('savedLocally')}</p><button class="hero-button" type="button">${t('continueReading')}</button></article><article class="feature-panel daily-home"><p class="eyebrow">${t('timeline')}</p><h2>${t('contextTitle')}</h2><p>${t('contextIntro')}</p><a class="hero-link dark-link" href="./cronologia.html">${t('timeline')}</a></article></section>`;
  app.querySelector('button').addEventListener('click', () => navigateTo(book.id, position.chapter));
}

renderShell('home');
loadBooks().then(renderHome).catch((error) => renderError(app, error));
