// --- CATBROWSER ENGINE v2.0 ---

let tabs = [];
let activeTabId = null;

const tabBar = document.getElementById('tab-bar');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarksBar = document.getElementById('bookmarks-bar');

const CAT_APPS_DOMAIN = 'catbrowser://apps';

// Luodaan sisäinen CatApp-domain-sivu
function createCatAppsScreen(tabId, searchQuery = '') {
  const container = document.createElement('div');
  container.className = 'custom-page view-pane';
  container.dataset.id = tabId;

  let searchResultsHtml = '';
  if (searchQuery) {
    searchResultsHtml = `
      <div class="search-results-area">
        <h3 style="color: #cba6f7; margin-bottom: 10px;">Hakutulokset hakusanalle: "${searchQuery}"</h3>
        <div class="result-card">
          <div class="result-title" onclick="navigateToUrl('${tabId}', 'https://fi.wikipedia.org/wiki/${encodeURIComponent(searchQuery)}')">📚 Wikipedia: ${searchQuery}</div>
          <div class="result-snippet">Avaa artikkeli "${searchQuery}" suoraan Suomen Wikipediasta.</div>
        </div>
        <div class="result-card">
          <div class="result-title" onclick="navigateToUrl('${tabId}', 'https://example.com')">🌐 Verkkosivu: Example.com</div>
          <div class="result-snippet">Valmis testiverkkosivu, joka sallii kaikkien selaimien upotuksen.</div>
        </div>
        <div class="result-card">
          <div class="result-title" onclick="navigateToUrl('${tabId}', '${CAT_APPS_DOMAIN}')">🐱 Cat Apps Portaali</div>
          <div class="result-snippet">Palaa takaisin CatBrowserin omaan sovellusvalikkoon.</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="brand-title">CatBrowser 🐱</div>
    <div class="sub-title">Osoite: <b>${searchQuery ? 'catbrowser://search?q=' + encodeURIComponent(searchQuery) : 'catbrowser://apps'}</b></div>
    
    <div class="search-box-home">
      <input type="text" class="home-search-input" placeholder="Hae CatBrowserilla..." value="${searchQuery}" />
      <button class="home-search-btn">Hae</button>
    </div>

    ${searchResultsHtml}

    ${!searchQuery ? `
    <div class="app-grid">
      <div class="app-card" data-url="https://fi.wikipedia.org">
        <div class="app-icon">📚</div>
        <div class="app-name">Wikipedia</div>
      </div>
      <div class="app-card" data-url="https://example.com">
        <div class="app-icon">🌐</div>
        <div class="app-name">Example Web</div>
      </div>
      <div class="app-card" data-url="https://archive.org">
        <div class="app-icon">🏛️</div>
        <div class="app-name">Internet Archive</div>
      </div>
      <div class="app-card" data-url="https://openstreetmap.org">
        <div class="app-icon">🗺️</div>
        <div class="app-name">Kartat</div>
      </div>
      <div class="app-card" data-url="${CAT_APPS_DOMAIN}">
        <div class="app-icon">🐱</div>
        <div class="app-name">Cat Apps</div>
      </div>
    </div>
    ` : ''}
  `;

  const searchInput = container.querySelector('.home-search-input');
  const searchBtn = container.querySelector('.home-search-btn');

  const executeSearch = () => {
    const q = searchInput.value.trim();
    if (q) navigateToUrl(tabId, q);
  };

  searchBtn.addEventListener('click', executeSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
  });

  container.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      const u = card.dataset.url;
      if (u) navigateToUrl(tabId, u);
    });
  });

  return container;
}

// Luodaan välilehti
function createTab(initialUrl = CAT_APPS_DOMAIN) {
  const tabId = 'tab-' + Date.now();

  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.id = tabId;
  tabElement.innerHTML = `
    <span class="tab-title">Cat Apps</span>
    <span class="close-tab" title="Sulje">&times;</span>
  `;

  let viewPane;
  if (initialUrl.startsWith(CAT_APPS_DOMAIN)) {
    viewPane = createCatAppsScreen(tabId);
  } else {
    viewPane = document.createElement('iframe');
    viewPane.className = 'view-pane';
    viewPane.dataset.id = tabId;
    viewPane.src = formatUrl(initialUrl);
  }

  contentArea.appendChild(viewPane);
  tabBar.insertBefore(tabElement, newTabBtn);

  const tabData = {
    id: tabId,
    tabElement: tabElement,
    viewPane: viewPane,
    url: initialUrl,
    historyStack: [initialUrl],
    historyIndex: 0
  };

  tabs.push(tabData);
  switchTab(tabId);

  tabElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab')) {
      e.stopPropagation();
      closeTab(tabId);
    } else {
      switchTab(tabId);
    }
  });

  updateTabTitle(tabData, initialUrl);
}

