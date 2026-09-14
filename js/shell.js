import { applyLanguage, getLanguage, setLanguage, t } from './i18n.js?v=34';
import { isLanguageOfflineReady, ensureLanguageOfflineReady, getSpanishVersion, setSpanishVersion } from './core.js?v=31';

export function renderShell(activePage) {
  applyLanguage();
  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) manifest.href = `./manifest-${getLanguage()}.json`;
  const brandEyebrow = document.querySelector('.brand-link .eyebrow');
  if (brandEyebrow) brandEyebrow.textContent = t('studyDesk');
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.textContent = t(link.dataset.nav);
    if (link.dataset.nav === activePage) link.setAttribute('aria-current', 'page');
  });
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-nav');
  if (!menuButton || !nav) return;
  const languageControl = document.createElement('label');
  languageControl.className = 'language-control';
  languageControl.innerHTML = `<span>${t('language')}</span><select aria-label="${t('language')}"><option value="es">ES</option><option value="en">EN</option><option value="de">DE</option></select>`;
  const languageSelect = languageControl.querySelector('select');
  languageSelect.value = getLanguage();
  languageSelect.addEventListener('change', () => setLanguage(languageSelect.value));
  nav.appendChild(languageControl);

  if (getLanguage() === 'es') {
    const versionControl = document.createElement('label');
    versionControl.className = 'language-control version-control';
    versionControl.innerHTML = `<span>${t('spanishVersion')}</span><select aria-label="${t('spanishVersion')}"><option value="onbv">${t('onbvVersion')}</option><option value="rv1909">${t('rv1909Version')}</option></select>`;
    const versionSelect = versionControl.querySelector('select');
    versionSelect.value = getSpanishVersion();
    versionSelect.addEventListener('change', () => {
      setSpanishVersion(versionSelect.value);
      window.location.reload();
    });
    if (getSpanishVersion() === 'onbv') {
      const versionLicense = document.createElement('a');
      versionLicense.className = 'version-license';
      versionLicense.href = 'https://creativecommons.org/licenses/by-sa/4.0/';
      versionLicense.target = '_blank';
      versionLicense.rel = 'noreferrer';
      versionLicense.textContent = t('onbvLicense');
      versionControl.append(versionLicense);
    }
    nav.appendChild(versionControl);
  }

  const offlineStatus = document.createElement('span');
  offlineStatus.className = 'offline-status';
  offlineStatus.setAttribute('role', 'status');
  offlineStatus.setAttribute('aria-live', 'polite');
  offlineStatus.textContent = t('offlineChecking');
  nav.appendChild(offlineStatus);
  initOfflineStatus(offlineStatus, getLanguage());

  renderFooter();

  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? t('closeMenu') : t('openMenu'));
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', t('openMenu'));
    }
  });
}

// Pie de página con aviso de copyright y privacidad, compartido por todas las páginas.
function renderFooter() {
  let footer = document.querySelector('.site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'site-footer';
    const copyright = document.createElement('p');
    copyright.className = 'site-footer-copyright';
    const privacy = document.createElement('p');
    privacy.className = 'site-footer-privacy';
    const attribution = document.createElement('p');
    attribution.className = 'site-footer-attribution';
    footer.append(copyright, privacy, attribution);
    document.body.appendChild(footer);
  }
  footer.querySelector('.site-footer-copyright').textContent = t('copyrightNotice').replace('{year}', new Date().getFullYear());
  footer.querySelector('.site-footer-privacy').textContent = t('privacyNote');
  renderBibleAttribution(footer.querySelector('.site-footer-attribution'));
}

function appendAttributionLink(target, label, href) {
  target.append(' · ');
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = label;
  target.append(link);
}

function renderBibleAttribution(attribution) {
  attribution.replaceChildren();
  const language = getLanguage();
  if (language === 'es' && getSpanishVersion() === 'onbv') {
    attribution.append(t('onbvAttribution'));
    appendAttributionLink(attribution, t('onbvLicense'), 'https://creativecommons.org/licenses/by-sa/4.0/');
    appendAttributionLink(attribution, t('onbvSource'), 'https://open.bible/bibles/biblica-open-nueva-biblia-viva');
    attribution.append(` · ${t('onbvNoEndorsement')}`);
    return;
  }
  if (language === 'es') {
    attribution.append(t('rv1909Attribution'));
    appendAttributionLink(attribution, t('rv1909Source'), 'https://ebible.org/Bible/details.php?id=spaRV1909');
    return;
  }
  if (language === 'en') {
    attribution.append(t('webpbAttribution'));
    appendAttributionLink(attribution, t('webpbSource'), 'https://ebible.org/bible/details.php?id=engwebpb');
    return;
  }
  attribution.append(t('schlachterAttribution'));
  appendAttributionLink(attribution, t('schlachterLicense'), 'https://creativecommons.org/licenses/by/4.0/');
  appendAttributionLink(attribution, t('schlachterSource'), 'https://ebible.org/Bible/details.php?id=deu1951');
}

// Registra y espera el Service Worker antes de comprobar/asegurar la disponibilidad offline: en la
// primera visita no hay ningún control todavía, así que revisar la caché antes de este punto siempre
// daría "no disponible" aunque el fetch de aseguramiento nunca llegó a pasar por el Service Worker.
async function initOfflineStatus(offlineStatus, language) {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
    } catch (error) { /* seguimos sin Service Worker: quedará marcado como no disponible offline */ }
  }
  const ready = await isLanguageOfflineReady(language);
  offlineStatus.textContent = ready ? t('offlineReady') : t('offlineNotReady');
  if (!ready && navigator.onLine) {
    const nowReady = await ensureLanguageOfflineReady(language);
    offlineStatus.textContent = nowReady ? t('offlineReady') : t('offlineNotReady');
  }
}

export function renderError(target, error) {
  const knownKeys = ['loadErrorNetwork', 'loadErrorContent'];
  const message = knownKeys.includes(error?.message) ? t(error.message) : t('loadErrorGeneric');
  target.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  const text = document.createElement('p');
  text.textContent = message;
  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'hero-button';
  retryButton.textContent = t('retry');
  retryButton.addEventListener('click', () => window.location.reload());
  wrapper.append(text, retryButton);
  target.appendChild(wrapper);
}
