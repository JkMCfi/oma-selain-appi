let tabs = [];
let activeTabId = null;

const tabBar = document.getElementById('tab-bar');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarksBar = document.getElementById('bookmarks-bar');

const HOME_URL = 'https://html.duckduckgo.com/html/';

function createTab(initialUrl = HOME_URL) {
  const tabId = 'tab-' + Date.now();
  
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.id = tabId;
  tabElement.innerHTML = `
    <span class="tab-title">Ladataan...</span>
    <span class="close-tab" title="Sulje">&times;</span>
  `;

  const iframe = document.createElement('iframe');
  iframe.className = 'view-pane';
  iframe.dataset.id = tabId;
  iframe.src = initialUrl;

  contentArea.appendChild(iframe);
  tabBar.insertBefore(tabElement, newTabBtn);

  const tabData = { id: tabId, tabElement, iframe, url: initialUrl };
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

function switchTab(tabId) {
  activeTabId = tabId;
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.tabElement.classList.add('active');
      tab.iframe.classList.add('active');
      urlBar.value = tab.url;
    } else {
      tab.tabElement.classList.remove('active');
      tab.iframe.classList.remove('active');
    }
  });
}

function closeTab(tabId) {
  if (tabs.length === 1) return;

  const index = tabs.findIndex(t => t.id === tabId);
  if (index !== -1) {
    tabs[index].tabElement.remove();
    tabs[index].iframe.remove();
    tabs.splice(index, 1);

    if (activeTabId === tabId) {
      const nextTab = tabs[Math.max(0, index - 1)];
      switchTab(nextTab.id);
    }
  }
}

function updateTabTitle(tabData, url) {
  let title = 'Uusi välilehti';
  if (url.includes('duckduckgo.com')) {
    title = 'Haku';
  } else if (url.includes('wikipedia.org')) {
    title = 'Wikipedia';
  } else {
    try {
      const parsed = new URL(url);
      title = parsed.hostname.replace('www.', '');
    } catch (e) {
      title = url.substring(0, 15);
    }
  }
  tabData.tabElement.querySelector('.tab-title').textContent = title;
}

function navigate() {
  if (!activeTabId) return;
  let input = urlBar.value.trim();
  if (!input) return;

  let finalUrl = input;

  const blockedSites = ['youtube.com', 'google.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com'];
  const isBlocked = blockedSites.some(site => input.toLowerCase().includes(site));

  if (isBlocked || (!input.startsWith('http://') && !input.startsWith('https://') && (!input.includes('.') || input.includes(' ')))) {
    finalUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(input);
  } else if (!input.startsWith('http://') && !input.startsWith('https://')) {
    finalUrl = 'https://' + input;
  }

  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    currentTab.url = finalUrl;
    currentTab.iframe.src = finalUrl;
    updateTabTitle(currentTab, finalUrl);
  }
}

// Tapahtumakuuntelijat
document.getElementById('go-btn').addEventListener('click', navigate);
urlBar.addEventListener('keypress', (e) => { if (e.key === 'Enter') navigate(); });
newTabBtn.addEventListener('click', () => createTab(HOME_URL));

document.getElementById('home-btn').addEventListener('click', () => {
  urlBar.value = HOME_URL;
  navigate();
});

document.getElementById('reload-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) currentTab.iframe.src = currentTab.iframe.src;
});

document.getElementById('back-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.iframe.contentWindow) {
    try { currentTab.iframe.contentWindow.history.back(); } catch (e) {}
  }
});

document.getElementById('forward-btn').addEventListener('click', () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.iframe.contentWindow) {
    try { currentTab.iframe.contentWindow.history.forward(); } catch (e) {}
  }
});

// Kirjanmerkkien klikkaus
bookmarksBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('bookmark-item')) {
    const targetUrl = e.target.dataset.url;
    if (targetUrl) {
      urlBar.value = targetUrl;
      navigate();
    }
  }
});

// Käynnistetään ensimmäinen välilehti
createTab(HOME_URL);