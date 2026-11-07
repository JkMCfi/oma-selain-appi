// --- CATBROWSER ENGINE ---

let tabs = [];
let activeTabId = null;

const tabBar = document.getElementById('tab-bar');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarksBar = document.getElementById('bookmarks-bar');

// CatBrowserin oma sisäinen domain
const CAT_APPS_DOMAIN = 'catbrowser://apps';

// Toimiva hakukone (Bing toimii luotettavammin iframe-upotuksissa)
const SEARCH_ENGINE_URL = 'https://www.bing.com/search?q=';

// Sivustot, jotka estävät upotuksen – ohjataan suoraan Bing-hakuun
const BLOCKED_SITES = [
  'youtube.com', 'youtu.be', 'google.com', 'facebook.com', 
  'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 
  'reddit.com', 'netflix.com', 'yle.fi', 'hs.fi'
];

// Luodaan sisäinen CatApp-domain-sivu
function createCatAppsScreen(tabId) {
  const container = document.createElement('div');
  container.className = 'custom-page view-pane';
  container.dataset.id = tabId;

  container.innerHTML = `
    <div class="brand-title">CatBrowser 🐱</div>
    <div class="sub-title">Osoite: <b>catbrowser://apps</b></div>
    
    <div class="search-box-home">
      <input type="text" class="home-search-input" placeholder="Hae verkosta Bingillä..." />
      <button class="home-search-btn">Hae</button>
    </div>

    <div class="app-grid">
      <div class="app-card" data-url="https://fi.wikipedia.org">
        <div class="app-icon">📚</div>
        <div class="app-name">Wikipedia</div>
      </div>
      <div class="app-card" data-url="https://www.bing.com">
        <div class="app-icon">🔍</div>
        <div class="app-name">Bing Haku</div>
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
      <div class="app-card" data-url="catbrowser://apps">
        <div class="app-icon">🐱</div>
        <div class="app-name">Cat Apps</div>
      </div>
    </div>
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
  if (initialUrl === CAT_APPS_DOMAIN) {
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

  if (query === CAT_APPS_DOMAIN) return CAT_APPS_DOMAIN;

  const isBlocked = BLOCKED_SITES.some(domain => query.toLowerCase().includes(domain));

  if (isBlocked || (!query.startsWith('http://') && !query.startsWith('https://') && (!query.includes('.') || query.includes(' ')))) {
    return SEARCH_ENGINE_URL + encodeURIComponent(query);
  } else if (!query.startsWith('http://') && !query.startsWith('https://')) {
    return 'https://' + query;
  }

  return query;
}

// Navigointi
function navigateToUrl(tabId, rawInput) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const finalUrl = formatUrl(rawInput);
  tab.url = finalUrl;

  // Tallenna omaan historia-pinoon toimivia takaisin-nappeja varten
  if (tab.historyStack[tab.historyIndex] !== finalUrl) {
    tab.historyStack = tab.historyStack.slice(0, tab.historyIndex + 1);
    tab.historyStack.push(finalUrl);
    tab.historyIndex = tab.historyStack.length - 1;
  }

  if (finalUrl === CAT_APPS_DOMAIN) {
    const oldPane = tab.viewPane;
    tab.viewPane = createCatAppsScreen(tabId);
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

  updateTabTitle(tab, finalUrl);
  switchTab(tabId);
}

// Takaisin- ja eteenpäin-näppäinten logiikka
function goBack() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.historyIndex > 0) {
    tab.historyIndex--;
    const prevUrl = tab.historyStack[tab.historyIndex];
    navigateToUrl(tab.id, prevUrl);
  }
}

function goForward() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.historyIndex < tab.historyStack.length - 1) {
    tab.historyIndex++;
    const nextUrl = tab.historyStack[tab.historyIndex];
    navigateToUrl(tab.id, nextUrl);
  }
}

function updateTabTitle(tabData, text) {
  let title = 'Cat Apps';
  if (text === CAT_APPS_DOMAIN) {
    title = 'Cat Apps';
  } else if (text.includes('bing.com')) {
    title = 'Bing Haku';
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

// Kuuntelijat
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

// Toimivat takaisin- ja eteenpäin-napit
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