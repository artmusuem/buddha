// File: /js/config.js
(function () {
  const host = window.location.hostname;

  // Detect platform
  const IS_GITHUB = host.includes('github.io');
  const IS_NETLIFY = host.includes('netlify.app');
  const BASE_PATH = IS_GITHUB ? '/buddha' : '';

  // Core asset paths
  const CONFIG = {
    IS_GITHUB,
    IS_NETLIFY,
    BASE_PATH,
    DATA_FILENAME: 'statues.json',
    DATA_PATH: `${BASE_PATH}/data/statues.json`,
    IMAGE_PATH: `${BASE_PATH}/images/`,
    CSS_PATH: `${BASE_PATH}/css/style.css`,
    JS_PATH: `${BASE_PATH}/js/`,
    PAGE_PATH: `${BASE_PATH}/page-templates/`,
    HOME_PAGE: `${BASE_PATH}/index.html`
  };

  // Attach to global scope
  window.CONFIG = CONFIG;

  // Optional debug
  console.log('[CONFIG LOADED]', CONFIG);
})();