// Vaihdetaan välilehteä
function switchTab(tabId) {
  activeTabId = tabId;

  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.tabElement.classList.add('active');
      tab.viewPane.classList.add('active');
      urlBar.value = tab.url;
    } else {
      tab.tabElement.classList.remove('active');
      tab.viewPane.classList.remove('active');
    }
  });
}

// Suljetaan välilehti
function closeTab(tabId) {
  if (tabs.length === 1) {
    navigateToUrl(tabs[0].id, CAT_APPS_DOMAIN);
    return;
  }

  const index = tabs.findIndex(t => t.id === tabId);
  if (index !== -1) {
    tabs[index].tabElement.remove();
    tabs[index].viewPane.remove();
    tabs.splice(index, 1);

    if (activeTabId === tabId) {
      const nextTab = tabs[Math.max(0, index - 1)];
      switchTab(nextTab.id);
    }
  }
}

// Osoitteen muotoilu
function formatUrl(input) {
  if (!input) return CAT_APPS_DOMAIN;
  let query = input.trim();

  if (query.startsWith('catbrowser://')) return query;
  if (query.startsWith('http://') || query.startsWith('https://')) return query;

  if (query.includes('.') && !query.includes(' ')) {
    return 'https://' + query;
  }

  return CAT_APPS_DOMAIN + '?q=' + encodeURIComponent(query);
}

// Navigointi
function navigateToUrl(tabId, rawInput) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const isSearch = !rawInput.startsWith('http://') && !rawInput.startsWith('https://') && !rawInput.startsWith('catbrowser://') && (!rawInput.includes('.') || rawInput.includes(' '));
  const finalUrl = isSearch ? CAT_APPS_DOMAIN + '?q=' + encodeURIComponent(rawInput) : formatUrl(rawInput);

  tab.url = finalUrl;

  if (tab.historyStack[tab.historyIndex] !== finalUrl) {
    tab.historyStack = tab.historyStack.slice(0, tab.historyIndex + 1);
    tab.historyStack.push(finalUrl);
    tab.historyIndex = tab.historyStack.length - 1;
  }

  if (finalUrl.startsWith(CAT_APPS_DOMAIN)) {
    const searchQuery = finalUrl.includes('?q=') ? decodeURIComponent(finalUrl.split('?q=')[1]) : '';
    const oldPane = tab.viewPane;
    tab.viewPane = createCatAppsScreen(tabId, searchQuery);
    contentArea.replaceChild(tab.viewPane, oldPane);
  } else {
    if (tab.viewPane.tagName !== 'IFRAME') {
      const newIframe = document.createElement('iframe');
      newIframe.className = 'view-pane';
      newIframe.dataset.id = tabId;
      contentArea.replaceChild(newIframe, tab.viewPane);
      tab.viewPane = newIframe;
    }
    tab.viewPane.src = finalUrl;
  }

  updateTabTitle(tab, rawInput);
  switchTab(tabId);
}

// Takaisin- ja eteenpäin-näppäimet
function goBack() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.historyIndex > 0) {
    tab.historyIndex--;
    navigateToUrl(tab.id, tab.historyStack[tab.historyIndex]);
  }
}

function goForward() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.historyIndex < tab.historyStack.length - 1) {
    tab.historyIndex++;
    navigateToUrl(tab.id, tab.historyStack[tab.historyIndex]);
  }
}

function updateTabTitle(tabData, text) {
  let title = 'Cat Apps';
  if (text.startsWith(CAT_APPS_DOMAIN) || text === '') {
    title = 'Cat Apps';
  } else if (text.includes('wikipedia.org')) {
    title = 'Wikipedia';
  } else {
    try {
      const parsed = new URL(text);
      title = parsed.hostname.replace('www.', '');
    } catch (e) {
      title = text.substring(0, 12);
    }
  }
  tabData.tabElement.querySelector('.tab-title').textContent = title;
}

// Tapahtumakuuntelijat
document.getElementById('go-btn').addEventListener('click', () => {
  if (activeTabId) navigateToUrl(activeTabId, urlBar.value);
});

urlBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && activeTabId) {
    navigateToUrl(activeTabId, urlBar.value);
  }
});

newTabBtn.addEventListener('click', () => createTab(CAT_APPS_DOMAIN));
document.getElementById('home-btn').addEventListener('click', () => {
  if (activeTabId) navigateToUrl(activeTabId, CAT_APPS_DOMAIN);
});

document.getElementById('reload-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.viewPane.tagName === 'IFRAME') {
    currentTab.viewPane.src = currentTab.viewPane.src;
  }
});

document.getElementById('back-btn').addEventListener('click', goBack);
document.getElementById('forward-btn').addEventListener('click', goForward);

bookmarksBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('bookmark-item')) {
    const targetUrl = e.target.dataset.url;
    if (targetUrl && activeTabId) {
      navigateToUrl(activeTabId, targetUrl);
    }
  }
});

// Käynnistys
createTab(CAT_APPS_DOMAIN);