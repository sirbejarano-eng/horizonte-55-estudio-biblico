import { renderShell } from './shell.js?v=15';
import { getLanguage } from './i18n.js?v=35';
import { localizeEdenStudy } from './eden-content.js?v=2';

renderShell('reader');
localizeEdenStudy(getLanguage());

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
imageDialog.addEventListener('click', (event) => {
  if (event.target === imageDialog) imageDialog.close();
});
imageDialog.addEventListener('close', () => imageOpener?.focus());
