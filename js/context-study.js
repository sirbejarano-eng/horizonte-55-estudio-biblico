import { renderShell } from './shell.js?v=15';
import { getLanguage } from './i18n.js?v=36';

const setText = (root, selector, value) => {
  const element = root?.querySelector(selector);
  if (element) element.textContent = value;
};

function setPair(element, pair) {
  if (!element || !pair) return;
  setText(element, 'dt', pair[0]);
  setText(element, 'dd', pair[1]);
}

function setLabeledText(element, pair) {
  if (!element || !pair) return;
  const label = element.querySelector('strong');
  if (label) label.textContent = pair[0];
  if (element.lastChild) element.lastChild.textContent = ` ${pair[1]}`;
}

function localizeContextStudy(copy, language) {
  const content = copy[language] || copy.es;
  const main = document.getElementById('main');
  document.title = content.metaTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', content.metaDescription);

  const hero = main.querySelector('.context-study-hero');
  setText(hero, '.eyebrow', content.hero[0]); setText(hero, 'h1', content.hero[1]); setText(hero, 'h1 + p', content.hero[2]);
  setLabeledText(hero.querySelector('.context-study-outcome'), [content.hero[3], content.hero[4]]);
  const heroLinks = hero.querySelectorAll('.hero-actions a'); heroLinks[0].textContent = content.hero[5]; heroLinks[1].textContent = content.hero[6];

  const facts = main.querySelector('.context-study-facts'); facts.setAttribute('aria-label', content.factsLabel);
  facts.querySelectorAll('dl > div').forEach((item, index) => setPair(item, content.facts[index]));

  const faith = main.querySelector('.context-faith-note'); [content.faith[0], content.faith[1], content.faith[2]].forEach((value, index) => setText(faith, ['.eyebrow', 'h2', 'h2 + p'][index], value));
  const sections = main.querySelectorAll(':scope > .context-section');
  const observation = sections[0];
  setText(observation, '.eyebrow', content.observation.heading[0]); setText(observation, 'h2', content.observation.heading[1]); setText(observation, 'h2 + p', content.observation.prompt);
  setText(observation, 'summary', content.observation.answerLabel); observation.querySelector('.context-table-wrap').setAttribute('aria-label', content.observation.tableLabel);
  observation.querySelectorAll('thead th').forEach((cell, index) => { cell.textContent = content.observation.headers[index]; });
  observation.querySelectorAll('tbody tr').forEach((row, rowIndex) => row.querySelectorAll('th, td').forEach((cell, cellIndex) => { cell.textContent = content.observation.rows[rowIndex][cellIndex]; }));
  setText(observation, '.context-observation-note', content.observation.note);
  setText(sections[1], '.eyebrow', content.known[0]); setText(sections[1], 'h2', content.known[1]); setText(sections[1], '.context-bridge', content.known[2]);
  sections[1].querySelectorAll('.context-card').forEach((card, index) => { const item = content.certainty[index]; setText(card, '.context-badge', item[0]); setText(card, 'h3', item[1]); setText(card, 'p', item[2]); });

  setText(sections[2], '.eyebrow', content.views[0]); setText(sections[2], 'h2', content.views[1]); setText(sections[2], '.context-view-instruction', content.views[2]);
  sections[2].querySelectorAll('.context-card').forEach((card, index) => {
    const item = content.theories[index]; const figure = card.querySelector('figure'); const button = figure.querySelector('button'); const image = figure.querySelector('img');
    setText(card, 'h3', item.title); button.dataset.imageTitle = item.title; button.dataset.imageCaption = item.caption; button.setAttribute('aria-label', item.aria); image.alt = item.alt; setText(button, 'span', content.expand); setText(figure, 'figcaption', item.caption);
    const directParagraphs = Array.from(card.children).filter((node) => node.tagName === 'P');
    setText(card, 'h4:nth-of-type(1)', content.proposal); directParagraphs[0].textContent = item.body; setText(card, 'h4:nth-of-type(2)', content.explain); directParagraphs[1].textContent = item.support; setText(card, 'h4:nth-of-type(3)', content.difficulty); directParagraphs[2].textContent = item.limit;
    const sourceParagraph = directParagraphs[3]; const links = Array.from(sourceParagraph.querySelectorAll('a')); sourceParagraph.replaceChildren(); const strong = document.createElement('strong'); strong.textContent = item.source; sourceParagraph.append(strong, ' ');
    links.forEach((link, linkIndex) => { link.textContent = item.sourceLinks[linkIndex]; if (linkIndex > 0) sourceParagraph.append(language === 'de' ? ' und ' : language === 'en' ? ' and ' : ' y '); sourceParagraph.append(link); }); sourceParagraph.append('.');
  });

  setText(sections[3], '.eyebrow', content.comparison[0]); setText(sections[3], 'h2', content.comparison[1]); sections[3].querySelector('.context-table-wrap').setAttribute('aria-label', content.comparisonLabel);
  sections[3].querySelectorAll('thead th').forEach((cell, index) => { cell.textContent = content.headers[index]; });
  sections[3].querySelectorAll('tbody tr').forEach((row, rowIndex) => row.querySelectorAll('th, td').forEach((cell, cellIndex) => { cell.textContent = content.rows[rowIndex][cellIndex]; }));
  const method = sections[3].querySelector('.context-method-note'); method.querySelector('strong').textContent = content.method[0]; method.lastChild.textContent = ` ${content.method[1]}`;

  [content.conclusion[0], content.conclusion[1], content.conclusion[2], content.conclusion[3]].forEach((value, index) => setText(sections[4], ['.eyebrow', 'h2', 'h2 + p', 'h2 + p + p'][index], value));
  setText(sections[5], '.eyebrow', content.reflection.heading[0]); setText(sections[5], 'h2', content.reflection.heading[1]);
  sections[5].querySelectorAll('.context-learning-card').forEach((item, index) => { setText(item, 'h3', content.reflection.items[index][0]); setText(item, ':scope > p', content.reflection.items[index][1]); setText(item, 'summary', content.reflection.answerLabel); setText(item, 'details p', content.reflection.items[index][2]); });
  setText(sections[5], '.context-return-link', content.reflection.link); setLabeledText(sections[5].querySelector('.context-takeaway'), content.reflection.takeaway);

  setText(sections[6], '.eyebrow', content.glossary[0]); setText(sections[6], 'h2', content.glossary[1]); sections[6].querySelectorAll('dl > div').forEach((item, index) => setPair(item, content.glossaryEntries[index]));
  setText(sections[7], '.eyebrow', content.editorial[0]); setText(sections[7], 'h2', content.editorial[1]); sections[7].querySelectorAll('dl > div').forEach((item, index) => setPair(item, content.editorialEntries[index]));
  const ai = sections[7].querySelector('.context-ai-note'); ai.querySelector('strong').textContent = content.ai[0]; ai.lastChild.textContent = ` ${content.ai[1]}`;
  setText(sections[8], '.eyebrow', content.sources[0]); setText(sections[8], 'h2', content.sources[1]); sections[8].querySelectorAll('ol > li').forEach((item, index) => { const link = item.querySelector('a'); item.replaceChildren(link, ` — ${content.sourceNotes[index]}`); });

  document.querySelector('[data-action="close-image-dialog"]')?.setAttribute('aria-label', content.close);
}

function enableImageDialog() {
  const imageDialog = document.getElementById('contextImageDialog');
  const dialogImage = document.getElementById('contextImageDialogImage');
  const dialogTitle = document.getElementById('contextImageDialogTitle');
  const dialogCaption = document.getElementById('contextImageDialogCaption');
  let imageOpener = null;

  document.querySelectorAll('.context-image-open').forEach((button) => {
    button.addEventListener('click', () => {
      const thumbnail = button.querySelector('img');
      imageOpener = button;
      dialogImage.src = button.dataset.imageSrc || thumbnail?.src || '';
      dialogImage.alt = thumbnail?.alt || '';
      dialogTitle.textContent = button.dataset.imageTitle || '';
      dialogCaption.textContent = button.dataset.imageCaption || '';
      imageDialog.showModal();
    });
  });

  imageDialog.querySelector('[data-action="close-image-dialog"]').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', (event) => { if (event.target === imageDialog) imageDialog.close(); });
  imageDialog.addEventListener('close', () => imageOpener?.focus());
}

export function startContextStudy(copy) {
  renderShell('reader');
  localizeContextStudy(copy, getLanguage());
  enableImageDialog();
}
