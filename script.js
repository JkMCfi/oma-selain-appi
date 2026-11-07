// --- SELAINSOVELLUKSEN PÄÄLOGIIKKA ---

let tabs = [];
let activeTabId = null;
let historyLog = [];

const tabBar = document.getElementById('tab-bar');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarksBar = document.getElementById('bookmarks-bar');

// Lista tunnetuista sivustoisesta, jotka estävät iframe-upotuksen
const BLOCKED_DOMAINS = [
  'youtube.com', 'youtu.be', 'google.com', 'facebook.com', 
  'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 
  'reddit.com', 'netflix.com', 'yle.fi', 'hs.fi'
];

// Hakukoneen osoite upotuksille
const SEARCH_ENGINE_URL = 'https://html.duckduckgo.com/html/?q=';

// Luodaan aloitusnäkymä DOM-elementtinä
function createHomeScreen(tabId) {
  const container = document.createElement('div');
  container.className = 'home-screen view-pane';
  container.dataset.id = tabId;

  container.innerHTML = `
    <div class="home-title">🚀 Oma Browser</div>
    <div class="search-box-home">
      <input type="text" class="home-search-input" placeholder="Hae verkosta..." />
      <button class="home-search-btn">Hae</button>
    </div>
    <div class="shortcuts">
      <div class="shortcut-card" data-url="https://fi.wikipedia.org">📚 Wikipedia</div>
      <div class="shortcut-card" data-url="https://html.duckduckgo.com/html/?q=uutiset">📰 Uutiset</div>
      <div class="shortcut-card" data-url="https://example.com">🌐 Example</div>
      <div class="shortcut-card" data-url="https://html.duckduckgo.com/html/?q=youtube">▶️ YouTube Haku</div>
    </div>
  `;

  const searchInput = container.querySelector('.home-search-input');
  const searchBtn = container.querySelector('.home-search-btn');

  const executeHomeSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      navigateToUrl(tabId, query);
    }
  };

  searchBtn.addEventListener('click', executeHomeSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeHomeSearch();
  });

  container.querySelectorAll('.shortcut-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetUrl = card.dataset.url;
      if (targetUrl) navigateToUrl(tabId, targetUrl);
    });
  });

  return container;
}

// Luodaan uusi välilehti
function createTab(initialUrl = null) {
  const tabId = 'tab-' + Date.now();

  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.id = tabId;
  tabElement.innerHTML = `
    <span class="tab-title">${initialUrl ? 'Ladataan...' : 'Uusi välilehti'}</span>
    <span class="close-tab" title="Sulje">&times;</span>
  `;

  let viewPane;
  if (!initialUrl) {
    viewPane = createHomeScreen(tabId);
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
    url: initialUrl || 'about:blank',
    isHome: !initialUrl
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

  if (initialUrl) {
    updateTabTitle(tabData, initialUrl);
  }
}

// Vaihdetaan aktiivista välilehteä
function switchTab(tabId) {
  activeTabId = tabId;

  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.tabElement.classList.add('active');
      tab.viewPane.classList.add('active');
      urlBar.value = tab.isHome ? '' : tab.url;
    } else {
      tab.tabElement.classList.remove('active');
      tab.viewPane.classList.remove('active');
    }
  });
}

// Suljetaan välilehti
function closeTab(tabId) {
  if (tabs.length === 1) {
    // Jos kyseessä on viimeinen välilehti, nollataan se aloitussivuksi
    const lastTab = tabs[0];
    navigateToUrl(lastTab.id, null);
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

// Osoitteen ja haun formatointi
function formatUrl(input) {
  if (!input) return 'about:blank';
  let query = input.trim();

  // Tarkistetaan onko sivusto iframe-estolistalla
  const isBlocked = BLOCKED_DOMAINS.some(domain => query.toLowerCase().includes(domain));

  if (isBlocked || (!query.startsWith('http://') && !query.startsWith('https://') && (!query.includes('.') || query.includes(' ')))) {
    return SEARCH_ENGINE_URL + encodeURIComponent(query);
  } else if (!query.startsWith('http://') && !query.startsWith('https://')) {
    return 'https://' + query;
  }

  return query;
}

// Navigoidaan tiettyyn URL-osoitteeseen
function navigateToUrl(tabId, rawInput) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  if (!rawInput) {
    // Palaa aloitussivulle
    tab.isHome = true;
    tab.url = 'about:blank';

    const oldPane = tab.viewPane;
    tab.viewPane = createHomeScreen(tabId);
    contentArea.replaceChild(tab.viewPane, oldPane);
    
    updateTabTitle(tab, 'Uusi välilehti');
    switchTab(tabId);
    return;
  }

  const finalUrl = formatUrl(rawInput);
  tab.isHome = false;
  tab.url = finalUrl;

  if (tab.viewPane.tagName !== 'IFRAME') {
    const newIframe = document.createElement('iframe');
    newIframe.className = 'view-pane';
    newIframe.dataset.id = tabId;
    contentArea.replaceChild(newIframe, tab.viewPane);
    tab.viewPane = newIframe;
  }

  tab.viewPane.src = finalUrl;
  updateTabTitle(tab, rawInput);
  switchTab(tabId);

  // Tallennetaan historiaan
  historyLog.push({ timestamp: new Date().toLocaleTimeString(), url: finalUrl });
}

// Päivitetään välilehden otsikko
function updateTabTitle(tabData, text) {
  let title = 'Sivu';
  if (tabData.isHome) {
    title = 'Uusi välilehti';
  } else if (text.includes('duckduckgo.com')) {
    title = 'Haku';
  } else if (text.includes('wikipedia.org')) {
    title = 'Wikipedia';
  } else {
    try {
      const parsed = new URL(formatUrl(text));
      title = parsed.hostname.replace('www.', '');
    } catch (e) {
      title = text.substring(0, 12);
    }
  }
  tabData.tabElement.querySelector('.tab-title').textContent = title;
}

// Navigointipalkin kuuntelijat
document.getElementById('go-btn').addEventListener('click', () => {
  if (activeTabId) navigateToUrl(activeTabId, urlBar.value);
});

urlBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && activeTabId) {
    navigateToUrl(activeTabId, urlBar.value);
  }
});

newTabBtn.addEventListener('click', () => createTab());

document.getElementById('home-btn').addEventListener('click', () => {
  if (activeTabId) navigateToUrl(activeTabId, null);
});

document.getElementById('reload-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && !currentTab.isHome && currentTab.viewPane.tagName === 'IFRAME') {
    currentTab.viewPane.src = currentTab.viewPane.src;
  }
});

document.getElementById('back-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.viewPane.contentWindow) {
    try { currentTab.viewPane.contentWindow.history.back(); } catch (e) {}
  }
});

document.getElementById('forward-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.viewPane.contentWindow) {
    try { currentTab.viewPane.contentWindow.history.forward(); } catch (e) {}
  }
});

// Kirjanmerkit
bookmarksBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('bookmark-item')) {
    const targetUrl = e.target.dataset.url;
    if (targetUrl && activeTabId) {
      navigateToUrl(activeTabId, targetUrl);
    }
  }
});

// Käynnistetään ensimmäinen välilehti aloitussivuna
createTab();