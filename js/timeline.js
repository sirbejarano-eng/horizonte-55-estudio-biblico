import { renderShell } from './shell.js?v=14';
import { navigateTo } from './core.js?v=31';
import { getLanguage, getTimelineMilestones, t } from './i18n.js?v=34';

const track = document.getElementById('timelineTrack');
const contextMap = document.getElementById('contextMap');

const language = getLanguage();
contextMap.src = `./assets/mapa-${language}.png`;
contextMap.alt = language === 'de'
  ? 'Biblische Karte von Ägypten, Jerusalem, Kanaan und Mesopotamien'
  : language === 'en'
    ? 'Biblical map of Egypt, Jerusalem, Canaan and Mesopotamia'
    : 'Mapa bíblico de Egipto, Jerusalén, Canaán y Mesopotamia';

function renderTimeline() {
  getTimelineMilestones().forEach((milestone, index) => {
    const item = document.createElement('article');
    item.className = `timeline-item ${index % 2 ? 'timeline-item-offset' : ''}`;
    item.innerHTML = `<div class="timeline-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div><div class="timeline-card"><p class="eyebrow">${milestone.period}</p><h3>${milestone.title}</h3><p class="timeline-region">${milestone.region}</p><p>${milestone.text}</p><button class="hero-button" type="button">${t('openReference')} ${milestone.bookTitle} ${milestone.chapter}</button></div>`;
    item.querySelector('button').addEventListener('click', () => navigateTo(milestone.book, milestone.chapter));
    track.appendChild(item);
  });
}

renderShell('timeline');
renderTimeline();
